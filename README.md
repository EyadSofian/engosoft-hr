<div align="center">

# Engosoft HR — Recruitment Dashboard

**لوحة تحكم التوظيف الحية لإنجوسوفت — تُزامن مباشرةً مع Google Sheets**
_A live, bilingual recruitment dashboard that syncs straight from Google Sheets._

</div>

---

## 🇪🇬 نظرة عامة (Arabic)

لوحة تحكم احترافية للموارد البشرية مبنية لإنجوسوفت. تقرأ بيانات طلبات التوظيف **مباشرةً من Google Sheets** وتعرضها في صورة مؤشرات ورسوم بيانية أنيقة، بواجهة **عربية (RTL) وإنجليزية (LTR)**.

- **مزامنة حية:** أي تعديل في الشيت (بيانات، عناوين أعمدة، تبويبات) يظهر تلقائيًا خلال دقيقة — بدون أي ربط يدوي وبدون رفع ملفات.
- **يتكيّف مع بنية الشيت:** العناوين تُقرأ حيًّا؛ لو غيّرت اسم عمود أو أضفت تبويب شهر جديد، تتكيّف اللوحة معه.
- **لا يوجد باك-إند:** تطبيق ثابت (Static) بالكامل، سهل النشر على GitHub Pages أو Vercel.

> الشيت المصدر يجب أن يكون مشاركته «أي شخص لديه الرابط ← مُشاهِد».

## 🌍 Overview (English)

A polished HR dashboard built for Engosoft. It reads recruitment data **live from Google Sheets** and renders KPIs and charts in a clean, branded interface — fully **Arabic (RTL)** and **English (LTR)**.

- **Live sync** — any edit in the sheet (data, column headers, tabs) shows up automatically within a minute. No manual wiring, no file uploads.
- **Schema-adaptive** — headers are read at runtime; rename a column or add a new monthly tab and the dashboard adapts.
- **No backend** — a fully static app, trivial to deploy on GitHub Pages or Vercel.

---

## ✨ Features

| | |
|---|---|
| 📊 **Overview** | Hero KPIs (requests, vacancies, accepted, fill-rate), status/priority/seniority/location/vacancy donuts, department & recruiter stacked bars, hiring funnel, compensation. |
| 📋 **Positions** | Live, schema-adaptive table with search, filters (status/department/priority/location/recruiter), sortable columns, expandable Arabic notes, and CSV export. |
| 👥 **Recruiters** | Per-recruiter workload, status mix and completion rate. |
| 🔀 **Pipeline** | Requirements → Published → Candidates → Accepted funnel, per-stage breakdown, and an overdue watch-list. |
| 🌐 **Bilingual** | One-click Arabic ⇄ English, with correct RTL/LTR layout. |
| 🔴 **Live** | Auto-refresh every 60s + manual refresh, with a "last updated" indicator. |

## 🧱 Tech stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** (custom Engosoft brand system)
- **lucide-react** icons + hand-rolled SVG/CSS charts (no chart dependency)
- Data via the public **Google Visualization (gviz)** endpoint — read straight from the browser (CORS-friendly), no server needed.

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the build
```

## ⚙️ Configuration

All configuration is optional — sensible defaults ship in the code. Copy `.env.example` to `.env` to override:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SHEET_ID` | the Engosoft sheet | The Google Sheet to read (must be link-shared as Viewer). |
| `VITE_REFRESH_SECONDS` | `60` | Auto-refresh interval. |
| `VITE_GSHEET_API_KEY` | _(empty)_ | Optional Google API key (Sheets API enabled). When set, **every tab is auto-discovered** — new monthly tabs appear on their own. |

### Tabs without an API key

Without a key, the tabs listed in [`src/config/sheet.ts`](src/config/sheet.ts) (`FALLBACK_TABS`) are used. Add a new month by appending one line:

```ts
export const FALLBACK_TABS: TabInfo[] = [
  { sheet: '8-2026', labelAr: 'أغسطس 2026', labelEn: 'August 2026' },
  { sheet: '6-2026', labelAr: 'يوليو 2026',  labelEn: 'July 2026' },
  { sheet: 'Recruitment Analysis', labelAr: 'تحليل ديسمبر 2025', labelEn: 'Analysis · Dec 2025' },
];
```

`sheet` must match the Google Sheet tab name **exactly**.

## 🧠 How the sync works

The dashboard never hard-codes column letters. On every refresh it:

1. Reads **row 2** of the tab as the live header row (row 1 is the report title).
2. Maps each header to a canonical role via a fuzzy resolver in [`src/config/sheet.ts`](src/config/sheet.ts) — so renaming/reordering columns keeps working. (In this sheet, the column labelled **"Total"** actually holds the job title, and is mapped accordingly.)
3. Normalizes messy values (casing, typos like `Noraml`, trailing spaces, `EG`/`KSA`, `New`/`Replace`) into stable, colored buckets — see [`src/config/semantics.ts`](src/config/semantics.ts).
4. Recomputes all KPIs and charts. Charts appear/disappear based on which columns actually exist.

## ☁️ Deployment

### GitHub Pages (automatic)
A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys on every push to `main`.
Enable it once: **Repo → Settings → Pages → Build and deployment → Source: GitHub Actions.**

### Vercel / Netlify
Import the repo — framework preset **Vite**, build `npm run build`, output `dist`. Done. `base: './'` makes the build path-agnostic.

## 📁 Project structure

```
src/
  config/      sheet.ts (source + column resolver), semantics.ts (value buckets)
  lib/         gviz.ts (fetch+parse), sheets.ts (dataset), analytics.ts, format.ts
  i18n/        strings.ts (ar/en), LangProvider.tsx
  hooks/       useSheetData.ts (load + poll + derive)
  components/  Logo, Sidebar, Header, KpiCard, ChartCard, charts, PositionsTable, …
  pages/       Overview, Positions, Recruiters, Pipeline, About
```

---

<div align="center">
Built for <b>Engosoft</b> · لوحة إنجوسوفت للموارد البشرية
</div>
