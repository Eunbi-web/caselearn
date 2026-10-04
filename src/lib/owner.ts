// Owner session — tracks whether the site's owner is signed in.
//
// With Supabase configured: only the signed-in owner can write
// (the database enforces this with RLS), so edit controls appear
// after signing in on the /owner page. Visitors get the clean,
// read-only vlog.
//
// Without Supabase: everything stays editable locally, like before.

import { useEffect, useState } from 'react';
import { hasSupabase, supabase } from './supabase';

let ready = !hasSupabase; // nothing to wait for in local mode
let authed = false;
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => {
    authed = Boolean(data.session);
    ready = true;
    notify();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    authed = Boolean(session);
    ready = true;
    notify();
  });
}

export function subscribeOwner(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getOwnerVersion(): number {
  return version;
}

export function isAuthed(): boolean {
  return authed;
}

export function useOwner(): { ready: boolean; authed: boolean; canEdit: boolean } {
  const [v, setV] = useState(version);
  useEffect(() => subscribeOwner(() => setV(getOwnerVersion())), []);
  return { ready, authed, canEdit: !hasSupabase || authed };
}

/** Returns an error message on failure, null on success. */
export async function ownerSignIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured — nothing to sign in to.';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function ownerSignOut(): Promise<void> {
  await supabase?.auth.signOut();
}
