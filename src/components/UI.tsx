// Shared page furniture: the torn-paper SVG filter, navigation,
// paper footer and the hero blocks every page opens with.

import { useState } from 'react';

const BASE = import.meta.env.BASE_URL;

/** Hidden SVG defs — the rough edge filter used by .torn-title and .scrap-paper. */
export function TornFilter() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="torn-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.05" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Homepage', to: '/' },
  { label: 'Profile', to: '/profile' },
  { label: 'Course Journals', to: '/courses' },
  { label: 'Personal Portfolio', to: '/artworks' },
  { label: 'Visual Journal', to: '/visual-journal' },
];

export function Navigation({ currentPath, navigate }: { currentPath: string; navigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = (to: string) => (to === '/' ? currentPath === '/' : currentPath.startsWith(to) || (to === '/artworks' && currentPath.startsWith('/portfolio')));

  const go = (to: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="site-header">
      <div className="nav-wrap sheet-pad">
        <div className="nav-shell">
          <a href="/" className="brand" onClick={go('/')}>
            <img className="brand-mark" src={`${BASE}photos/e-portfolio-icon.png`} alt="E-portfolio logo" />
            <span className="brand-name">case learn</span>
            <span className="brand-spark" aria-hidden="true">✳</span>
          </a>
          <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <a key={item.to} href={item.to} className={isActive(item.to) ? 'active' : ''} onClick={go(item.to)}>
                {item.label}
              </a>
            ))}
          </nav>
          <span className="nav-tools">
            <button type="button" className="menu-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
              PAGES {open ? '✕' : '☰'}
            </button>
          </span>
        </div>
      </div>
    </header>
  );
}

export function Footer({ navigate }: { navigate: (to: string) => void }) {
  return (
    <>
      <div className="sheet-pad">
        <div className="footer-strip">
          <span>an open notebook</span>
          <button type="button" className="go-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            back to the top ↑
          </button>
        </div>
      </div>
      <footer className="site-footer sheet-pad">
        <span>
          <span className="footer-spark" aria-hidden="true">✳ </span>
          made of little notes &amp; big ideas
        </span>
        <button
          type="button"
          className="go-top"
          onClick={(event) => { event.preventDefault(); navigate('/visual-journal'); }}
        >
          little things worth keeping ✳
        </button>
      </footer>
    </>
  );
}

/** Hero block for inner pages: corner number sticker + kicker + huge title. */
export function PageHero({ num, kicker, title, sub, torn = false }: { num: string; kicker: string; title: string; sub?: string; torn?: boolean }) {
  return (
    <div className="page-hero sheet-pad">
      <span className="page-num-corner">
        <span className="page-corner-num">
          <span className="num-sticker">{num}</span>
          <span aria-hidden="true">✳</span>
        </span>
      </span>
      <p className="kicker">{kicker}</p>
      {torn ? (
        <div style={{ marginTop: 16 }}>
          <span className="torn-title">
            <span className="torn-kicker" style={{ display: 'none' }}>{kicker}</span>
            <span className="display-title" style={{ display: 'block' }}>{title}</span>
            <span className="marker-bar" aria-hidden="true" />
          </span>
        </div>
      ) : (
        <h1 className="display-title" style={{ marginTop: 12 }}>{title}</h1>
      )}
      {sub && <p className="hero-sub">{sub}</p>}
    </div>
  );
}
