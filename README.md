<div align="center">

# Engosoft HR Suite

**منظومة الموارد البشرية الحية لإنجوسوفت — تقرأ وتكتب مباشرةً في Google Sheets**
_A live, bilingual HR suite that reads from — and writes back to — one Google Spreadsheet._

</div>

---

```
Google Sheet  ──read (public gviz)──▶  Dashboard  ──write (Apps Script)──▶  Google Sheet
                                            ▲                                    │
                                            └──────── re-read after save ────────┘
```

The sheet stays the single source of truth. Anything HR changes in Sheets shows
up in the dashboard within 90 seconds; anything changed in the dashboard lands
in the sheet immediately, with the editor's name in an audit log.

## Pages

| Page | Reads | Can edit |
| --- | --- | --- |
| Overview · نظرة عامة | Employees, Recruitment, JobStructure, KPI_Library | — |
| Recruitment · التوظيف | Recruitment | status by drag-and-drop, Close / Reopen |
| Employees · الموظفين | Employees | — |
| Job structure · الهيكل الوظيفي | JobStructure | yes |
| Appraisals · تقييمات الأداء | Appraisals, Appraisal_Criteria, Improvement_Plans | yes |
| KPIs · مؤشرات الأداء | KPI_Library | — |
| Training · التدريب | Training, Improvement_Plans | add from a plan |
| **Salaries · المرتبات** | Salaries | passcode-gated |
| Settings · الإعدادات | all | — |

## Setup

### 1. Populate the spreadsheet

```bash
python tools/extract_to_csv.py --src "C:/Users/asus/Downloads" --out data/csv
```

Upload each CSV as its own tab, named exactly like the file.
[data/README.md](data/README.md) lists the tabs, the corrections the extractor
applies, and the data-quality issues it deliberately leaves alone.

Then share the spreadsheet **Anyone with the link → Viewer**.

### 2. Turn on editing (optional)

1. In the spreadsheet: **Extensions → Apps Script**, paste
   [apps-script/Code.gs](apps-script/Code.gs).
2. **Project Settings → Script properties** → add `API_TOKEN` = a long random string.
3. **Deploy → New deployment → Web app**, *Execute as* **Me**, *Who has access* **Anyone**.
4. Put the `/exec` URL and the token in `.env` (see `.env.example`).

Without this the dashboard runs fine, read-only.

### 3. Set the salary passcode

```bash
python -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].encode()).hexdigest())" "YOUR-PASSCODE"
```

Put the digest in `VITE_SALARY_PASS_HASH`. The passcode itself is never shipped.

### 4. Run

```bash
npm install && npm run dev
```

To preview before the sheet exists, set `VITE_DATA_MODE=local`: the dev server
reads `data/csv/` and accepts edits into an in-memory sandbox, so drag-and-drop
and Close can be demoed offline. Production builds ignore it entirely.

## How editing works

1. The card moves immediately (optimistic).
2. A POST goes to the Apps Script, which finds the row by its `RID` and writes
   the named cells.
3. On success the tab is re-read, so any formula the sheet recalculated comes
   back. On failure the optimistic change is **rolled back** and the error stays
   on screen until dismissed — the sheet and the screen never silently disagree.

Rows are addressed by `RID`, never by position, so re-sorting or filtering the
sheet can never send an edit to the wrong row. **Do not renumber RIDs.**

Closing a requisition sets `Status = Done` and stamps `Actual Hiring Date`,
`Closed At` and `Closed By` when they are blank — without them, time-to-hire can
never be measured.

## Security, honestly

- `VITE_WRITE_API_TOKEN` ships inside the client bundle. It gates *writes*, but
  anyone who opens the site can read it. Keep the site itself private, and
  rotate the token by changing the script property and the env var together.
- The salary gate keeps payroll off the screen of someone glancing at a shared
  laptop, and the Salaries tab is not fetched at all until it opens. It is
  **not** a server-side permission — anyone who can open the spreadsheet can
  still read that tab. Restrict it in Google Sheets too if that matters.
- Every write is appended to a hidden `_Audit` tab: timestamp, actor, action,
  sheet, key, payload.

## Deploying

**[DEPLOY.md](DEPLOY.md) — دليل النشر على Railway وتفعيل التعديل، بالعربي خطوة بخطوة.**

Any static host. `npm run build` emits `dist/` with a relative base, so GitHub
Pages, Railway, Vercel and Netlify all work unchanged; `server.mjs` and
`railway.json` are included for Railway.

`VITE_*` variables are compiled into the bundle **at build time**, not read at
runtime — adding or changing one requires a rebuild, not just a restart.

> `data/csv/*.csv` is gitignored on purpose: `Employees.csv` carries national
> IDs, addresses and phone numbers, and `Salaries.csv` carries payroll. Never
> commit them. Regenerate with `python tools/extract_to_csv.py`.

## Layout

```
src/
  config/domains.ts      tab registry + field-name resolution
  data/DataProvider.tsx  per-domain loading, optimistic edits, write queue
  lib/rows.ts            typed accessors over sheet rows
  lib/analytics.ts       one analytics function per domain
  lib/writeApi.ts        Apps Script client
  auth/SalaryGate.tsx    passcode gate
  components/            Kanban, DataTable, charts, app shell
  pages/                 one per nav entry
apps-script/Code.gs      the write API
tools/extract_to_csv.py  workbooks → CSVs
data/csv/                generated, upload-ready
```

Pages ask for fields by role — `text(ds, row, 'position')` — not by column
letter or a single hard-coded header, so renaming a column in the sheet degrades
to "column missing" rather than silently reading blanks.
