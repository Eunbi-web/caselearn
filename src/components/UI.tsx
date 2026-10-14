import { useState } from 'react';
import { useProfile } from '../state/profile';
import type { Course } from '../data/cases';

export type Navigate = (to: string) => void;

export function BrandMark({ navigate }: { navigate: Navigate }) {
  return (
    <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }} aria-label="Case learn home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      </span>
      <span className="brand-name">
        <strong>FIONA AUDREY CUANG</strong>
        <small>STUDY NOTEBOOK</small>
      </span>
    </a>
  );
}

export function SectionLabel({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`eyebrow ${tone}`}>{children}</span>;
}

export function Navigation({ currentPath, navigate, theme, onToggleTheme }: { currentPath: string; navigate: Navigate; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'PROFILE', path: '/#profile-section', active: '/profile' },
    { label: 'COURSES', path: '/courses' },
    { label: 'JOURNAL', path: '/journal' },
    { label: 'PORTFOLIO', path: '/portfolio' },
    { label: 'ABOUT', path: '/about' },
  ];

  const go = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    navigate(path);
    setOpen(false);
  };

  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <BrandMark navigate={navigate} />
        <button className={`menu-toggle ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close navigation' : 'Open navigation'}>
          <span /><span /><span />
        </button>
        <nav id="main-nav" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <div className="nav-links">
            {links.map((link) => {
              const base = link.active ?? link.path;
              const active = base === '/' ? currentPath === '/' : currentPath.startsWith(base);
              return <a key={link.path} className={active ? 'active' : ''} href={link.path} aria-current={active ? 'page' : undefined} onClick={(event) => go(event, link.path)}>{link.label}</a>;
            })}
          </div>
          <a className="button button-ghost button-small nav-cta" href="/courses" onClick={(event) => go(event, '/courses')}>OPEN THE FOLDERS</a>
        </nav>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" /></svg>
          )}
        </button>
      </div>
    </header>
  );
}

export function Footer({ navigate }: { navigate: Navigate }) {
  const profile = useProfile();
  const links = [
    { label: 'PROFILE', path: '/#profile-section' },
    { label: 'COURSES', path: '/courses' },
    { label: 'JOURNAL', path: '/journal' },
    { label: 'PORTFOLIO', path: '/portfolio' },
    { label: 'ABOUT', path: '/about' },
  ];
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <SectionLabel>CASE LEARN — A STUDY NOTEBOOK</SectionLabel>
          <div className="footer-title">MY <em>NOTEBOOK</em></div>
        </div>
        <div className="footer-tagline">READ. WRITE. <span>REPEAT.</span></div>
        <nav className="footer-links" aria-label="Footer navigation">
          {links.map((link) => <a key={link.path} href={link.path} onClick={(event) => { event.preventDefault(); navigate(link.path); }}>{link.label}</a>)}
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 {profile.name.toUpperCase()}</span>
        <span>INK ON PAPER</span>
      </div>
    </footer>
  );
}

export function PageIntro({ kicker, title, description, children }: { kicker: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="page-intro">
      <SectionLabel>{kicker}</SectionLabel>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
}

/** Course card on any index — hover pulls out a drawer revealing the full
    course title; clicking anywhere opens the course page. */
export function CourseCard({ course, navigate }: { course: Course; navigate: Navigate }) {
  const icon = () => {
    switch (course.icon) {
      case 'book': return <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
      case 'bulb': return <svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.2 1.5 2.1h4c0-.9.7-1.5 1.5-2.1A6 6 0 0 0 12 3z" /></svg>;
      case 'pencil': return <svg viewBox="0 0 24 24"><path d="M17 3l4 4L8 20l-5 1 1-5z" /><path d="m14 6 4 4" /></svg>;
      case 'monitor': return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M9 21h6M12 17v4" /></svg>;
      case 'eye': return <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="3" /></svg>;
    }
  };

  return (
    <article
      className="course-card"
      role="link"
      tabIndex={0}
      aria-label={`Open course: ${course.title}`}
      onClick={() => navigate(`/courses/${course.slug}`)}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/courses/${course.slug}`); } }}
    >
      <span className="course-number" aria-hidden="true">{course.caseNumber}</span>
      <div className="course-card-face">
        {icon()}
        <small>subject folder</small>
        <h3>{course.shortTitle}</h3>
      </div>
      <div className="course-card-pull" aria-hidden="true">
        <h2>{course.title}</h2>
        <small>hover reveals · click to open ↗</small>
      </div>
    </article>
  );
}
