// COURSE JOURNAL LIST — a stack of course books. Hovering pulls a book
// forward and flips up the yellow title tab; clicking opens the journal.

import { useState } from 'react';
import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';
import { ScatteredNotes } from '../components/ScatteredNotes';
import { PageHero } from '../components/UI';
import { addEntry, deleteEntry, saveEntryEdit } from '../state/edits';
import type { Course, Entry } from '../data/cases';

/** Textbook cover palettes, one per book in the pile. */
const BOOK_COLORS = ['blue', 'pink', 'yellow', 'lavender', 'green'] as const;

export function CoursesPage({ courses, navigate }: { courses: Course[]; navigate: (to: string) => void }) {
  return (
    <div className="courses-page">
      <PageHero
        num="02"
        kicker="class notes, kept together"
        title="Course journals"
        sub="Hover a paper to pull it forward. Open one to wander through the notes."
      />
      <div className="sheet-pad">
        <p className="tip-line" id="course-pile-help">
          <span className="spark" aria-hidden="true">✳</span>
          hover to pull out a book · tap it to open its page
          <span aria-hidden="true">↘</span>
        </p>

        <nav
          className="course-board"
          aria-label="Course journals"
          style={{ '--books': courses.length } as React.CSSProperties}
        >
          {courses.map((course, index) => {
            const num = String(index + 1).padStart(2, '0');
            return (
              <a
                key={course.slug}
                href={`/courses/${course.slug}`}
                className={`course-volume cycle-${index % 4} textbook-${BOOK_COLORS[index % BOOK_COLORS.length]}`}
                style={{ '--i': index } as React.CSSProperties}
                onClick={(event) => { event.preventDefault(); navigate(`/courses/${course.slug}`); }}
                title={`Open ${course.shortTitle}`}
                aria-label={`Open the ${course.shortTitle} course journal`}
                aria-describedby="course-pile-help"
              >
                <span className="course-volume-pages" aria-hidden="true" />
                <span className="course-volume-cover">
                  <span className="course-volume-kicker">course journal · {num}</span>
                  <span className="course-volume-subtitle">{course.description}</span>
                  <span className="course-volume-art" aria-hidden="true">
                    <Photo name={`course-${course.slug}`} icon={course.icon} label={`${course.shortTitle} cover`} eager={index < 3} />
                  </span>
                  <span className="course-volume-title-tab" aria-hidden="true">
                    <span>course {num}</span>
                    <strong>{course.shortTitle}</strong>
                    <span>click to open this course ↗</span>
                  </span>
                  <span className="course-volume-seal" aria-hidden="true">✳</span>
                  <span className="course-volume-spine" aria-hidden="true">
                    <span className="course-volume-number">{num}</span>
                    <strong>{course.shortTitle}</strong>
                    <span className="course-volume-spine-note">case class journal</span>
                  </span>
                </span>
              </a>
            );
          })}
        </nav>

        <p className="pile-foot">
          <span className="paper-slash">more class pages can be added whenever they happen ✎</span>
        </p>

        {/* eyes on the courses page — hero corner above the books, the empty
            wall beside the pile, and the open wall under the pile */}
        <ScatteredEyes
          spots={[
            { top: '150px', poke: 'r', rotate: -12, flip: true, drift: 0, z: 0, eager: true },
            { top: '45%', poke: 'l', rotate: -16, spin: true, drift: 0, z: 0 },
            { top: '72%', poke: 'r', rotate: 26, flip: true, drift: 1.6, z: 0 },
            { top: 'calc(100% - 200px)', poke: 'l', rotate: 10, drift: 2.4, z: 0 },
          ]}
        />

        {/* note piles on the wall beside the book pile */}
        <ScatteredNotes
          spots={[
            { top: '38%', right: '4px', pile: 3, size: 'clamp(90px, 9.5vw, 145px)', rotate: 18, eager: true },
            { top: '64%', left: '35px', pile: 2, size: 'clamp(70px, 7.5vw, 115px)', rotate: -34, flip: true },
          ]}
        />
      </div>
    </div>
  );
}

