import { useCallback, useEffect, useState } from 'react';
import { useCourses, getResolvedEntry } from './state/edits';
import { useProgress } from './state/progress';
import { Footer, Navigation } from './components/UI';
import { HomePage, CoursesPage } from './pages/HomePages';
import { CoursePage, EntryPage, ProgressPage } from './pages/CoursePages';
import { PortfolioPage, JournalPage } from './pages/ExtrasPages';
import { AboutPage, NotFoundPage } from './pages/SupportPages';

const normalizePath = (path: string) => {
  const clean = path.replace(/\/+$/, '');
  return clean || '/';
};

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const courses = useCourses();
  const progress = useProgress(courses);

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
    if (path === '/') return <HomePage navigate={navigate} overall={progress.overall} getCourseProgress={progress.getCourseProgress} />;
    if (path === '/courses') return <CoursesPage navigate={navigate} getCourseProgress={progress.getCourseProgress} />;
    if (path === '/progress') return <ProgressPage courses={courses} navigate={navigate} getCourseProgress={progress.getCourseProgress} overall={progress.overall} />;
    if (path === '/portfolio') return <PortfolioPage navigate={navigate} />;
    if (path === '/journal') return <JournalPage navigate={navigate} />;
    if (path === '/about') return <AboutPage navigate={navigate} />;

    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'courses' && segments.length === 2) {
      const course = courses.find((course) => course.slug === segments[1]);
      return course ? <CoursePage course={course} navigate={navigate} getCourseProgress={progress.getCourseProgress} isDone={progress.isDone} /> : <NotFoundPage navigate={navigate} />;
    }
    if (segments[0] === 'courses' && segments[2] === 'entries' && segments.length === 4) {
      const found = getResolvedEntry(segments[1], segments[3]);
      if (!found) return <NotFoundPage navigate={navigate} />;
      return <EntryPage course={found.course} entry={found.entry} entryIndex={found.index} navigate={navigate} done={progress.isDone(found.entry.id)} markDone={progress.markDone} />;
    }
    return <NotFoundPage navigate={navigate} />;
  };

  return <div className="app-shell"><Navigation currentPath={path} navigate={navigate} /><div className="page-transition" key={path}>{renderPage()}</div><Footer navigate={navigate} /></div>;
}
