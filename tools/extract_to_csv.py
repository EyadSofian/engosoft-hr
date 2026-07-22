# -*- coding: utf-8 -*-
"""
Engosoft HR — workbook → Google-Sheet-ready CSV extractor.

Reads the five source Excel files and writes one flat, single-header-row CSV per
Google Sheet tab into ``data/csv/``. Every output is UTF-8 with BOM (opens
cleanly in both Excel and Google Sheets), dates are ISO ``YYYY-MM-DD`` and times
are ``HH:MM`` so Sheets parses them natively.

Usage:
    python tools/extract_to_csv.py [--src DIR] [--out DIR]
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import pandas as pd

# ── Source workbooks ──────────────────────────────────────────────────────────
SOURCES = {
    "salary": "تقرير المرتبات سنوي و المؤشرات7-2026.xlsx",
    "db": "Final Engosoft Data-Base (1).xlsx",
    "qscore": "Employee_Quarterly_Scorecard.xlsx",
    "kpi": "Engosoft_Unified_KPI_Scorecard_Dashboard.xlsx",
    "recruit": "تقرير طلبات التوظف لشهر 7-2026 (2).xlsx",
}

# ── Value canonicalisation ────────────────────────────────────────────────────
# Only unambiguous case/typo variants of the SAME value are folded together, so
# that grouping and filtering in the dashboard don't split one category in two.
CANON = {
    "In-active": "In-Active",
    "Inactive": "In-Active",
    "Full-Time": "Full Time",
    "Full time": "Full Time",
    "Part time": "Part Time",
    "Part-Time": "Part Time",
    "muslim": "Muslim",
    "christian": "Christian",
    "saturday": "Saturday",
    "hold": "Hold",
    "Wiat": "Wait",
    "Noraml": "Normal",
    "New ": "New",
}


# Google Sheets silently coerces anything that *looks* like a date or a time on
# import, and the original text is lost. Two real cases bit us:
#   "APR-01"      -> 1 April          (any 3-letter month prefix does this)
#   "10000:12000" -> 10200:00:00      (read as hours:minutes)
# So ranges are written with a spaced hyphen, and no generated code may start
# with a month abbreviation. See MONTH_PREFIXES below.
RANGE_COLON = re.compile(r"(?<=\d):(?=\d)")

MONTH_PREFIXES = {
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
}


def desheetify(s: str) -> str:
    """Rewrite text that Google Sheets would otherwise eat on import."""
    # "10000:12000" and "400:500 Per Hour" become "10000 - 12000" / "400 - 500 …".
    return RANGE_COLON.sub(" - ", s)


def clean_scalar(v):
    """Normalise one cell into a Sheets-friendly scalar."""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    if isinstance(v, pd.Timestamp):
        v = v.to_pydatetime()
    if isinstance(v, dt.datetime):
        # Excel stores bare times as 1899/1900-dated datetimes.
        if v.year <= 1900:
            return v.strftime("%H:%M")
        return v.strftime("%Y-%m-%d")
    if isinstance(v, dt.date):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, dt.time):
        return v.strftime("%H:%M")
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, str):
        s = re.sub(r"\s+", " ", v).strip()
        return desheetify(CANON.get(s, s))
    return v


def clean_header(h, i: int) -> str:
    if h is None or (isinstance(h, float) and pd.isna(h)):
        return f"Column {i + 1}"
    s = re.sub(r"\s+", " ", str(h)).strip()
    return s or f"Column {i + 1}"


def dedupe(names: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    out: list[str] = []
    for n in names:
        if n in seen:
            seen[n] += 1
            out.append(f"{n} {seen[n] + 1}")
        else:
            seen[n] = 0
            out.append(n)
    return out


def table(raw: pd.DataFrame, header_row: int, first_data_row: int | None = None,
          last_data_row: int | None = None) -> pd.DataFrame:
    """Slice a raw (header=None) frame into a clean single-header table."""
    first = header_row + 1 if first_data_row is None else first_data_row
    last = len(raw) if last_data_row is None else last_data_row
    headers = dedupe([clean_header(h, i) for i, h in enumerate(raw.iloc[header_row])])
    body = raw.iloc[first:last].copy()
    body.columns = headers
    body = body.applymap(clean_scalar)
    # Drop rows and columns that carry nothing at all.
    body = body.loc[~(body == "").all(axis=1)]
    body = body.loc[:, ~(body == "").all(axis=0) | pd.Series(
        [h != "" for h in body.columns], index=body.columns)]
    return body.reset_index(drop=True)


def write(df: pd.DataFrame, out_dir: Path, name: str, log: list[str]) -> None:
    path = out_dir / f"{name}.csv"
    df.to_csv(path, index=False, encoding="utf-8-sig")
    log.append(f"  {name:<22} {len(df):>4} rows × {len(df.columns):>2} cols")


def rid(prefix: str, n: int) -> list[str]:
    if prefix.upper() in MONTH_PREFIXES:
        raise ValueError(f"RID prefix {prefix!r} is a month — Sheets would read it as a date.")
    return [f"{prefix}-{i + 1:04d}" for i in range(n)]


# ── Builders ──────────────────────────────────────────────────────────────────
def build_employees(src: Path) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES["db"], sheet_name="Engosoft Data-Base",
                        header=None, engine="openpyxl")
    df = table(raw, header_row=1)
    df = df[df["Emp ID"] != ""]
    return df


def salary_period(filename: str) -> str:
    """The period comes from the filename (``…7-2026.xlsx`` → ``2026-07``).

    The workbook's own period header is a date cell that Excel already read with
    the wrong day/month order, so it cannot be trusted; the filename can.
    """
    m = re.search(r"(\d{1,2})-(\d{4})", filename)
    return f"{m.group(2)}-{int(m.group(1)):02d}" if m else ""


def build_salaries(src: Path, period: str) -> pd.DataFrame:
    """Header spans two rows; cols 8-10 are Basic / KPIs / Total for the period."""
    raw = pd.read_excel(src / SOURCES["salary"], sheet_name=0, header=None,
                        engine="openpyxl")
    headers = [clean_header(h, i) for i, h in enumerate(raw.iloc[0][:8])]
    headers += ["Basic Salary", "KPIs Amount", "Total Salary"]
    body = raw.iloc[2:].copy()
    body.columns = headers
    body = body.applymap(clean_scalar)
    # A backtick and a lowercase header are hostile to formulas and APIs.
    body = body.rename(columns={"status": "Status", "KPI`S CONT": "KPI Eligible"})
    # Keyed on name, not Emp ID — one active employee has no ID yet. The
    # workbook's last row is a grand total with neither.
    body = body[body["Name English"] != ""]
    body.insert(0, "Period", period)
    return body.reset_index(drop=True)


def build_recruitment(src: Path) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES["recruit"], sheet_name=0, header=None,
                        engine="openpyxl")
    df = table(raw, header_row=1)
    df = df[df["NO."] != ""]                       # drops the trailing totals row
    df = df.rename(columns={"Total": "Position"})  # column is mislabeled at source
    df["Position"] = df["Position"].astype(str).str.strip()
    df.insert(0, "RID", rid("REQ", len(df)))
    if "Actual Hiring Date" not in df.columns:
        df["Actual Hiring Date"] = ""
    df["Closed At"] = ""
    df["Closed By"] = ""
    df["Updated At"] = ""
    return df.reset_index(drop=True)


def build_job_structure(src: Path) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES["db"], sheet_name="الهيكل الوظيفي بالوظائف",
                        header=None, engine="openpyxl")
    df = table(raw, header_row=3)
    df = df[df["Job Code"] != ""]
    gap = pd.to_numeric(df["Current Hired"], errors="coerce").fillna(0) - \
          pd.to_numeric(df["Forecasted Quantity"], errors="coerce").fillna(0)
    df["Gap"] = gap.astype(int)
    df["Fit"] = gap.map(lambda g: "Over" if g > 0 else ("Match" if g == 0 else "Under"))
    return df.reset_index(drop=True)


def build_kpi_library(src: Path) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES["kpi"], sheet_name="مكتبة المؤشرات",
                        header=None, engine="openpyxl")
    df = table(raw, header_row=1)
    return df[df["كود المؤشر"] != ""].reset_index(drop=True)


def build_kpi_records(src: Path) -> pd.DataFrame:
    """Empty evaluation log — keep the headers, drop the 300 blank template rows."""
    raw = pd.read_excel(src / SOURCES["kpi"], sheet_name="سجل التقييم",
                        header=None, engine="openpyxl")
    headers = dedupe([clean_header(h, i) for i, h in enumerate(raw.iloc[1])])
    df = pd.DataFrame(columns=["RID"] + headers)
    return df


def build_kpi_summary(src: Path) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES["kpi"], sheet_name="ملخص الموظفين",
                        header=None, engine="openpyxl")
    headers = dedupe([clean_header(h, i) for i, h in enumerate(raw.iloc[1])])
    return pd.DataFrame(columns=headers)


def build_appraisal_criteria(src: Path) -> pd.DataFrame:
    """The 40-item appraisal instrument: group → criterion, with its score band."""
    raw = pd.read_excel(src / SOURCES["qscore"], sheet_name="سكور كارد التقييم",
                        header=None, engine="openpyxl")
    groups, criteria = raw.iloc[1], raw.iloc[2]
    # Which of the four score buckets each group rolls up into. Verified against
    # the workbook's own totals for all three sample employees — the section
    # names are counter-intuitive (the "practical" group scores as فني and
    # "specialisation" as اداري), but this is the arithmetic the sheet uses.
    #   شخصي 70 + فني 40 + اداري 60 + سمات 30 = 200
    bucket = {
        "الشركة الأم": "تقييم شخصي",
        "الإدارة العليا": "تقييم شخصي",
        "الالتزام في العمل": "تقييم شخصي",
        "القسم أو الشعبة": "تقييم اداري",
        "مجال التخصص": "تقييم اداري",
        "القدرات والمهارات الإدارية": "تقييم اداري",
        "القدرات والمهارات العملية": "تقييم فني",
        "السمات الشخصية والعلاقات": "سمات وصفات",
    }
    rows, current = [], ""
    for i in range(5, 45):
        g = clean_scalar(groups[i])
        if g:
            current = g
        c = clean_scalar(criteria[i])
        if not c:
            continue
        rows.append({
            # "C01", not "APR-01" — Sheets reads a month prefix as a date.
            "Code": f"C{len(rows) + 1:02d}",
            "المجموعة": current,
            "المعيار": c,
            "التصنيف": bucket.get(current, ""),
            "أقل درجة": 1,
            "أعلى درجة": 5,
            "الوزن": 1,
        })
    return pd.DataFrame(rows)


def build_appraisals(src: Path) -> pd.DataFrame:
    """Wide scorecard → one row per employee, one column per criterion code."""
    raw = pd.read_excel(src / SOURCES["qscore"], sheet_name="سكور كارد التقييم",
                        header=None, engine="openpyxl")
    crit = build_appraisal_criteria(src)
    meta = [clean_header(h, i) for i, h in enumerate(raw.iloc[1][:5])]
    tail_idx = list(range(45, 54))
    tail = [clean_header(raw.iloc[1][i], i) for i in tail_idx]
    rows = []
    for r in range(3, len(raw)):
        if clean_scalar(raw.iloc[r, 1]) == "":
            continue
        rec = {m: clean_scalar(raw.iloc[r, i]) for i, m in enumerate(meta)}
        for j, code in enumerate(crit["Code"]):
            rec[code] = clean_scalar(raw.iloc[r, 5 + j])
        for i, name in zip(tail_idx, tail):
            rec[name] = clean_scalar(raw.iloc[r, i])
        rows.append(rec)
    df = pd.DataFrame(rows)
    df.insert(0, "RID", rid("EVL", len(df)))
    return df


def build_simple(src: Path, file_key: str, sheet: str, header_row: int,
                 key_col: str, prefix: str) -> pd.DataFrame:
    raw = pd.read_excel(src / SOURCES[file_key], sheet_name=sheet, header=None,
                        engine="openpyxl")
    df = table(raw, header_row=header_row)
    if key_col in df.columns:
        df = df[df[key_col] != ""]
    df = df.reset_index(drop=True)
    df.insert(0, "RID", rid(prefix, len(df)))
    return df


def build_payroll_variables() -> pd.DataFrame:
    """Monthly variables that close payroll: the join point between HR and Finance."""
    return pd.DataFrame(columns=[
        "RID", "Period", "Emp ID", "Name English", "Department", "Title",
        "Basic Salary", "KPIs Amount", "Overtime", "Bonus", "Commission",
        "Allowances", "Deductions", "Absence Days", "Penalty", "Loan Instalment",
        "Insurance", "Tax", "Net Salary", "Status", "Approved By", "Notes",
    ])


def build_training(src: Path) -> pd.DataFrame:
    """The source is a signed form, not a table — this is its tabular equivalent."""
    return pd.DataFrame(columns=[
        "RID", "Employee Name", "Emp ID", "Job Title", "Department", "Joining Date",
        "Training Program", "Provider", "Duration", "Location", "Mode",
        "Start Date", "End Date", "Cost", "Currency", "Funded By",
        "Commitment Months", "Trigger", "Status", "Result", "Certificate",
        "Score Before", "Score After", "Approved By", "Notes",
    ])


def build_lookups(emp: pd.DataFrame, jobs: pd.DataFrame, kpi: pd.DataFrame) -> pd.DataFrame:
    cols = {
        "Departments": sorted({str(v) for v in emp["Department"] if str(v).strip()}),
        "Sectors": sorted({str(v) for v in emp["Sector"] if str(v).strip()}),
        "Titles": sorted({str(v) for v in jobs["Job Title"] if str(v).strip()}),
        "KPI Categories": sorted({str(v) for v in kpi["الفئة"] if str(v).strip()}),
        "KPI Roles": sorted({str(v) for v in kpi["الدور"] if str(v).strip()}),
        "Recruitment Status": ["Active", "Hold", "Done", "Cancelled"],
        "Stage Status": ["Wait", "Done", "Hold"],
        "Priority": ["Top", "Med", "Low"],
        "Employee Status": ["Active", "In-Active"],
        "Appraisal Grade": ["ممتاز", "جيد جدًا", "جيد", "متوسط", "ضعيف"],
    }
    n = max(len(v) for v in cols.values())
    return pd.DataFrame({k: v + [""] * (n - len(v)) for k, v in cols.items()})


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(Path.home() / "Downloads"))
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "data" / "csv"))
    ap.add_argument("--period", default=None,
                    help="Salary period as YYYY-MM (default: read from the filename)")
    args = ap.parse_args()

    src, out = Path(args.src), Path(args.out)
    missing = [f for f in SOURCES.values() if not (src / f).exists()]
    if missing:
        print("Missing source workbooks in", src)
        for m in missing:
            print("  -", m)
        return 1
    out.mkdir(parents=True, exist_ok=True)

    log: list[str] = []
    emp = build_employees(src)
    jobs = build_job_structure(src)
    kpi = build_kpi_library(src)

    period = args.period or salary_period(SOURCES["salary"])
    write(emp, out, "Employees", log)
    write(build_salaries(src, period), out, "Salaries", log)
    write(build_recruitment(src), out, "Recruitment", log)
    write(jobs, out, "JobStructure", log)
    write(kpi, out, "KPI_Library", log)
    write(build_kpi_records(src), out, "KPI_Records", log)
    write(build_kpi_summary(src), out, "KPI_Summary", log)
    write(build_appraisal_criteria(src), out, "Appraisal_Criteria", log)
    write(build_appraisals(src), out, "Appraisals", log)
    write(build_simple(src, "qscore", "خطة التحسين والتوصيات", 1, "الرقم الوظيفي", "IMP"),
          out, "Improvement_Plans", log)
    write(build_simple(src, "qscore", "تقييم المبيعات والتارجت", 1, "الرقم الوظيفي", "TGT"),
          out, "Sales_Targets", log)
    write(build_training(src), out, "Training", log)
    write(build_payroll_variables(), out, "Payroll_Variables", log)
    write(build_lookups(emp, jobs, kpi), out, "Lookups", log)

    print(f"Wrote {len(log)} CSVs to {out}\n" + "\n".join(log))
    return 0


if __name__ == "__main__":
    sys.exit(main())
