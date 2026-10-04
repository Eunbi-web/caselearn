// Supabase client — created only when both env vars are present.
// Without them the site keeps running fully client-side
// (localStorage / IndexedDB), exactly like before.
//
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SITE_PHOTOS_BUCKET = 'site-photos';

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = supabase !== null;

/** Shown in the small upload hints — different when photos go to the cloud. */
export const photoSaveHint = hasSupabase ? 'it saves to the site' : 'it saves in this browser';

/** Tiny id generator for rows created on the client (entries, posts). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
