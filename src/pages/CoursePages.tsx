import { useState } from 'react';
import type { Course, Entry } from '../data/cases';
import { useOwner } from '../lib/owner';
import { addEntry, deleteEntry, formatDateLabel, saveEntryEdit, todayIso } from '../state/edits';
import { Polaroid } from '../components/Photo';
import { CaseMeta, DossierFrame, EntryCard, PageIntro, ProgressBar, SectionLabel, StatusBadge, type Navigate } from '../components/UI';

export function CoursePage({ course, navigate, getCourseProgress, isDone }: { course: Course; navigate: Navigate; getCourseProgress: (course: Course) => { completed: number; total: number; percent: number }; isDone: (id: string) => boolean }) {
  const progress = getCourseProgress(course);
  const { canEdit } = useOwner();
  const addNew = () => {
    const entry = addEntry(course);
    navigate(`/courses/${course.slug}/entries/${entry.slug}`);
  };
  return <main className="shell page-shell course-detail-page"><div className="breadcrumb"><button onClick={() => navigate('/courses')}>← COURSE FOLDERS</button><span>/</span><span>FOLDER #{course.caseNumber}</span></div><DossierFrame tab="SUBJECT FOLDER / THIS TERM" className="course-header"><div className="course-header-top"><SectionLabel>FOLDER #{course.caseNumber} / {course.shortTitle.toUpperCase()}</SectionLabel><StatusBadge tone={progress.percent === 100 ? 'complete' : 'active'}>{progress.percent === 100 ? 'ALL DONE ✓' : 'IN PROGRESS'}</StatusBadge></div><div className="course-header-main"><div><h1>{course.title}</h1><p>{course.description}</p></div><div className="header-side"><Polaroid name={`course-${course.slug}`} icon={course.icon} label={course.title} caption={`folder #${course.caseNumber}`} rotate="right" editable /><div className="course-progress-panel"><span className="mono-label">FOLDER PROGRESS</span><strong>{progress.percent}%</strong><ProgressBar percent={progress.percent} /></div></div></div><CaseMeta course={course} /></DossierFrame><div className="evidence-heading"><div><SectionLabel>THE ENTRIES / {course.entries.length} THIS TERM</SectionLabel><h2>Every assignment, in one folder.</h2></div><p>{course.folderNote}</p></div><div className="evidence-list">{course.entries.map((item, index) => <EntryCard key={item.id} course={course} entry={item} done={isDone(item.id)} navigate={navigate} index={index} />)}</div><div className="course-next"><span>{course.entries.length ? 'KEEP GOING / NEXT ENTRY UP' : 'THE FOLDER IS EMPTY'}</span><span className="course-next-actions">{course.entries.length > 0 && <button className="button button-ghost" onClick={() => navigate(`/courses/${course.slug}/entries/${course.entries[0].slug}`)}>OPEN FIRST ENTRY <span>↗</span></button>}{canEdit && <button className="button button-primary" onClick={addNew}>+ ADD ENTRY</button>}</span></div></main>;
}

type EntryDraft = {
  title: string;
  date: string;
  about: string;
  description: string;
  keyPointsText: string;
  notesText: string;
  task: string;
  wrapUp: string;
};

function draftFrom(entry: Entry): EntryDraft {
  return {
    title: entry.title,
    date: entry.date,
    about: entry.about,
    description: entry.description,
    keyPointsText: entry.keyPoints.join('\n'),
    notesText: entry.notes.join('\n'),
    task: entry.task,
    wrapUp: entry.wrapUp,
  };
}

const toLines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);

