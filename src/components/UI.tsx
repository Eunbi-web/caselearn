import { useState } from 'react';
import type { Course, Entry } from '../data/cases';
import { profile } from '../data/profile';
import { Photo, type IconName } from './Photo';

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
      <span className="brand-copy"><strong>CASE FILE</strong><small>ASSIGNMENT VLOG</small></span>
    </a>
  );
}

export function StatusBadge({ children, tone = 'active' }: { children: React.ReactNode; tone?: 'active' | 'locked' | 'complete' | 'classified' }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" aria-hidden="true" />{children}</span>;
}

export function ProgressBar({ percent, label, compact = false }: { percent: number; label?: string; compact?: boolean }) {
  return (
    <div className={`progress-wrap ${compact ? 'progress-compact' : ''}`}>
      {label && <div className="progress-label"><span>{label}</span><strong>{percent}%</strong></div>}
      <div className="progress-track" aria-label={label ?? 'Progress'} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
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
    { label: 'Progress', path: '/progress' },
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
  const links = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/courses' },
    { label: 'Progress', path: '/progress' },
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
      <div className="shell footer-bottom"><span>© 2026 {profile.name.toUpperCase()}</span><span>FOLDERS 05 / ENTRIES 30</span></div>
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

export function CaseMeta({ course, status = 'IN TERM' }: { course: Course; status?: string }) {
  return (
    <div className="case-meta-row">
      <span><small>FOLDER</small><strong>#{course.caseNumber}</strong></span>
      <span><small>ENTRIES</small><strong>{String(course.entries.length).padStart(2, '0')}</strong></span>
      <span><small>STATUS</small><strong className="meta-active">{status}</strong></span>
    </div>
  );
}

export function CourseCard({ course, percent, completed, navigate, featured = false }: { course: Course; percent: number; completed: number; navigate: Navigate; featured?: boolean }) {
  return (
    <article className={`course-card ${featured ? 'course-card-featured' : ''}`}>
      <div className="course-card-top"><SectionLabel>FOLDER #{course.caseNumber}</SectionLabel><span className="card-corner">{percent === 100 ? 'ALL DONE' : 'IN TERM'}</span></div>
      <div className="course-number">{course.caseNumber}</div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      {featured && <div className="featured-photo"><PolaroidInline name={`course-${course.slug}`} icon={course.icon} label={course.title} caption={`folder #${course.caseNumber} / this term`} editable /></div>}
      <div className="card-divider" />
      <div className="course-card-meta"><span><small>ENTRIES</small><strong>{completed} / {course.entries.length} DONE</strong></span><StatusBadge tone={percent === 100 ? 'complete' : 'active'}>{percent === 100 ? 'FOLDER COMPLETE' : 'IN PROGRESS'}</StatusBadge></div>
      <ProgressBar percent={percent} compact />
      <button className="text-link" onClick={() => navigate(`/courses/${course.slug}`)}>OPEN THE FOLDER <span>↗</span></button>
    </article>
  );
}

function PolaroidInline({ name, icon, label, caption, editable }: { name: string; icon: IconName; label: string; caption: string; editable?: boolean }) {
  return (
    <figure className="polaroid polaroid-right">
      <span className="polaroid-tape" aria-hidden="true" />
      <div className="polaroid-window"><Photo name={name} icon={icon} label={label} editable={editable} /></div>
      <figcaption className="polaroid-caption">{caption}</figcaption>
    </figure>
  );
}

export function EntryCard({ course, entry, done, navigate, index }: { course: Course; entry: Entry; done: boolean; navigate: Navigate; index: number }) {
  return (
    <article className={`evidence-card entry-card ${done ? 'is-investigated' : ''}`}>
      <div className="entry-thumb">
        <Photo name={`entry-${entry.id}`} icon={course.icon} label={entry.title} editable />
      </div>
      <div className="evidence-body">
        <div className="evidence-topline"><SectionLabel>{entry.dateLabel}</SectionLabel><span className="evidence-id">ENTRY {String(index + 1).padStart(2, '0')} / {String(course.entries.length).padStart(2, '0')}</span></div>
        <h3>{entry.title}</h3>
        <p>{entry.about}</p>
        <div className="evidence-footer"><StatusBadge tone={done ? 'complete' : 'active'}>{done ? 'DONE ✓' : 'TO DO'}</StatusBadge><button className="button button-small button-ghost" onClick={() => navigate(`/courses/${course.slug}/entries/${entry.slug}`)}>{done ? 'RE-OPEN ENTRY' : 'OPEN ENTRY'} <span>↗</span></button></div>
      </div>
    </article>
  );
}

export function DossierFrame({ children, className = '', tab = 'CASE FILE / 2026' }: { children: React.ReactNode; className?: string; tab?: string }) {
  return <div className={`dossier-frame ${className}`}><div className="dossier-tab">{tab}</div>{children}</div>;
}
