import { useState } from 'react';
import type { Course } from '../data/cases';
import { useOwner } from '../lib/owner';
import { photoSaveHint } from '../lib/supabase';
import { useCourses, useLatestEntries } from '../state/edits';
import { useProfile } from '../state/profile';
import { Polaroid } from '../components/Photo';
import { CourseCard, PageIntro, SectionLabel, type Navigate } from '../components/UI';

type Progress = { completed: number; total: number; percent: number };

export function HomePage({ navigate, overall, getCourseProgress }: { navigate: Navigate; overall: Progress; getCourseProgress: (course: Course) => Progress }) {
  const [open, setOpen] = useState(false);
  const courses = useCourses();
  const latest = useLatestEntries();
  const profile = useProfile();

  const scrollToContents = () => {
    document.getElementById('desk-contents')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openFolder = () => {
    if (open) { scrollToContents(); return; }
    setOpen(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(scrollToContents, reduced ? 0 : 1000);
  };

  return (
    <main>
      <section className="hero-desk">
        <div className="desk-caption" aria-hidden="true">
          <span>AN ASSIGNMENT VLOG</span>
          <span>05 FOLDERS</span>
          <span>30 ENTRIES</span>
        </div>
        <button type="button" className={`case-folder${open ? ' is-open' : ''}`} onClick={openFolder} aria-expanded={open} aria-label="Open the case file">
          <span className="folder-shadow" aria-hidden="true" />
          <span className="folder-flap" aria-hidden="true" />
          <span className="folder-back" aria-hidden="true">
            <span className="folder-inside">
              <span className="inside-paper ip-a"><strong>05</strong><span>subjects</span></span>
              <span className="inside-paper ip-b"><strong>30</strong><span>entries</span></span>
              <span className="inside-paper ip-c"><strong>{overall.percent}%</strong><span>done</span></span>
            </span>
            <span className="peek-paper"><strong>CASE FILE</strong><small>{profile.name}</small></span>
          </span>
          <span className="folder-cover" aria-hidden="true"><i className="cover-scratch s1" /><i className="cover-scratch s2" /><i className="cover-scratch s3" /><i className="cover-scratch s4" /></span>
          <span className="folder-hint">{open ? '✦ FOLDER OPEN — EXPLORE BELOW' : '⋆ CLICK TO OPEN THE FOLDER ⋆'}</span>
        </button>
        <div className="hero-actions">
          <button className="button button-primary" onClick={() => navigate('/courses')}>OPEN THE FOLDERS <span>↗</span></button>
          <button className="button button-ghost" onClick={() => navigate('/progress')}>VIEW PROGRESS <span>↗</span></button>
        </div>
      </section>

      <ProfileSection navigate={navigate} />

      <section className="menu-section shell">
        <div className="latest-strip-block">
          <div className="scatter-kicker"><SectionLabel>THE VLOG / NEWEST FIRST</SectionLabel></div>
          <h2 className="card-heading latest-heading">⋆ LATEST ENTRIES ⋆</h2>
          <div className="latest-strip">
            {latest.slice(0, 4).map(({ course, entry }, index) => (
              <button key={entry.id} className={`latest-card ${index % 2 ? 'tilt-right' : 'tilt-left'}`} onClick={() => navigate(`/courses/${course.slug}/entries/${entry.slug}`)}>
                <span className="latest-photo"><Polaroid name={`entry-${entry.id}`} icon={course.icon} label={entry.title} rotate="none" caption={entry.dateLabel} editable /></span>
                <span className="latest-title">{entry.title}</span>
                <span className="latest-meta">{course.shortTitle} · ENTRY {entry.id.slice(-2)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="menu-card menu-courses">
          <h2 className="card-heading">⋆ COURSES ⋆</h2>
          <div className="card-rule" />
          <div className="course-lines">
            {courses.map((course) => {
              const progress = getCourseProgress(course);
              return (
                <button key={course.slug} className="course-line" onClick={() => navigate(`/courses/${course.slug}`)}>
                  <span className="course-line-name">{course.title}</span>
                  <span className="course-line-meta">FOLDER #{course.caseNumber} · {progress.completed} / {progress.total} ENTRIES · {progress.percent}%</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="menu-card menu-extras">
          <h2 className="card-heading">⋆ EXTRAS ⋆</h2>
          <div className="card-rule" />
          <div className="extras-group">
            <p className="extras-label">ART WORKS:</p>
            <button className="button button-primary" onClick={() => navigate('/portfolio')}>PORTFOLIO</button>
          </div>
          <div className="extras-group">
            <p className="extras-label">LIFE UPDATES:</p>
            <button className="button button-primary" onClick={() => navigate('/journal')}>JOURNAL</button>
          </div>
        </div>
        <p className="menu-footnote">DOCUMENT · FINISH · REPEAT</p>
      </section>
    </main>
  );
}

/** The PROFILE folder — copied from the reference: papers spilled on a folder. */
function ProfileSection({ navigate }: { navigate: Navigate }) {
  const profile = useProfile();
  return (
    <section className="desk-scatter shell" id="desk-contents">
      <div className="scatter-kicker"><SectionLabel>FILE CONTENTS / THE PROFILE FOLDER</SectionLabel></div>      <div className="scatter-field">
        <article className="scatter-paper paper-profile">
          <span className="profile-scribble" aria-hidden="true" />
          <h2>PROFILE</h2>
          <p className="profile-case">case: {profile.caseNumber}</p>
        </article>
        <aside className="paper-photo">
          <Polaroid name="me" icon="user" label={`Photo of ${profile.name}`} caption={profile.name} editable />
        </aside>
        <aside className="scatter-paper paper-id">
          <div className="id-head"><strong>STUDENT INFO</strong><span>CASE: {profile.caseNumber}</span></div>
          <div className="id-rows">
            <div className="id-row"><small>NAME</small><strong>{profile.name}</strong></div>
            <div className="id-row"><small>SIGN</small><strong>{profile.sign}</strong></div>
            <div className="id-row"><small>DATE OF BIRTH</small><strong>{profile.dob}</strong></div>
            <div className="id-row"><small>CITIZEN</small><strong>{profile.citizen}</strong></div>
            <div className="id-row"><small>MOTTO</small><strong className="scribble-line">{profile.motto}</strong></div>
            <div className="id-row"><small>EXTRA</small><strong className="id-open">{profile.extra}</strong></div>
          </div>
        </aside>
        <aside className="scatter-paper note-scrawl">
          <strong>{profile.noteTitle}</strong>
          <p>{profile.noteText}</p>
        </aside>
        <article className="scatter-paper paper-favs">
          <SectionLabel>FANDOMS ★</SectionLabel>
          <div className="fav-chips">
            {profile.fandoms.map((fandom) => <span key={fandom} className="fav-chip">{fandom}</span>)}
          </div>
          <p className="favs-footnote">…the rest of the collection lives in the notes app.</p>
        </article>
        <div className="stamp-classified" aria-hidden="true"><strong>CLASSIFIED</strong><span>ASSIGNMENTS // BUREAU OF CURIOSITY</span></div>
      </div>
      <p className="menu-footnote scatter-foot">hover any photo to <strong>upload your own</strong> — {photoSaveHint} · <button className="text-link" onClick={() => navigate('/about')}>HOW THIS WORKS <span>↗</span></button></p>
    </section>
  );
}

export function CoursesPage({ navigate, getCourseProgress }: { navigate: Navigate; getCourseProgress: (course: Course) => Progress }) {
  const courses = useCourses();
  return <main className="shell page-shell courses-page"><PageIntro kicker="THE ARCHIVE / FIVE SUBJECT FOLDERS" title="COURSE FOLDERS" description="Every subject is a folder. Every folder holds this term's assignments — open one to see the entries and where things stand." /><div className="courses-toolbar"><span>05 FOLDERS INDEXED</span><span>STATUS / ALL FOLDERS ACTIVE</span><span className="toolbar-mark">⌁</span></div><div className="course-grid">{courses.map((course, index) => { const progress = getCourseProgress(course); return <CourseCard key={course.slug} course={course} percent={progress.percent} completed={progress.completed} navigate={navigate} featured={index === 0} />; })}</div><div className="archive-note"><span className="archive-mark">+</span><p><strong>THE FOLDERS ARE OPEN.</strong> Work through the entries in any order — every entry can be edited, renamed, or added from inside its folder.</p></div></main>;
}
