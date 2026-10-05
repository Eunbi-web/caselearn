import { useCallback, useEffect, useState } from 'react';
import { useCourses } from './state/edits';
import { Footer, Navigation } from './components/UI';
import { HomePage, CoursesPage } from './pages/HomePages';
import { CoursePage } from './pages/CoursePages';
import { PortfolioPage, JournalPage } from './pages/ExtrasPages';
import { AboutPage, NotFoundPage } from './pages/SupportPages';

const normalizePath = (path: string) => {
  const clean = path.replace(/\/+$/, '');
  return clean || '/';
};

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const courses = useCourses();

  const navigate = useCallback((to: string) => {
    const next = normalizePath(to);
    if (next !== path) {
      window.history.pushState({}, '', next);
      setPath(next);
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

  return <div className="app-shell"><Navigation currentPath={path} navigate={navigate} /><div className="page-transition" key={path}>{renderPage()}</div><Footer navigate={navigate} /></div>;
}
