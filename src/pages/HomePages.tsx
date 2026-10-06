import { useState } from 'react';
import { useCourses, useLatestEntries } from '../state/edits';
import { useProfile } from '../state/profile';
import { ClippingCollage, Polaroid } from '../components/Photo';
import { CourseCard, PageIntro, type Navigate } from '../components/UI';

export function HomePage({ navigate }: { navigate: Navigate }) {
  const [open, setOpen] = useState(false);
  const courses = useCourses();
  const latest = useLatestEntries();
  const profile = useProfile();

  const scrollToContents = () => {
    document.getElementById('desk-contents')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The folder holds an editable photo, so clicks on its upload controls
  // must not open the folder — only clicks on the folder artwork itself do.
  const openFolder = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.photo-edit')) return;
    if (open) { scrollToContents(); return; }
    setOpen(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(scrollToContents, reduced ? 0 : 1000);
  };

  const openFolderFromKey = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (open) { scrollToContents(); return; }
    setOpen(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(scrollToContents, reduced ? 0 : 1000);
  };

  return (
    <main>
      <section className="hero-desk">
        <div
          role="button"
          tabIndex={0}
          className={`case-folder${open ? ' is-open' : ''}`}
          onClick={openFolder}
          onKeyDown={openFolderFromKey}
          aria-expanded={open}
          aria-label="Open the case file"
        >
          <span className="folder-shadow" aria-hidden="true" />
          <span className="folder-flap" aria-hidden="true" />
          <span className="folder-back">
            <span className="folder-photo">
              <strong className="folder-photo-name">{profile.name}</strong>
              <ClippingCollage />
            </span>
          </span>
          <span className="folder-cover" aria-hidden="true"><i className="cover-scratch s1" /><i className="cover-scratch s2" /><i className="cover-scratch s3" /><i className="cover-scratch s4" /></span>
          <span className="folder-hint">{open ? '✦ FOLDER OPEN — EXPLORE BELOW' : '⋆ CLICK TO OPEN THE FOLDER ⋆'}</span>
        </div>
      </section>

      <section className="menu-section shell" id="desk-contents">
        <div className="latest-strip-block">
          <h2 className="card-heading latest-heading">⋆ LATEST ENTRIES ⋆</h2>
          <div className="latest-strip">
            {latest.slice(0, 4).map(({ course, entry }, index) => (
              <button key={entry.id} className={`latest-card ${index % 2 ? 'tilt-right' : 'tilt-left'}`} onClick={() => navigate(`/courses/${course.slug}`)}>
                <span className="latest-photo"><Polaroid name={`entry-${entry.id}`} icon={course.icon} label={entry.title} rotate="none" caption={entry.dateLabel} editable /></span>
                <span className="latest-title">{entry.title}</span>
                <span className="latest-meta">{course.shortTitle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="menu-card menu-courses">
          <h2 className="card-heading">⋆ COURSES ⋆</h2>
          <div className="card-rule" />
          <div className="course-lines">
            {courses.map((course) => (
              <button key={course.slug} className="course-line" onClick={() => navigate(`/courses/${course.slug}`)}>
                <span className="course-line-name">{course.title}</span>
                <span className="course-line-meta">VIEW THE FOLDER ↗</span>
              </button>
            ))}
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

export function CoursesPage({ navigate }: { navigate: Navigate }) {
  const courses = useCourses();
  return (
    <main className="shell page-shell courses-page">
      <PageIntro kicker="THE ARCHIVE / FIVE SUBJECT FOLDERS" title="COURSE FOLDERS" description="Every subject is a folder. Open one to see each topic and the artwork filed under it." />
      <div className="course-grid">{courses.map((course) => <CourseCard key={course.slug} course={course} navigate={navigate} />)}</div>
    </main>
  );
}
