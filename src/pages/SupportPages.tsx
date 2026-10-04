import { useState } from 'react';
import { DossierFrame, PageIntro, SectionLabel, type Navigate } from '../components/UI';
import { hasSupabase } from '../lib/supabase';
import { ownerSignIn, ownerSignOut, useOwner } from '../lib/owner';
import { useProfile } from '../state/profile';

export function AboutPage({ navigate }: { navigate: Navigate }) {
  const profile = useProfile();
  return <main className="shell page-shell about-page"><PageIntro kicker="CASE FILE / HOW IT WORKS" title="ONE FOLDER SYSTEM FOR THE WHOLE TERM" description="This site is my assignment vlog: every subject is a folder, every assignment is an entry with its description, notes, pictures, and a progress mark." /><div className="about-grid"><DossierFrame className="about-manifesto" tab="THE IDEA / 001"><SectionLabel>FIELD NOTE</SectionLabel><h2>School work, but <em>filed like a case.</em></h2><p>Each folder keeps a subject's assignments together — what the task was, what I did, what I noticed, and a photo of the result. Nothing gets lost in a pile again.</p><div className="manifesto-mark">CF<span>+</span></div></DossierFrame><div className="about-notes"><section><SectionLabel>01 / OPEN A FOLDER</SectionLabel><h3>Pick a subject.</h3><p>Five folders, one per course. The cover shows how many entries are done and how far the folder has come.</p></section><section><SectionLabel>02 / READ AN ENTRY</SectionLabel><h3>Description, notes, pictures.</h3><p>Every entry opens as a written page: the description of the assignment, my key points and notes, the task, and a photo of the work.</p></section><section><SectionLabel>03 / MARK IT DONE</SectionLabel><h3>Watch the board fill up.</h3><p>Marking an entry as done updates the folder, the board, and the progress counters everywhere — and it stays saved after a refresh.</p></section></div></div><div className="about-cta"><div><SectionLabel>START ANYWHERE</SectionLabel><h2>The newest entry is always on the home page.</h2></div><button className="button button-primary" onClick={() => navigate('/courses')}>OPEN THE FOLDERS <span>↗</span></button></div><p className="about-sig">filed by {profile.name} · case: {profile.caseNumber}</p></main>;
}

/** OWNER SIGN-IN — with a database connected, the owner signs in here to
    unlock the edit controls everywhere. Visitors never see this page linked
    prominently; it lives in the footer. */
export function OwnerPage({ navigate }: { navigate: Navigate }) {
  const { authed, ready } = useOwner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hasSupabase) {
    return <main className="shell page-shell"><PageIntro kicker="CASE FILE / OWNER" title="OWNER SIGN-IN" description="There is no database connected yet, so the site keeps everything in this browser." /><div className="menu-card owner-card"><p>Connect Supabase first: copy <b>.env.example</b> to <b>.env</b>, fill in <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b>, then restart the site. Full steps live in <b>SUPABASE-SETUP.md</b>.</p><div className="journal-actions-row"><button className="button button-ghost" onClick={() => navigate('/')}>BACK TO THE CASE FILE</button></div></div></main>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await ownerSignIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
  };

  return <main className="shell page-shell"><PageIntro kicker="CASE FILE / OWNER" title="OWNER SIGN-IN" description="Sign in to edit entries, write journal updates, mark progress, and upload photos. Without signing in, the site is a read-only vlog." /><div className="menu-card owner-card">
    {authed ? (
      <>
        <p className="owner-ok">✓ SIGNED IN — edit controls are unlocked everywhere on the site.</p>
        <div className="journal-actions-row">
          <button className="button button-ghost" onClick={() => navigate('/')}>BACK TO THE CASE FILE</button>
          <button className="button button-primary" onClick={() => { void ownerSignOut(); }}>SIGN OUT</button>
        </div>
      </>
    ) : (
      <form onSubmit={(event) => { void submit(event); }} className="owner-form">
        <label className="form-field"><span>EMAIL</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label className="form-field"><span>PASSWORD</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="owner-error">{error}</p>}
        <div className="journal-actions-row">
          <button className="button button-primary" type="submit" disabled={busy || !ready}>{busy ? 'SIGNING IN…' : 'SIGN IN'}</button>
          <button className="button button-ghost" type="button" onClick={() => navigate('/')}>CANCEL</button>
        </div>
      </form>
    )}
  </div></main>;
}

export function NotFoundPage({ navigate }: { navigate: Navigate }) {
  return <main className="shell page-shell not-found-page"><div className="not-found-card"><div className="not-found-mark">404</div><SectionLabel>NOT IN THE FILE</SectionLabel><h1>This page went missing.</h1><p>The page you requested is not in the active folders. Head back to the case file and pick another entry.</p><button className="button button-primary" onClick={() => navigate('/courses')}>BACK TO THE FOLDERS <span>↗</span></button></div></main>;
}
