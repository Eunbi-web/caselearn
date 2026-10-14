import { useCourses, useLatestEntries } from '../state/edits';
import { useProfile } from '../state/profile';
import { useJournal } from '../state/journal';
import { Photo, Polaroid } from '../components/Photo';
import { CourseCard, PageIntro, type Navigate } from '../components/UI';

export function HomePage({ navigate }: { navigate: Navigate }) {
  const courses = useCourses();
  const latest = useLatestEntries();
  const journal = useJournal();
  const profile = useProfile();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main>
      {/* ---- HOME: animated landing + "this website includes" strip ---- */}
      <section className="hero-landing">
        <div className="hero-doodle" aria-hidden="true">
          <span className="hero-doodle-line" />
          <span className="hero-doodle-star">★</span>
        </div>
        <h1 className="hero-title">
          <span className="hero-hello">hello, welcome to my</span>
          <span className="hero-word">STUDY NOTEBOOK</span>
        </h1>
        <p className="hero-note">this website includes:</p>
        <div className="hero-contents">
          <button className="hero-anchor" onClick={() => scrollTo('profile-section')}>PROFILE</button>
          <button className="hero-anchor" onClick={() => scrollTo('courses-section')}>COURSES</button>
          <button className="hero-anchor" onClick={() => scrollTo('journal-section')}>VISUAL JOURNAL</button>
          <button className="hero-anchor" onClick={() => scrollTo('portfolio-section')}>PORTFOLIO</button>
        </div>
      </section>

      {/* ---- PROFILE ---- */}
      <section id="profile-section" className="shell page-shell">
        <PageIntro kicker="WHO I AM" title="PROFILE" description="The student behind the notebook." />
        <div className="profile-sheet">
          <div className="profile-header">
            <div className="profile-name">{profile.name}</div>
            <p className="profile-bio-lead">case: {profile.caseNumber}</p>
            <div className="profile-meta">
              <span>DOB: <span className="profile-case">{profile.dob}</span></span>
              <span>SIGN: <span className="profile-case">{profile.sign}</span></span>
              <span>CITIZEN: {profile.citizen}</span>
            </div>
          </div>
          <div className="profile-grid">
            <div className="profile-bio">
              <h3>about</h3>
              <p>{profile.extra} — {profile.motto}</p>
              <p style={{ marginTop: 14 }}>{profile.noteTitle}: {profile.noteText}</p>
            </div>
            <div className="profile-side">
              <figure className="polaroid" style={{ maxWidth: 240, margin: '0 auto' }}>
                <span className="polaroid-tape" aria-hidden="true" />
                <div className="polaroid-window">
                  <Photo name="profile-photo" icon="user" label="Profile photo" editable eager />
                </div>
                <figcaption className="polaroid-caption">it's me!</figcaption>
              </figure>
              <div className="fandom-head" style={{ marginTop: 22 }}>FANDOMS★</div>
              <div className="fandom-list">
                {profile.fandoms.map((f) => (
                  <span key={f} className="fandom-chip">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- COURSES OVERVIEW ---- */}
      <section id="courses-section" className="shell page-shell">
        <PageIntro kicker="THE SUBJECTS" title="COURSES" description="Five folders. Each topic is a stack of your artwork." />
        <div className="courses-grid">
          {courses.map((course) => <CourseCard key={course.slug} course={course} navigate={navigate} />)}
        </div>
      </section>

      {/* ---- LATEST ENTRIES (vlog strip) ---- */}
      <section className="shell page-shell">
        <PageIntro kicker="THE FEED" title="LATEST ENTRIES" description="The newest work, pulled straight from the folders." />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {latest.slice(0, 4).map(({ course, entry }, index) => (
            <button key={entry.id} className="latest-card" onClick={() => navigate(`/courses/${course.slug}`)} style={{ transform: index % 2 ? 'rotate(1.5deg)' : 'rotate(-1.5deg)', transition: 'transform .25s ease' }}>
              <Polaroid name={`entry-${entry.id}`} icon={course.icon} label={entry.title} caption={entry.dateLabel} rotate={index % 2 ? 'right' : 'left'} editable />
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{entry.title}</div>
                <div style={{ fontSize: 8.5, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{course.shortTitle}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ---- JOURNAL ---- */}
      <section id="journal-section" className="shell page-shell">
        <PageIntro kicker="LIFE UPDATES" title="JOURNAL" description="Dated notes, written as they happen." />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {journal.slice(0, 3).map((post) => (
            <article key={post.id} className="journal-card" style={{ width: 'min(380px, 100%)' }}>
              <div className="journal-top">
                <span className="journal-date">{post.dateLabel}</span>
                <button className="journal-tool" onClick={() => navigate('/journal')}>EDIT →</button>
              </div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="button button-tape" onClick={() => navigate('/journal')}>VIEW ALL UPDATES</button>
        </div>
      </section>

      {/* ---- PORTFOLIO ---- */}
      <section id="portfolio-section" className="shell page-shell">
        <PageIntro kicker="ARTWORKS" title="PORTFOLIO" description="A scroll of everything I've made. No next, no previous — just keep going down." />
        <div style={{ textAlign: 'center' }}>
          <button className="button button-primary" onClick={() => navigate('/portfolio')}>OPEN THE GALLERY</button>
        </div>
      </section>

      {/* ---- ABOUT ---- */}
      <section id="about-section" className="shell page-shell">
        <PageIntro kicker="ABOUT" title="ABOUT" description="The manifesto, written on the back of a napkin." />
        <div className="about-manifesto">
          <div className="manifesto-mark">C</div>
          <h2>a study notebook</h2>
          <p>This is where I keep every assignment — in one folder. Document. Finish. Repeat.</p>
        </div>
        <div className="about-cta">
          <div>
            <div className="eyebrow">START ANYWHERE</div>
            <h3>open the subjects</h3>
          </div>
          <button className="button button-primary" onClick={() => navigate('/courses')}>OPEN THE FOLDERS →</button>
        </div>
        <p className="about-sig" style={{ marginTop: 26, textAlign: 'center', color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 13 }}>
          filed by {profile.name} · case: {profile.caseNumber}
        </p>
      </section>
    </main>
  );
}

export function CoursesPage({ navigate }: { navigate: Navigate }) {
  const courses = useCourses();
  return (
    <main className="shell page-shell courses-page">
      <PageIntro kicker="THE ARCHIVE / FIVE SUBJECT FOLDERS" title="COURSE FOLDERS" description="Every subject is a folder. Hover the card to reveal the full title, then click to open it." />
      <div className="courses-grid">{courses.map((course) => <CourseCard key={course.slug} course={course} navigate={navigate} />)}</div>
    </main>
  );
}