export function EntryPage({ course, entry, entryIndex, navigate, done, markDone }: { course: Course; entry: Entry; entryIndex: number; navigate: Navigate; done: boolean; markDone: (id: string) => void }) {
  const previous = course.entries[entryIndex - 1];
  const next = course.entries[entryIndex + 1];
  const { canEdit } = useOwner();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EntryDraft | null>(null);

  const startEdit = () => { setDraft(draftFrom(entry)); setEditing(true); };
  const cancelEdit = () => { setDraft(null); setEditing(false); };
  const saveEdit = () => {
    if (!draft) return;
    const date = draft.date || todayIso();
    saveEntryEdit(entry.id, {
      title: draft.title.trim() || 'UNTITLED ENTRY',
      date,
      dateLabel: formatDateLabel(date),
      about: draft.about.trim(),
      description: draft.description.trim(),
      keyPoints: toLines(draft.keyPointsText),
      notes: toLines(draft.notesText),
      task: draft.task.trim(),
      wrapUp: draft.wrapUp.trim(),
    });
    setEditing(false);
    setDraft(null);
  };
  const removeEntry = () => {
    if (window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) {
      deleteEntry(course, entry);
      navigate(`/courses/${course.slug}`);
    }
  };

  return <main className="shell page-shell evidence-page"><div className="breadcrumb"><button onClick={() => navigate(`/courses/${course.slug}`)}>← FOLDER #{course.caseNumber}</button><span>/</span><span>ENTRY {String(entryIndex + 1).padStart(2, '0')}</span></div><div className="evidence-doc-grid"><aside className="evidence-rail"><SectionLabel>FOLDER #{course.caseNumber}</SectionLabel><div className="rail-title">{course.shortTitle}</div><div className="rail-rule" /><span className="mono-label">ENTRY INDEX</span><ol>{course.entries.map((item, index) => <li key={item.id} className={index === entryIndex ? 'current' : ''}><button onClick={() => navigate(`/courses/${course.slug}/entries/${item.slug}`)}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}{done && index === entryIndex ? <b>✓</b> : null}</button></li>)}</ol><div className="rail-bottom"><span className="mono-label">ENTRY STATUS</span><StatusBadge tone={done ? 'complete' : 'active'}>{done ? 'DONE ✓' : 'TO DO'}</StatusBadge></div></aside><article className="evidence-document"><div className="document-topline"><SectionLabel>FOLDER #{course.caseNumber} — ENTRY {String(entryIndex + 1).padStart(2, '0')}</SectionLabel><span className="document-tools">{editing ? <span className="document-date document-editing">✎ EDITING…</span> : canEdit && <button className="document-edit-btn" onClick={startEdit}>✎ EDIT ENTRY</button>}<span className="document-date">{entry.dateLabel}</span></span></div><figure className="document-photo"><Polaroid name={`entry-${entry.id}`} icon={course.icon} label={entry.title} rotate="right" editable caption={`${entry.title.toLowerCase()} — ${course.shortTitle.toLowerCase()}`} /></figure>{editing && draft ? (
    <div className="edit-form">
      <div className="form-row">
        <label className="form-field form-grow"><span>TITLE</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="form-field form-date"><span>DATE</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
      </div>
      <label className="form-field"><span>THE LEDE — ONE LINE ABOUT THIS ENTRY</span><input value={draft.about} onChange={(event) => setDraft({ ...draft, about: event.target.value })} placeholder="First entry: what it means to…" /></label>
      <label className="form-field"><span>THE DESCRIPTION</span><textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
      <div className="form-row">
        <label className="form-field"><span>KEY POINTS — ONE PER LINE</span><textarea rows={4} value={draft.keyPointsText} onChange={(event) => setDraft({ ...draft, keyPointsText: event.target.value })} /></label>
        <label className="form-field"><span>MY NOTES — ONE PER LINE</span><textarea rows={4} value={draft.notesText} onChange={(event) => setDraft({ ...draft, notesText: event.target.value })} /></label>
      </div>
      <label className="form-field"><span>THE TASK</span><textarea rows={2} value={draft.task} onChange={(event) => setDraft({ ...draft, task: event.target.value })} /></label>
      <label className="form-field"><span>WRAP-UP</span><input value={draft.wrapUp} onChange={(event) => setDraft({ ...draft, wrapUp: event.target.value })} /></label>
    </div>
  ) : (
    <>
      <h1>{entry.title.split(' ').map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}</h1>
      {entry.about && <p className="document-intro">{entry.about}</p>}
      <div className="document-rule" />
      {entry.description && <DocumentSection title="THE DESCRIPTION" body={entry.description} />}
      {entry.keyPoints.length > 0 && <DocumentList title="KEY POINTS" items={entry.keyPoints} accent="blue" />}
      {entry.notes.length > 0 && <DocumentList title="MY NOTES" items={entry.notes} accent="wine" />}
      {entry.task && <section className="task-callout"><SectionLabel>THE TASK</SectionLabel><p>{entry.task}</p></section>}
      {entry.wrapUp && <DocumentSection title="WRAP-UP" body={entry.wrapUp} />}
    </>
  )}<div className="document-actions">{editing && draft ? (<>
    <button className="button button-primary" onClick={saveEdit}>SAVE CHANGES</button>
    <button className="button button-ghost" onClick={cancelEdit}>CANCEL</button>
    <button className="button button-ghost journal-delete" onClick={removeEntry}>✕ DELETE ENTRY</button>
  </>) : (<>
    <button className="button button-ghost" onClick={() => previous && navigate(`/courses/${course.slug}/entries/${previous.slug}`)} disabled={!previous}>← PREVIOUS ENTRY</button>
    {canEdit && <button className={`button ${done ? 'button-complete' : 'button-primary'}`} onClick={() => markDone(entry.id)}>{done ? '✓ DONE' : 'MARK AS DONE'}</button>}
    <button className="button button-ghost" onClick={() => next && navigate(`/courses/${course.slug}/entries/${next.slug}`)} disabled={!next}>NEXT ENTRY →</button>
  </>)}</div></article></div></main>;
}

