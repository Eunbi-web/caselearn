// Editable entries — assignments can be renamed, rewritten, added and deleted
// from the site. Two storage modes:
//
//   • Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set) — the entries
//     table is the source of truth; edits go straight to the database and are
//     shared with every visitor. Writes are owner-only (enforced by RLS).
//   • No Supabase — everything is stored in localStorage on top of the default
//     data in src/data/cases.ts, so edits survive refreshes without a backend.

import { useEffect, useMemo, useState } from 'react';
import { courses as defaultCourses, type Course, type Entry } from '../data/cases';
import { hasSupabase, newId, supabase } from '../lib/supabase';

const STORAGE_KEY = 'case-file:entry-edits';

type EntryOverride = Partial<Omit<Entry, 'id' | 'slug'>> & { deleted?: boolean };

type EditsState = {
  overrides: Record<string, EntryOverride>;
  custom: Record<string, Entry[]>; // custom entries, by course slug
};

// --- remote (Supabase) state --------------------------------------------------

type SubjectRow = {
  id: string; slug: string; case_number: string; title: string; short_title: string;
  description: string; folder_note: string; icon: Course['icon'];
};

type EntryRow = {
  id: string; subject_id: string; code: string; slug: string; title: string; entry_date: string;
  about: string; description: string; key_points: string[]; notes: string[];
  task: string; wrap_up: string;
};

let remoteCourses: Course[] | null = null;
let coursesReady: Promise<Course[]> = Promise.resolve(defaultCourses);
const subjectUuid = new Map<string, string>(); // slug → uuid
const entryUuid = new Map<string, string>(); // code → uuid

function reportDbError(action: string, error: { message: string } | null): void {
  const message = error?.message ?? 'unknown error';
  console.error(`[case-file] ${action}:`, message);
  window.alert(`Database error while ${action}:\n${message}`);
}

async function loadRemoteCourses(): Promise<Course[]> {
  if (!supabase) return defaultCourses;
  const [subjects, entries] = await Promise.all([
    supabase.from('subjects').select('*').order('sort_order'),
    supabase.from('entries').select('*').order('entry_date').order('sort_order').order('created_at'),
  ]);
  if (subjects.error) reportDbError('loading subjects', subjects.error);
  if (entries.error) reportDbError('loading entries', entries.error);
  if (subjects.error || entries.error) return remoteCourses ?? defaultCourses;

  const subjectRows = subjects.data as SubjectRow[];
  const entryRows = entries.data as EntryRow[];
  const bySubject = new Map<string, EntryRow[]>();
  for (const row of entryRows) {
    const list = bySubject.get(row.subject_id) ?? [];
    list.push(row);
    bySubject.set(row.subject_id, list);
  }
  subjectUuid.clear();
  entryUuid.clear();
  remoteCourses = subjectRows.map((subject) => {
    subjectUuid.set(subject.slug, subject.id);
    const entries: Entry[] = (bySubject.get(subject.id) ?? []).map((row) => {
      entryUuid.set(row.code, row.id);
      return {
        id: row.code,
        slug: row.slug,
        title: row.title,
        date: row.entry_date,
        dateLabel: formatDateLabel(row.entry_date),
        about: row.about,
        description: row.description,
        keyPoints: row.key_points ?? [],
        notes: row.notes ?? [],
        task: row.task,
        wrapUp: row.wrap_up,
      };
    });
    return {
      slug: subject.slug,
      caseNumber: subject.case_number,
      title: subject.title,
      shortTitle: subject.short_title,
      description: subject.description,
      folderNote: subject.folder_note,
      icon: subject.icon,
      entries,
    };
  });
  notify();
  return remoteCourses;
}

if (hasSupabase && supabase) {
  coursesReady = loadRemoteCourses();
}

/** Resolves once the database content is loaded (immediately in local mode). */
export function whenCoursesReady(): Promise<Course[]> {
  return coursesReady;
}

// --- shared store ------------------------------------------------------------

let state: EditsState = loadLocal();
let version = 0;
const listeners = new Set<() => void>();

function loadLocal(): EditsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as EditsState;
      return { overrides: parsed.overrides ?? {}, custom: parsed.custom ?? {} };
    }
  } catch { /* keep defaults */ }
  return { overrides: {}, custom: {} };
}

function persist() {
  if (hasSupabase) return; // remote mode: the database is the record
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

/** Courses currently shown — database rows when loaded, seed data until then. */
function activeCourses(): Course[] {
  return hasSupabase && remoteCourses ? remoteCourses : defaultCourses;
}

/** Newest first — topics/posts are listed with the latest one on top. */
function byDateDesc(a: { date: string }, b: { date: string }): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

export function resolveCourse(course: Course): Course {
  const defaults = course.entries.map(applyOverride).filter((entry): entry is Entry => entry !== null);
  const custom = (state.custom[course.slug] ?? []).map(applyOverride).filter((entry): entry is Entry => entry !== null);
  return { ...course, entries: [...defaults, ...custom].sort(byDateDesc) };
}

export function resolveCourses(): Course[] {
  if (hasSupabase) return activeCourses().map((course) => ({ ...course, entries: [...course.entries].sort(byDateDesc) }));
  return defaultCourses.map(resolveCourse);
}

export function resolveLatest(): { course: Course; entry: Entry }[] {
  return resolveCourses()
    .flatMap((course) => course.entries.map((entry) => ({ course, entry })))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1));
}

