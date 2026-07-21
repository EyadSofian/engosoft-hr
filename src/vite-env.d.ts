/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEET_ID?: string;
  readonly VITE_REFRESH_SECONDS?: string;
  readonly VITE_GSHEET_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