function DocumentSection({ title, body }: { title: string; body: string }) { return <section className="document-section"><SectionLabel>{title}</SectionLabel><p>{body}</p></section>; }
function DocumentList({ title, items, accent }: { title: string; items: string[]; accent: 'blue' | 'wine' }) { return <section className={`document-section document-list-section accent-${accent}`}><SectionLabel>{title}</SectionLabel><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }

const NODE_POSITIONS = ['node-north', 'node-east', 'node-south', 'node-west', 'node-northwest'];

export function ProgressPage({ courses, navigate, getCourseProgress, overall }: { courses: Course[]; navigate: Navigate; getCourseProgress: (course: Course) => { completed: number; total: number; percent: number }; overall: { completed: number; total: number; percent: number } }) {
  return <main className="shell page-shell board-page"><PageIntro kicker="ALL FOLDERS / AT A GLANCE" title="PROGRESS BOARD" description="Every subject, every entry, and how far each folder has come. Pin your wins." /><div className="board-meta"><span><strong>{overall.percent}%</strong> ALL FOLDERS</span><span>{overall.completed} / {overall.total} ENTRIES DONE</span><span className="board-live"><i /> UPDATED AS YOU GO</span></div><div className="board-canvas"><div className="connector connector-a" /><div className="connector connector-b" /><div className="connector connector-c" /><div className="connector connector-d" /><div className="connector connector-e" /><div className="master-node"><span className="node-kicker">ALL FOLDERS</span><strong>MY<br /><em>CASE FILE</em></strong><span className="master-seal">{overall.percent}%</span><span className="node-footer">05 FOLDERS / {overall.total} ENTRIES</span></div>{courses.map((course, index) => { const progress = getCourseProgress(course); return <button key={course.slug} className={`board-node ${NODE_POSITIONS[index] ?? 'node-northwest'}`} onClick={() => navigate(`/courses/${course.slug}`)}><div className="node-top"><span>FOLDER #{course.caseNumber}</span><StatusBadge tone={progress.percent === 100 ? 'complete' : 'active'}>{progress.percent === 100 ? 'DONE ✓' : 'TO DO'}</StatusBadge></div><strong>{course.shortTitle}</strong><span className="node-count">{progress.completed} / {progress.total} ENTRIES DONE</span><ProgressBar percent={progress.percent} compact /><span className="node-open">VIEW FOLDER ↗</span></button>; })}</div><div className="board-legend"><span><i className="legend-dot legend-done" /> DONE ✓</span><span><i className="legend-dot legend-todo" /> TO DO</span><span><i className="legend-line" /> LINKED FOLDERS</span></div></main>;
}
