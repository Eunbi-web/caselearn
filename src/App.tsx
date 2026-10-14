import { useCallback, useEffect, useState } from 'react';
import { useCourses } from './state/edits';
import { Footer, Navigation } from './components/UI';
import { HomePage, CoursesPage } from './pages/HomePages';
import { CoursePage } from './pages/CoursePages';
import { PortfolioPage } from './pages/PortfolioPage';
import { JournalPage } from './pages/ExtrasPages';
import { AboutPage, NotFoundPage } from './pages/SupportPages';

const normalizePath = (path: string) => {
  const clean = path.replace(/\/+$/, '');
  return clean || '/';
};

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('caselearn:theme') === 'dark' ? 'dark' : 'light'));
  const courses = useCourses();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('caselearn:theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141310' : '#fffbf3');
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
      // anchor on the (now or already) rendered page
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
    if (path === '/courses') return <CoursesPage navigate={navigate} />;
    if (path === '/portfolio') return <PortfolioPage navigate={navigate} />;
    if (path === '/journal') return <JournalPage navigate={navigate} />;
    if (path === '/about') return <AboutPage navigate={navigate} />;

    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'courses' && segments.length === 2) {
      const course = courses.find((course) => course.slug === segments[1]);
      return course ? <CoursePage course={course} navigate={navigate} /> : <NotFoundPage navigate={navigate} />;
    }
    return <NotFoundPage navigate={navigate} />;
  };

  return <div className="app-shell"><Navigation currentPath={path} navigate={navigate} theme={theme} onToggleTheme={toggleTheme} /><div className="page-transition" key={path}>{renderPage()}</div><Footer navigate={navigate} /></div>;
}
