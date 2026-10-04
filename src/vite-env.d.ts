/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** e.g. https://YOUR-PROJECT.supabase.co — omit to run fully client-side */
  readonly VITE_SUPABASE_URL?: string;
  /** the project's anon (public) key */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
