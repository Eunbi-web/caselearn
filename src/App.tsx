import { useCallback, useEffect, useState } from 'react';
import { useCourses } from './state/edits';
import { Footer, Navigation, TornFilter } from './components/UI';
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
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('caselearn:theme') === 'dark' ? 'dark' : 'light'));
  const courses = useCourses();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('caselearn:theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191712' : '#fbfaf5');
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

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
      <Navigation currentPath={path} navigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
      <main id="main-content" className="page-transition" key={path}>{renderPage()}</main>
      <Footer navigate={navigate} />
    </div>
  );
}