export function getResolvedCourse(slug: string): Course | undefined {
  return resolveCourses().find((course) => course.slug === slug);
}

export function getResolvedEntry(courseSlug: string, entrySlug: string): { course: Course; entry: Entry; index: number } | undefined {
  const course = getResolvedCourse(courseSlug);
  if (!course) return undefined;
  const index = course.entries.findIndex((entry) => entry.slug === entrySlug);
  if (index === -1) return undefined;
  return { course, entry: course.entries[index], index };
}

// --- mutations ---------------------------------------------------------------

function patchRemoteEntry(id: string, patch: Partial<Entry>): void {
  if (!remoteCourses) return;
  for (const course of remoteCourses) {
    const index = course.entries.findIndex((item) => item.id === id);
    if (index === -1) continue;
    course.entries = [...course.entries.slice(0, index), { ...course.entries[index], ...patch }, ...course.entries.slice(index + 1)];
    notify();
    return;
  }
}

export function saveEntryEdit(id: string, draft: Partial<Entry>): void {
  const client = supabase;
  if (client && hasSupabase) {
    void (async () => {
      await whenCoursesReady();
      const uuid = entryUuid.get(id);
      if (!uuid) { reportDbError('saving entry', { message: `unknown entry "${id}"` }); return; }
      const update: Record<string, unknown> = {};
      const patch: Partial<Entry> = {};
      if (draft.title !== undefined) { update.title = draft.title; patch.title = draft.title; }
      if (draft.date !== undefined) { update.entry_date = draft.date; patch.date = draft.date; patch.dateLabel = formatDateLabel(draft.date); }
      if (draft.about !== undefined) { update.about = draft.about; patch.about = draft.about; }
      if (draft.description !== undefined) { update.description = draft.description; patch.description = draft.description; }
      if (draft.keyPoints !== undefined) { update.key_points = draft.keyPoints; patch.keyPoints = draft.keyPoints; }
      if (draft.notes !== undefined) { update.notes = draft.notes; patch.notes = draft.notes; }
      if (draft.task !== undefined) { update.task = draft.task; patch.task = draft.task; }
      if (draft.wrapUp !== undefined) { update.wrap_up = draft.wrapUp; patch.wrapUp = draft.wrapUp; }
      patchRemoteEntry(id, patch);
      const { error } = await client.from('entries').update(update).eq('id', uuid);
      if (error) { reportDbError('saving entry', error); await loadRemoteCourses(); return; }
      await loadRemoteCourses();
    })();
    return;
  }
  state.overrides[id] = { ...state.overrides[id], ...draft };
  delete state.overrides[id].deleted;
  notify();
}

export function deleteEntry(course: Course, entry: Entry): void {
  const client = supabase;
  if (client && hasSupabase) {
    // optimistic removal, then re-sync with the database
    if (remoteCourses) {
      const owner = remoteCourses.find((item) => item.slug === course.slug);
      if (owner && owner.entries.some((item) => item.id === entry.id)) {
        owner.entries = owner.entries.filter((item) => item.id !== entry.id);
        notify();
      }
    }
    void (async () => {
      await whenCoursesReady();
      const uuid = entryUuid.get(entry.id);
      if (!uuid) { reportDbError('deleting entry', { message: `unknown entry "${entry.id}"` }); return; }
      const { error } = await client.from('entries').delete().eq('id', uuid);
      if (error) { reportDbError('deleting entry', error); }
      await loadRemoteCourses();
    })();
    return;
  }
  if ((state.custom[course.slug] ?? []).some((item) => item.id === entry.id)) {
    state.custom[course.slug] = (state.custom[course.slug] ?? []).filter((item) => item.id !== entry.id);
  } else {
    state.overrides[entry.id] = { ...state.overrides[entry.id], deleted: true };
  }
  notify();
}

export function addEntry(course: Course): Entry {
  const client = supabase;
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
  if (client && hasSupabase) {
    const uuid = newId();
    // optimistic: the caller navigates to the new entry right away
    if (remoteCourses) {
      const owner = remoteCourses.find((item) => item.slug === course.slug);
      if (owner) owner.entries = [...owner.entries, entry];
      notify();
    }
    void (async () => {
      await whenCoursesReady();
      const subjectId = subjectUuid.get(course.slug);
      if (!subjectId) { reportDbError('adding entry', { message: 'unknown subject' }); return; }
      const { error } = await client.from('entries').insert({
        id: uuid,
        subject_id: subjectId,
        code: entry.id,
        slug: entry.slug,
        title: entry.title,
        entry_date: iso,
      });
      if (error) { reportDbError('adding entry', error); return; }
      entryUuid.set(entry.id, uuid);
      await loadRemoteCourses();
    })();
    return entry;
  }
  state.custom[course.slug] = [...(state.custom[course.slug] ?? []), entry];
  notify();
  return entry;
}

// --- hooks -------------------------------------------------------------------

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
