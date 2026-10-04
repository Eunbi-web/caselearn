// Editable journal posts ("LIFE UPDATES") — same pattern as entry edits.
// Stored in localStorage on top of the seed data in src/data/extras.ts.

import { useEffect, useMemo, useState } from 'react';
import { journalSeed, type JournalPost } from '../data/extras';
import { formatDateLabel } from './edits';

const STORAGE_KEY = 'case-file:journal-edits';

type PostOverride = Partial<Omit<JournalPost, 'id'>> & { deleted?: boolean };

type JournalState = {
  overrides: Record<string, PostOverride>;
  custom: JournalPost[];
};

function load(): JournalState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as JournalState;
      return { overrides: parsed.overrides ?? {}, custom: parsed.custom ?? [] };
    }
  } catch { /* keep seed */ }
  return { overrides: {}, custom: [] };
}

let state: JournalState = load();
let version = 0;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function notify() {
  version += 1;
  persist();
  listeners.forEach((listener) => listener());
}

function apply(post: JournalPost): JournalPost | null {
  const override = state.overrides[post.id];
  if (override?.deleted) return null;
  return override ? { ...post, ...override } : post;
}

export function subscribeJournal(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getJournalVersion(): number {
  return version;
}

export function resolvePosts(): JournalPost[] {
  const all = [...journalSeed, ...state.custom].map(apply).filter((post): post is JournalPost => post !== null);
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function savePostEdit(id: string, draft: Partial<Omit<JournalPost, 'id'>>): void {
  state.overrides[id] = { ...state.overrides[id], ...draft };
  delete state.overrides[id].deleted;
  notify();
}

export function deletePost(id: string): void {
  if (state.custom.some((post) => post.id === id)) {
    state.custom = state.custom.filter((post) => post.id !== id);
  } else {
    state.overrides[id] = { ...state.overrides[id], deleted: true };
  }
  notify();
}

export function addPost(): JournalPost {
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const post: JournalPost = {
    id: `j-c-${now.getTime().toString(36)}`,
    date: iso,
    dateLabel: formatDateLabel(iso),
    title: 'NEW UPDATE',
    body: '',
  };
  state.custom = [...state.custom, post];
  notify();
  return post;
}

export function useJournal(): JournalPost[] {
  const [v, setV] = useState(version);
  useEffect(() => subscribeJournal(() => setV(getJournalVersion())), []);
  return useMemo(() => resolvePosts(), [v]);
}
