# Engosoft HR — Google Sheet data pack

`data/csv/` holds one CSV per tab of the HR spreadsheet. Regenerate them at any
time from the source workbooks:

```bash
python tools/extract_to_csv.py --src "C:/Users/asus/Downloads" --out data/csv
```

## Uploading

In the spreadsheet: **File → Import → Upload**, pick a CSV, then choose
**Insert new sheet(s)** and separator **Comma**. Rename the new tab to exactly
the CSV's filename — the dashboard matches tabs by name, so `Recruitment.csv`
must become a tab called `Recruitment`.

Then, once for the whole spreadsheet: **Share → General access → Anyone with
the link → Viewer**. The dashboard reads over the public gviz endpoint and
cannot see a restricted sheet.

## Tabs

| Tab | Rows | Source | What it is |
| --- | ---: | --- | --- |
| `Employees` | 349 | Final Engosoft Data-Base → *Engosoft Data-Base* | Employee master record — the spine everything else joins to |
| `Salaries` | 345 | تقرير المرتبات سنوي و المؤشرات7-2026 | Basic + KPI + total per employee for one period |
| `Recruitment` | 56 | تقرير طلبات التوظف لشهر 7-2026 | Open requisitions and their pipeline stages |
| `JobStructure` | 111 | Final Engosoft Data-Base → *الهيكل الوظيفي* | Approved establishment: forecast vs. hired per job, JD/KPI links |
| `KPI_Library` | 210 | Unified KPI Dashboard → *مكتبة المؤشرات* | Master KPI catalogue, 35 roles × 7 categories |
| `KPI_Records` | 0 | Unified KPI Dashboard → *سجل التقييم* | Monthly KPI readings — empty, this is where measurement lands |
| `KPI_Summary` | 0 | Unified KPI Dashboard → *ملخص الموظفين* | Per-employee KPI roll-up |
| `Appraisal_Criteria` | 40 | Quarterly Scorecard | The appraisal instrument: 8 groups → 40 criteria, each scored 1–5 |
| `Appraisals` | 3 | Quarterly Scorecard → *سكور كارد* | One row per employee per review, one column per criterion |
| `Improvement_Plans` | 3 | Quarterly Scorecard | PIPs and manager recommendations — the training report's input |
| `Sales_Targets` | 1 | Quarterly Scorecard | Target vs. achieved for commercial roles |
| `Training` | 0 | Training Program Information | Training register (the source was a signed form, not a table) |
| `Payroll_Variables` | 0 | *new* | Monthly variables — the join between HR and Finance for payroll close |
| `Lookups` | 110 | derived | Dropdown values, so free text stops drifting |

## Protecting values from Google Sheets

Sheets silently coerces anything that *looks* like a date or a time on import,
and the original text is gone. Two real cases hit this data:

| Value | What Sheets made of it |
| --- | --- |
| `APR-01` | 1 April 2026 — **any** three-letter month prefix does this |
| `10000:12000` | `10200:00:00` — read as hours:minutes |

So the extractor now:

- names appraisal criteria `C01`…`C40`, not `APR-01` (and refuses any RID prefix
  that is a month abbreviation);
- uses `EVL-0001` for appraisal row ids;
- writes salary ranges as `10000 - 12000` instead of `10000:12000`.

If you add data by hand later, avoid both shapes.

## What the extractor changed

Nothing was invented; these are corrections applied consistently:

- **Salary period.** The workbook's period header is a date cell Excel already
  read with the wrong day/month order (it reads as January). The period is taken
  from the filename instead — `…7-2026.xlsx` → `2026-07`.
- **Merged headers flattened.** The salary sheet's two-row header became three
  plain columns: `Basic Salary`, `KPIs Amount`, `Total Salary`. `` KPI`S CONT ``
  became `KPI Eligible` (a backtick in a header breaks formulas and API reads)
  and `status` became `Status`.
- **`Total` → `Position`** in Recruitment. The column holds the job title.
- **Totals rows dropped.** Both the salary and recruitment sheets ended in a
  grand-total row with no employee or requisition on it.
- **Case and spelling variants folded** where they were plainly the same value:
  `In-active`→`In-Active`, `Full-Time`/`Full time`→`Full Time`, `hold`→`Hold`,
  `Wiat`→`Wait`, `Noraml`→`Normal`, `muslim`→`Muslim`.
- **Dates and times normalised** to `YYYY-MM-DD` and `HH:MM`.
- **`RID` added** to every editable tab (`REQ-0001`, `EVL-0001`, …). The
  dashboard writes back by RID, so re-sorting or filtering the sheet can never
  send an edit to the wrong row. **Do not reuse or renumber RIDs.**
- **`Gap` / `Fit` added** to JobStructure — hired minus forecast, and whether
  that is Under / Match / Over.
- **`Closed At` / `Closed By` / `Updated At` added** to Recruitment, filled by
  the dashboard when a requisition is closed.

## Known data-quality issues, not auto-fixed

These need a decision from HR rather than a rule:

1. **One active employee has no `Emp ID`** — Fatma Ezzat Ibrahim (SEO Content).
   Kept in `Salaries`, keyed on name.
2. **`Employees` has 349 rows but `Salaries` has 345.** Four people exist in one
   and not the other.
3. **Only 96 of 345 salary rows carry an amount.** The rest read as 0, which the
   dashboard shows as "not set" rather than a real zero.
4. **`Department` differs between tabs** — `Employees` has 14 values,
   `Salaries` has 15 (it adds `Service` and `Business Development`, and splits
   `E-Learning Sector` from `LMS`). Until these agree, department totals will
   not tie out between the employee and salary pages.
5. **`Adminstration`** is misspelled everywhere. It is consistent, so it was
   left alone — rename it in `Lookups` first if you want it fixed.
6. **`Appraisals` holds 3 sample employees**, not real ones. The instrument in
   `Appraisal_Criteria` is the real asset.
7. **`KPI_Library` roles are Arabic and do not match `JobStructure` job titles**
   (English). Mapping the 35 KPI roles onto the 111 job titles is the missing
   link between the KPI catalogue and actual people.
