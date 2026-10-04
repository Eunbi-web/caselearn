// Editable entries — assignments can be renamed, rewritten, added and deleted
// from the site. Everything is stored in localStorage on top of the default
// data in src/data/cases.ts, so edits survive refreshes without a backend.

import { useEffect, useMemo, useState } from 'react';
import { courses as defaultCourses, type Course, type Entry } from '../data/cases';

const STORAGE_KEY = 'case-file:entry-edits';

type EntryOverride = Partial<Omit<Entry, 'id' | 'slug'>> & { deleted?: boolean };

type EditsState = {
  overrides: Record<string, EntryOverride>;
  custom: Record<string, Entry[]>; // custom entries, by course slug
};

function load(): EditsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as EditsState;
      return { overrides: parsed.overrides ?? {}, custom: parsed.custom ?? {} };
    }
  } catch { /* keep defaults */ }
  return { overrides: {}, custom: {} };
}

let state: EditsState = load();
let version = 0;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full etc. */ }
}

function notify() {
  version += 1;
  persist();
  listeners.forEach((listener) => listener());
}

export function subscribeEdits(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getEditsVersion(): number {
  return version;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso.toUpperCase();
  return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')}, ${y}`;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function applyOverride(entry: Entry): Entry | null {
  const override = state.overrides[entry.id];
  if (override?.deleted) return null;
  return override ? { ...entry, ...override } : entry;
}

export function resolveCourse(course: Course): Course {
  const defaults = course.entries.map(applyOverride).filter((entry): entry is Entry => entry !== null);
  const custom = (state.custom[course.slug] ?? []).map(applyOverride).filter((entry): entry is Entry => entry !== null);
  return { ...course, entries: [...defaults, ...custom] };
}

export function resolveCourses(): Course[] {
  return defaultCourses.map(resolveCourse);
}

export function resolveLatest(): { course: Course; entry: Entry }[] {
  return resolveCourses()
    .flatMap((course) => course.entries.map((entry) => ({ course, entry })))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1));
}

export function getResolvedCourse(slug: string): Course | undefined {
  const found = defaultCourses.find((course) => course.slug === slug);
  return found ? resolveCourse(found) : undefined;
}

export function getResolvedEntry(courseSlug: string, entrySlug: string): { course: Course; entry: Entry; index: number } | undefined {
  const course = getResolvedCourse(courseSlug);
  if (!course) return undefined;
  const index = course.entries.findIndex((entry) => entry.slug === entrySlug);
  if (index === -1) return undefined;
  return { course, entry: course.entries[index], index };
}

export function saveEntryEdit(id: string, draft: Partial<Entry>): void {
  state.overrides[id] = { ...state.overrides[id], ...draft };
  delete state.overrides[id].deleted;
  notify();
}

export function deleteEntry(course: Course, entry: Entry): void {
  if ((state.custom[course.slug] ?? []).some((item) => item.id === entry.id)) {
    state.custom[course.slug] = (state.custom[course.slug] ?? []).filter((item) => item.id !== entry.id);
  } else {
    state.overrides[entry.id] = { ...state.overrides[entry.id], deleted: true };
  }
  notify();
}

export function addEntry(course: Course): Entry {
  const list = state.custom[course.slug] ?? [];
  const stamp = Date.now().toString(36).slice(-5);
  const iso = todayIso();
  const entry: Entry = {
    id: `${course.caseNumber}-C${stamp}`,
    slug: `custom-${stamp}`,
    title: 'NEW ENTRY',
    date: iso,
    dateLabel: formatDateLabel(iso),
    about: '',
    description: '',
    keyPoints: [],
    notes: [],
    task: '',
    wrapUp: '',
  };
  state.custom[course.slug] = [...list, entry];
  notify();
  return entry;
}

/** All courses with edits applied — re-renders whenever an entry changes. */
export function useCourses(): Course[] {
  const [v, setV] = useState(version);
  useEffect(() => subscribeEdits(() => setV(getEditsVersion())), []);
  return useMemo(() => resolveCourses(), [v]);
}

/** Newest entries across all folders — re-renders on edits. */
export function useLatestEntries(): { course: Course; entry: Entry }[] {
  const [v, setV] = useState(version);
  useEffect(() => subscribeEdits(() => setV(getEditsVersion())), []);
  return useMemo(() => resolveLatest(), [v]);
}
