// Entry progress — the "mark as done" checkmarks behind the progress board.
//   • Supabase configured → entry_progress table, shared with every visitor.
//   • No Supabase → localStorage, exactly like before.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Course } from '../data/cases';
import { hasSupabase, supabase } from '../lib/supabase';
import { getEntryUuid, whenCoursesReady } from './edits';

const STORAGE_KEY = 'case-file:done-entries';

type DoneState = Record<string, boolean>;

const readState = (): DoneState => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as DoneState) : {};
  } catch {
    return {};
  }
};

// --- shared store ------------------------------------------------------------

let state: DoneState = hasSupabase ? {} : readState();
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getProgressVersion(): number {
  return version;
}

function reportDbError(action: string, error: { message: string } | null): void {
  const message = error?.message ?? 'unknown error';
  console.error(`[case-file] ${action}:`, message);
  window.alert(`Database error while ${action}:\n${message}`);
}

if (hasSupabase && supabase) {
  void (async () => {
    const courses = await whenCoursesReady();
    const uuidToCode = new Map<string, string>();
    for (const course of courses) for (const entry of course.entries) {
      const uuid = getEntryUuid(entry.id);
      if (uuid) uuidToCode.set(uuid, entry.id);
    }
    const { data, error } = await supabase.from('entry_progress').select('entry_id, done');
    if (error) { reportDbError('loading progress', error); return; }
    const dbState: DoneState = {};
    for (const row of (data ?? []) as { entry_id: string; done: boolean }[]) {
      if (!row.done) continue;
      const code = uuidToCode.get(row.entry_id);
      if (code) dbState[code] = true;
    }
    state = dbState;
    notify();
  })();
}

// --- hook --------------------------------------------------------------------

export const useProgress = (courses: Course[]) => {
  const [v, setV] = useState(version);
  useEffect(() => subscribeProgress(() => setV(getProgressVersion())), []);

  const done = state;

  const markDone = useCallback((entryId: string) => {
    const client = supabase;
    if (client && hasSupabase) {
      state = { ...state, [entryId]: true };
      notify();
      void (async () => {
        await whenCoursesReady();
        const uuid = getEntryUuid(entryId);
        if (!uuid) return;
        const { error } = await client.from('entry_progress').upsert({ entry_id: uuid, done: true });
        if (error) reportDbError('marking entry done', error);
      })();
      return;
    }
    state = { ...state, [entryId]: true };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
    notify();
  }, []);

  const isDone = useCallback((entryId: string) => Boolean(done[entryId]), [done]);

  const getCourseProgress = useCallback((course: Course) => {
    const completed = course.entries.filter((item) => done[item.id]).length;
    return {
      completed,
      total: course.entries.length,
      percent: course.entries.length ? Math.round((completed / course.entries.length) * 100) : 0,
    };
  }, [done]);

  const overall = useMemo(() => {
    const allEntries = courses.reduce((total, course) => total + course.entries.length, 0);
    const completed = courses.reduce((total, course) => total + course.entries.filter((item) => done[item.id]).length, 0);
    return { completed, total: allEntries, percent: allEntries ? Math.round((completed / allEntries) * 100) : 0 };
  }, [courses, done]);

  return { done, markDone, isDone, getCourseProgress, overall };
};
