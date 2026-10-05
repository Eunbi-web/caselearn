import { useEffect, useState } from 'react';
import type { Course, Entry } from '../data/cases';
import type { IconName } from '../components/Photo';
import { addEntry, deleteEntry, saveEntryEdit } from '../state/edits';
import { getStoredPhoto, subscribePhoto } from '../state/photos';
import { photoSaveHint } from '../lib/supabase';
import { Photo } from '../components/Photo';
import { SectionLabel, type Navigate } from '../components/UI';

// ---------------------------------------------------------------
// Course page — one long, vertically scrolling sheet per course.
// Each topic is just:  TOPIC TITLE  →  uploaded image(s).
// Images live in the photo-slot system (Supabase storage or
// IndexedDB), slots named  topic-<entry id>-1, -2, …
// ---------------------------------------------------------------

/** All uploaded images of one topic, stacked vertically, plus one
    empty "add" slot at the end. Growing/shrinking is derived from
    which slots currently hold an image. */
function TopicImages({ topicId, icon, title }: { topicId: string; icon: IconName; title: string }) {
  const [count, setCount] = useState(1);
  const [images, setImages] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let alive = true;
    const unsubs: (() => void)[] = [];
    for (let index = 1; index <= count; index++) {
      const slot = `topic-${topicId}-${index}`;
      getStoredPhoto(slot).then((value) => { if (alive) setImages((current) => ({ ...current, [index]: value })); });
      unsubs.push(subscribePhoto(slot, (value) => { if (alive) setImages((current) => ({ ...current, [index]: value })); }));
    }
    return () => { alive = false; unsubs.forEach((unsubscribe) => unsubscribe()); };
  }, [topicId, count]);

  const highestFilled = Object.entries(images)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => Number(key))
    .reduce((max, index) => Math.max(max, index), 0);
  const needed = Math.max(1, highestFilled + 1);
  if (needed !== count) setCount(needed); // derived state; re-renders immediately

  return (
    <div className="topic-figures">
      {Array.from({ length: count }, (_, offset) => {
        const index = offset + 1;
        const value = images[index];
        // mid-stack gaps (a removed image) stay invisible; only the final slot shows as "add"
        if (!value && index !== count) return null;
        return (
          <figure key={index} className="topic-figure">
            <Photo name={`topic-${topicId}-${index}`} icon={icon} label={`${title} — image ${index}`} editable eager={index === 1} />
            {!value && <figcaption className="topic-figure-hint">UPLOAD YOUR ARTWORK HERE — {photoSaveHint}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

/** One topic: title (renamable) + its images. */
function TopicSection({ course, entry }: { course: Course; entry: Entry }) {
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(entry.title);

  const saveTitle = () => {
    const title = draftTitle.trim();
    if (title && title !== entry.title) saveEntryEdit(entry.id, { title });
    setRenaming(false);
  };

  const removeTopic = () => {
    if (window.confirm(`Delete the topic "${entry.title}" and its uploaded images? This cannot be undone.`)) {
      deleteEntry(course, entry);
    }
  };

  return (
    <section className="topic-section" id={`topic-${entry.slug}`}>
      <div className="topic-head">
        {renaming ? (
          <span className="topic-rename">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') saveTitle(); if (event.key === 'Escape') setRenaming(false); }}
              autoFocus
              aria-label="Topic title"
            />
            <button className="button button-primary button-small" onClick={saveTitle}>SAVE</button>
            <button className="button button-ghost button-small" onClick={() => { setDraftTitle(entry.title); setRenaming(false); }}>CANCEL</button>
          </span>
        ) : (
          <>
            <h2>{entry.title}</h2>
            <span className="topic-tools">
              <button className="journal-tool" onClick={() => { setDraftTitle(entry.title); setRenaming(true); }} title="Rename this topic">✎ RENAME</button>
              <button className="journal-tool journal-tool-danger" onClick={removeTopic} title="Delete this topic">✕</button>
            </span>
          </>
        )}
      </div>
      <TopicImages topicId={entry.id} icon={course.icon} title={entry.title} />
    </section>
  );
}

export function CoursePage({ course, navigate }: { course: Course; navigate: Navigate }) {
  const addTopic = () => {
    const entry = addEntry(course);
    window.setTimeout(() => {
      document.getElementById(`topic-${entry.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <main className="shell page-shell course-detail-page">
      <div className="breadcrumb"><button onClick={() => navigate('/courses')}>← COURSE FOLDERS</button><span>/</span><span>{course.shortTitle.toUpperCase()}</span></div>

      <div className="dossier-frame course-header">
        <div className="dossier-tab">SUBJECT FOLDER / THIS TERM</div>
        <div className="course-longform-head">
          <SectionLabel>{course.shortTitle.toUpperCase()}</SectionLabel>
          <h1>{course.title}</h1>
        </div>
      </div>

      <div className="topic-stream">
        {course.entries.map((entry) => <TopicSection key={entry.id} course={course} entry={entry} />)}
      </div>

      <div className="topic-add-row">
        <button className="button button-primary" onClick={addTopic}>+ ADD TOPIC</button>
        <p className="topic-add-hint">Each topic keeps its own stack of images — upload, replace or remove any of them at any time.</p>
      </div>
    </main>
  );
}
