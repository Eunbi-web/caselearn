import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Course } from '../data/cases';

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

export const useProgress = (courses: Course[]) => {
  const [done, setDone] = useState<DoneState>(readState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  }, [done]);

  const markDone = useCallback((entryId: string) => {
    setDone((current) => ({ ...current, [entryId]: true }));
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