/** One journal page (accordion row) with its notes, photo and edit tools. */
function JournalPageRow({ course, entry, editing, onDelete }: { course: Course; entry: Entry; editing: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [about, setAbout] = useState(entry.about);
  const [task, setTask] = useState(entry.task);
  const index = course.entries.findIndex((item) => item.id === entry.id) + 1;

  const saveEdit = () => {
    saveEntryEdit(entry.id, { title, about, task });
    setEdit(false);
  };

  return (
    <div className={`acc-row ${open ? 'open' : ''}`}>
      <button type="button" className="acc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="acc-index">{String(index).padStart(2, '0')}</span>
        {String(index).padStart(2, '0')} — {entry.title}
        <span className="acc-sign" aria-hidden="true">{open ? '×' : '+'}</span>
      </button>
      {open && (
        <div className="acc-body">
          {edit ? (
            <div className="edit-panel">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="page title" />
              <textarea value={about} onChange={(event) => setAbout(event.target.value)} placeholder="one-line lede" />
              <textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder="the task" />
              <div className="entry-tools">
                <button type="button" className="btn btn-solid" onClick={saveEdit}>Save ✓</button>
                <button type="button" className="btn" onClick={() => setEdit(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {entry.about && <p className="entry-about">{entry.about}</p>}
              {entry.description && <p className="entry-para">{entry.description}</p>}
              {entry.keyPoints.length > 0 && (
                <>
                  <p className="list-label">key points</p>
                  <ul>{entry.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul>
                </>
              )}
              {entry.notes.length > 0 && (
                <>
                  <p className="list-label">notes</p>
                  <ul>{entry.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
                </>
              )}
              {entry.task && (
                <>
                  <p className="list-label">the task</p>
                  <p className="entry-para">{entry.task}</p>
                </>
              )}
              {entry.wrapUp && <p className="entry-para">{entry.wrapUp}</p>}
              <span className="entry-date-chip">{entry.dateLabel}</span>
              <span className="entry-photo polaroid">
                <span className="tape tape-top" aria-hidden="true" />
                <span className="polaroid-window" style={{ display: 'block' }}>
                  <Photo name={`entry-${entry.id}`} icon={course.icon} label={`${entry.title} photo`} editable />
                </span>
              </span>
              {editing && (
                <div className="entry-tools">
                  <button type="button" className="btn" onClick={() => setEdit(true)}>Edit page ✎</button>
                  <button type="button" className="btn btn-danger" onClick={onDelete}>Remove ✕</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CoursePage({ course, navigate }: { course: Course; navigate: (to: string) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`courses-page ${editing ? 'editing' : ''}`}>
      <div className="sheet-pad">
        <a href="/courses" className="back-chip" onClick={(event) => { event.preventDefault(); navigate('/courses'); }}>
          ← all course journals
        </a>
      </div>

      <PageHero num={course.caseNumber} kicker="course journal / open notebook" title={course.shortTitle} sub={course.description} />

      <div className="sheet-pad">
        <div className="course-detail">
          <figure className="polaroid course-cover">
            <span className="tape tape-top" aria-hidden="true" />
            <span className="polaroid-window" style={{ display: 'block' }}>
              <Photo name={`course-${course.slug}`} icon={course.icon} label={`${course.shortTitle} working notes`} editable eager />
            </span>
            <span className="cover-label">{course.shortTitle.toLowerCase()} — working notes</span>
          </figure>

          <div className="course-notes">
            <section className="paper-note folder-note-card">
              <span className="note-label">inside this folder</span>
              <p style={{ font: '16px var(--font-serif)', lineHeight: 1.6 }}>{course.folderNote}</p>
              <span className="scribble">keep collecting ✳</span>
            </section>

            <div>
              <h2 className="pages-head">pages in this journal</h2>
              <div className="accordion">
                {course.entries.map((entry) => (
                  <JournalPageRow
                    key={entry.id}
                    course={course}
                    entry={entry}
                    editing={editing}
                    onDelete={() => {
                      if (window.confirm(`Remove “${entry.title}” from this journal?`)) deleteEntry(course, entry);
                    }}
                  />
                ))}
              </div>
              {editing && (
                <div className="entry-tools">
                  <button type="button" className="btn btn-solid" onClick={() => { const entry = addEntry(course); navigate(`/courses/${course.slug}`); window.setTimeout(() => { window.alert('New page added — open it in the pile to edit the title.'); void entry; }, 30); }}>
                    + add a journal page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="course-foot">
          <span className="mono-tip">keep scrolling through the notes ↓</span>
          <a href="/courses" className="btn btn-solid" onClick={(event) => { event.preventDefault(); navigate('/courses'); }}>
            choose another journal ↘
          </a>
        </div>

        <div className="course-foot" style={{ paddingTop: 0 }}>
          {editing ? (
            <>
              <span className="editing-hint">pages can be titled, rewritten, added and removed — saved to the database</span>
              <button type="button" className="btn btn-solid" onClick={() => setEditing(false)}>Done editing ✓</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setEditing(true)}>Edit this journal ✎</button>
          )}
        </div>

        {/* eyes on the open journal — hero corner, wall beside the notes
            column, and the wall under the footer buttons */}
        <ScatteredEyes
          spots={[
            { top: '110px', poke: 'r', rotate: 30, flip: true, drift: 0, z: 0 },
            { top: '38%', poke: 'l', rotate: -22, spin: true, drift: 1.4, z: 0 },
            { top: '70%', poke: 'r', rotate: 8, drift: 2.8, z: 0 },
            { top: 'calc(100% - 230px)', poke: 'l', rotate: -8, flip: true, drift: .9, z: 0 },
          ]}
        />

        {/* note piles on the wall beside the open journal */}
        <ScatteredNotes
          spots={[
            { top: '26%', poke: 'l', pile: 4, rotate: 24 },
            { top: '58%', poke: 'r', pile: 1, rotate: -18, flip: true },
          ]}
        />
      </div>
    </div>
  );
}
