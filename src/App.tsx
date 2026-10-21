import { useCallback, useEffect, useState } from 'react';
import { useCourses } from './state/edits';
import { Footer, Navigation, TornFilter } from './components/UI';
import { ScatteredEyes } from './components/ScatteredEyes';
import { ScatteredNotes } from './components/ScatteredNotes';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { CoursesPage, CoursePage } from './pages/CoursePages';
import { ArtworksPage } from './pages/ArtworksPage';
import { VisualJournalPage } from './pages/VisualJournalPage';

const normalizePath = (path: string) => {
  const clean = path.replace(/\/+$/, '');
  return clean || '/';
};

function NotFoundPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="lost-note sheet-pad">
      <h1>out of the pile</h1>
      <p>this page slipped out of the notebook — it happens to the best papers.</p>
      <button type="button" className="btn btn-solid" onClick={() => navigate('/')}>back to home ↑</button>
      {/* this page has nothing but wall — give the giant eye the upper right;
          the scatter layer paints behind the copy so the title always reads */}
      <ScatteredEyes
        spots={[
          { top: '11%', right: '3%', size: 'clamp(170px, 20vw, 330px)', rotate: -12, flip: true, spin: true, drift: 0, eager: true },
          { top: '76%', left: '6%', size: 'clamp(60px, 6.5vw, 100px)', rotate: 24, drift: 2 },
        ]}
      />
      {/* a couple of note piles for company on this lonely page */}
      <ScatteredNotes
        spots={[
          { top: '55%', left: '18%', pile: 2, size: 'clamp(110px, 12vw, 180px)', rotate: 18, eager: true },
          { top: '8%', left: '6%', pile: 4, size: 'clamp(70px, 7.5vw, 115px)', rotate: -34, flip: true },
        ]}
      />
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const courses = useCourses();

  const navigate = useCallback((to: string) => {
    const [rawPath, hash] = to.split('#');
    const next = normalizePath(rawPath || '/');
    const samePage = next === path;
    if (!samePage) {
      window.history.pushState({}, '', next);
      setPath(next);
    }
    if (hash) {
      window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), samePage ? 0 : 120);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [path]);

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const renderPage = () => {
    if (path === '/') return <HomePage navigate={navigate} />;
    if (path === '/profile') return <ProfilePage />;
    if (path === '/courses') return <CoursesPage courses={courses} navigate={navigate} />;
    if (path === '/artworks' || path === '/portfolio') return <ArtworksPage navigate={navigate} />;
    if (path === '/visual-journal') return <VisualJournalPage />;

    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'courses' && segments.length === 2) {
      const course = courses.find((item) => item.slug === segments[1]);
      return course ? <CoursePage course={course} navigate={navigate} /> : <NotFoundPage navigate={navigate} />;
    }
    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <div className="paper-sheet">
      <TornFilter />
      <Navigation currentPath={path} navigate={navigate} />
      <main id="main-content" className="page-transition" key={path}>{renderPage()}</main>
      <Footer />
    </div>
  );
}
