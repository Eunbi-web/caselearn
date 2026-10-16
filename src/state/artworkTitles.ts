// Editable artwork titles on the Personal Portfolio page ("Artwork 01" →
// anything). Two storage modes:
//   • Supabase configured → synced through the `artwork_titles` table
//     (same anon read/write rules as everything else) so renames are shared
//     with every visitor. If that table isn't created in the database yet,
//     the module quietly keeps titles in localStorage instead.
//   • No Supabase → titles live in localStorage on top of the defaults,
//     exactly like the other editable content.

import { hasSupabase, supabase } from '../lib/supabase';

const STORAGE_KEY = 'case-file:artwork-titles';

const cache = new Map<string, string | null>();
const listeners = new Map<string, Set<(title: string) => void>>();

function loadLocal(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveLocal(map: Record<string, string>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* storage full etc. */ }
}

/** Stored title for an artwork slot, or null when it still has its default. */
export async function getArtworkTitle(slot: string): Promise<string | null> {
  if (cache.has(slot)) return cache.get(slot) ?? null;
  let title: string | null = null;
  const client = supabase;
  if (client && hasSupabase) {
    try {
      const { data, error } = await client.from('artwork_titles').select('title').eq('slot', slot).maybeSingle();
      if (!error && data) title = (data.title as string) ?? null;
    } catch {
      // table missing / network hiccup — localStorage carries the title
    }
  }
  if (title === null) title = loadLocal()[slot] ?? null;
  cache.set(slot, title);
  return title;
}

export async function saveArtworkTitle(slot: string, title: string): Promise<void> {
  const trimmed = title.trim();
  cache.set(slot, trimmed.length ? trimmed : null);
  emit(slot);

  const local = loadLocal();
  if (trimmed) local[slot] = trimmed;
  else delete local[slot];
  saveLocal(local);

  const client = supabase;
  if (client && hasSupabase) {
    try {
      if (!trimmed) {
        await client.from('artwork_titles').delete().eq('slot', slot);
      } else {
        const { error } = await client.from('artwork_titles').upsert({ slot, title: trimmed });
        if (error) console.warn('[case-file] artwork title kept locally:', error.message);
      }
    } catch {
      // remote unavailable — the local copy above still holds the rename
    }
  }
}

export function subscribeArtworkTitle(slot: string, listener: (title: string) => void): () => void {
  let set = listeners.get(slot);
  if (!set) {
    set = new Set();
    listeners.set(slot, set);
  }
  set.add(listener);
  return () => { set.delete(listener); };
}

function emit(slot: string): void {
  const value = cache.get(slot);
  listeners.get(slot)?.forEach((listener) => listener(value ?? ''));
}
