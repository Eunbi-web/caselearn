import { useState } from 'react';
import { useProfile } from '../state/profile';
import type { Course } from '../data/cases';

export type Navigate = (to: string) => void;

export function BrandMark({ navigate }: { navigate: Navigate }) {
  return (
    <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }} aria-label="Case file home">
      <span className="brand-seal" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <rect x="5" y="12" width="22" height="14" rx="2" />
          <path d="M5 10a2 2 0 0 1 2-2h5l2 2h11a2 2 0 0 1 2 2" />
          <path d="M9 8V6h8l2 2" />
        </svg>
      </span>
      <span className="brand-copy"><strong>FIONA AUDREY CUANG</strong><small>ASSIGNMENT VLOG</small></span>
    </a>
  );
}

export function SectionLabel({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`eyebrow ${tone}`}>{children}</span>;
}

export function Navigation({ currentPath, navigate }: { currentPath: string; navigate: Navigate }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Journal', path: '/journal' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'About', path: '/about' },
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
              const active = link.path === '/' ? currentPath === '/' : currentPath.startsWith(link.path);
              return <a key={link.path} className={active ? 'active' : ''} href={link.path} aria-current={active ? 'page' : undefined} onClick={(event) => go(event, link.path)}>{link.label}</a>;
            })}
          </div>
          <a className="button button-outline nav-cta" href="/courses" onClick={(event) => go(event, '/courses')}><span>OPEN THE FOLDERS</span><span className="button-arrow">↗</span></a>
        </nav>
      </div>
    </header>
  );
}

export function Footer({ navigate }: { navigate: Navigate }) {
  const profile = useProfile();
  const links = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Journal', path: '/journal' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'About', path: '/about' },
  ];
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <SectionLabel>CASE FILE // AN ASSIGNMENT VLOG</SectionLabel>
          <div className="footer-title">MY<br /><em>CASE FILE</em></div>
        </div>
        <div className="footer-tagline">Document.<br /><span>Finish. Repeat.</span></div>
        <nav className="footer-links" aria-label="Footer navigation">
          {links.map((link) => <a key={link.path} href={link.path} onClick={(event) => { event.preventDefault(); navigate(link.path); }}>{link.label}</a>)}
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 {profile.name.toUpperCase()}</span>
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

/** Folder card on the courses index — title only, no numbers or descriptions. */
export function CourseCard({ course, navigate }: { course: Course; navigate: Navigate }) {
  return (
    <article className="course-card">
      <div className="course-card-top"><SectionLabel>FOLDER</SectionLabel><span className="card-corner">OPEN ↗</span></div>
      <h2>{course.title}</h2>
      <div className="card-divider" />
      <button className="text-link" onClick={() => navigate(`/courses/${course.slug}`)}>VIEW THE FOLDER <span>↗</span></button>
    </article>
  );
}
