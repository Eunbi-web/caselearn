// Editable journal posts ("LIFE UPDATES") — same pattern as entry edits.
//   • Supabase configured → journal_posts table is the source of truth.
//   • No Supabase → localStorage on top of the seed data in src/data/extras.ts.

import { useEffect, useMemo, useState } from 'react';
import { journalSeed, type JournalPost } from '../data/extras';
import { hasSupabase, newId, supabase } from '../lib/supabase';
import { formatDateLabel } from './edits';

const STORAGE_KEY = 'case-file:journal-edits';

type PostOverride = Partial<Omit<JournalPost, 'id'>> & { deleted?: boolean };

type JournalState = {
  overrides: Record<string, PostOverride>;
  custom: JournalPost[];
};

type JournalRow = { id: string; entry_date: string; title: string; body: string };

let remotePosts: JournalPost[] | null = null;
let journalReady: Promise<JournalPost[]> = Promise.resolve(journalSeed);

async function loadRemotePosts(): Promise<JournalPost[]> {
  if (!supabase) return journalSeed;
  const { data, error } = await supabase
    .from('journal_posts')
    .select('id, entry_date, title, body')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[case-file] loading journal:', error.message);
    window.alert(`Database error while loading journal:\n${error.message}`);
    return remotePosts ?? journalSeed;
  }
  remotePosts = (data as JournalRow[]).map((row) => ({
    id: row.id,
    date: row.entry_date,
    dateLabel: formatDateLabel(row.entry_date),
    title: row.title,
    body: row.body,
  }));
  notify();
  return remotePosts;
}

if (hasSupabase && supabase) {
  journalReady = loadRemotePosts();
}

// --- shared store ------------------------------------------------------------

let state: JournalState = loadLocal();
let version = 0;
const listeners = new Set<() => void>();

function loadLocal(): JournalState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as JournalState;
      return { overrides: parsed.overrides ?? {}, custom: parsed.custom ?? [] };
    }
  } catch { /* keep seed */ }
  return { overrides: {}, custom: [] };
}

function persist() {
  if (hasSupabase) return; // remote mode: the database is the record
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function notify() {
  version += 1;
  persist();
  listeners.forEach((listener) => listener());
}

export function subscribeJournal(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getJournalVersion(): number {
  return version;
}

function apply(post: JournalPost): JournalPost | null {
  const override = state.overrides[post.id];
  if (override?.deleted) return null;
  return override ? { ...post, ...override } : post;
}

export function resolvePosts(): JournalPost[] {
  if (hasSupabase && remotePosts) return remotePosts;
  const all = [...journalSeed, ...state.custom].map(apply).filter((post): post is JournalPost => post !== null);
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function savePostEdit(id: string, draft: Partial<Omit<JournalPost, 'id'>>): void {
  const client = supabase;
  if (client && hasSupabase) {
    if (remotePosts) {
      remotePosts = remotePosts.map((post) => (post.id === id ? { ...post, ...draft } : post));
      notify();
    }
    void (async () => {
      await journalReady;
      const update: Record<string, unknown> = {};
      if (draft.date !== undefined) update.entry_date = draft.date;
      if (draft.title !== undefined) update.title = draft.title;
      if (draft.body !== undefined) update.body = draft.body;
      const { error } = await client.from('journal_posts').update(update).eq('id', id);
      if (error) {
        console.error('[case-file] saving post:', error.message);
        window.alert(`Database error while saving the update:\n${error.message}`);
      }
      await loadRemotePosts();
    })();
    return;
  }
  state.overrides[id] = { ...state.overrides[id], ...draft };
  delete state.overrides[id].deleted;
  notify();
}

export function deletePost(id: string): void {
  const client = supabase;
  if (client && hasSupabase) {
    if (remotePosts) {
      remotePosts = remotePosts.filter((post) => post.id !== id);
      notify();
    }
    void (async () => {
      await journalReady;
      const { error } = await client.from('journal_posts').delete().eq('id', id);
      if (error) {
        console.error('[case-file] deleting post:', error.message);
        window.alert(`Database error while deleting the update:\n${error.message}`);
      }
      await loadRemotePosts();
    })();
    return;
  }
  if (state.custom.some((post) => post.id === id)) {
    state.custom = state.custom.filter((post) => post.id !== id);
  } else {
    state.overrides[id] = { ...state.overrides[id], deleted: true };
  }
  notify();
}

export function addPost(): JournalPost {
  const client = supabase;
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const post: JournalPost = {
    id: client ? newId() : `j-c-${now.getTime().toString(36)}`,
    date: iso,
    dateLabel: formatDateLabel(iso),
    title: 'NEW UPDATE',
    body: '',
  };
  if (client && hasSupabase) {
    // optimistic: the caller starts editing the new post right away
    if (remotePosts) {
      remotePosts = [post, ...remotePosts];
      notify();
    }
    void (async () => {
      const { error } = await client.from('journal_posts').insert({
        id: post.id,
        entry_date: post.date,
        title: post.title,
        body: post.body,
      });
      if (error) {
        console.error('[case-file] adding post:', error.message);
        window.alert(`Database error while adding the update:\n${error.message}`);
      }
      await loadRemotePosts();
    })();
    return post;
  }
  state.custom = [...state.custom, post];
  notify();
  return post;
}

export function useJournal(): JournalPost[] {
  const [v, setV] = useState(version);
  useEffect(() => subscribeJournal(() => setV(getJournalVersion())), []);
  return useMemo(() => resolvePosts(), [v]);
}
