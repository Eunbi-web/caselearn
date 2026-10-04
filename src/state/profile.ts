// Profile content — the Profile folder on the home page, the ID card, the
// fandoms chips and the footer name.
//   • Supabase configured → the single `profile` row wins once loaded
//     (edit it in the Supabase table editor, or via any SQL client).
//   • No Supabase → the defaults in src/data/profile.ts.

import { useEffect, useMemo, useState } from 'react';
import { profile as staticProfile } from '../data/profile';
import { hasSupabase, supabase } from '../lib/supabase';

export type Profile = typeof staticProfile;

let remote: Profile | null = null;
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

async function loadRemoteProfile(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    if (!data) return;
    remote = {
      name: data.name ?? staticProfile.name,
      caseNumber: data.case_number ?? '',
      sign: data.sign ?? '',
      dob: data.dob ?? '',
      citizen: data.citizen ?? '',
      motto: data.motto ?? '',
      extra: data.extra ?? '',
      noteTitle: data.note_title ?? 'NOTE!!',
      noteText: data.note_text ?? '',
      fandoms: Array.isArray(data.fandoms) ? data.fandoms : [],
    };
    notify();
  } catch (error) {
    console.error('[case-file] loading profile:', error);
  }
}

if (hasSupabase) {
  void loadRemoteProfile();
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getProfileVersion(): number {
  return version;
}

export function resolveProfile(): Profile {
  return remote ?? staticProfile;
}

export function useProfile(): Profile {
  const [v, setV] = useState(version);
  useEffect(() => subscribeProfile(() => setV(getProfileVersion())), []);
  return useMemo(() => resolveProfile(), [v]);
}
