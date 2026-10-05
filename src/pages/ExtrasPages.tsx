import { useEffect, useState } from 'react';
import { photoSaveHint } from '../lib/supabase';
import { addPost, deletePost, savePostEdit, useJournal } from '../state/journal';
import { formatDateLabel, todayIso } from '../state/edits';
import { getStoredPhoto, subscribePhoto } from '../state/photos';
import { Photo } from '../components/Photo';
import type { Navigate } from '../components/UI';

/** Slots per gallery page. Slots are named artwork-01, artwork-02, … —
    page 1 is artwork-01…06, page 2 artwork-07…12, and so on. */
const PAGE_SIZE = 6;

/** Tracks which artwork slots hold an upload. Grows automatically: as soon
    as every slot of the current last page is filled, the next page exists. */
function useArtworkGallery(): { pages: number; filled: Record<number, boolean> } {
  const [slotCount, setSlotCount] = useState(PAGE_SIZE);
  const [filled, setFilled] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;
    const unsubs: (() => void)[] = [];
    for (let index = 1; index <= slotCount; index++) {
      const slot = `artwork-${String(index).padStart(2, '0')}`;
      getStoredPhoto(slot).then((value) => { if (alive) setFilled((current) => ({ ...current, [index]: Boolean(value) })); });
      unsubs.push(subscribePhoto(slot, (value) => { if (alive) setFilled((current) => ({ ...current, [index]: Boolean(value) })); }));
    }
    return () => { alive = false; unsubs.forEach((unsubscribe) => unsubscribe()); };
  }, [slotCount]);

  const highestFilled = Object.keys(filled).reduce(
    (max, key) => (filled[Number(key)] ? Math.max(max, Number(key)) : max),
    0,
  );
  // +1: when the last slot of the final page is filled, another page is needed
  const pages = Math.max(1, Math.ceil((highestFilled + 1) / PAGE_SIZE));
  const needed = pages * PAGE_SIZE;
  if (needed !== slotCount) setSlotCount(needed); // derived state; re-renders immediately
  return { pages, filled };
}

type Lightbox = { src: string; alt: string } | null;

/** ART WORKS → PORTFOLIO — lavender card, script subtitle, rule, then the
    artwork gallery: one page at a time with PREVIOUS/NEXT buttons, uncropped
    frames, click any uploaded artwork to view it enlarged in a modal. */
export function PortfolioPage({ navigate }: { navigate: Navigate }) {
  const { pages, filled } = useArtworkGallery();
  const [currentPage, setCurrentPage] = useState(0);
  const [lightbox, setLightbox] = useState<Lightbox>(null);
  const page = Math.min(currentPage, pages - 1); // pages can shrink after removals

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // stop the page scrolling behind the modal
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox]);

  const openViewer = (index: number, event: React.MouseEvent) => {
    const img = (event.target as HTMLElement).closest('img.photo') as HTMLImageElement | null;
    if (!img || !filled[index]) return; // empty frames only offer the upload controls
    setLightbox({ src: img.src, alt: `Artwork ${String(index).padStart(2, '0')} — enlarged view` });
  };

  return (
    <main className="shell page-shell extras-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>← CASE FILE</button><span>/</span><span>EXTRAS / ART WORKS</span></div>
      <div className="menu-card menu-extras extras-wide portfolio-wide">
        <h1 className="card-heading">⋆ PORTFOLIO ⋆</h1>
        <p className="card-script">here is a compilation of my artworks in general</p>
        <div className="card-rule" />
        <div className="gallery">
          {Array.from({ length: PAGE_SIZE }, (_, offset) => {
            const index = page * PAGE_SIZE + offset + 1;
            const slot = `artwork-${String(index).padStart(2, '0')}`;
            return (
              <figure key={slot} className="artwork" onClick={(event) => openViewer(index, event)}>
                <Photo name={slot} icon="star" label={`Artwork ${String(index).padStart(2, '0')}`} editable eager={index === 1} />
              </figure>
            );
          })}
        </div>
        {pages > 1 && (
          <div className="portfolio-pager">
            <button className="button button-ghost button-small" onClick={() => setCurrentPage(page - 1)} disabled={page === 0}>← PREVIOUS PAGE</button>
            <span className="portfolio-pager-label">PAGE {String(page + 1).padStart(2, '0')} / {String(pages).padStart(2, '0')}</span>
            <button className="button button-primary button-small" onClick={() => setCurrentPage(page + 1)} disabled={page === pages - 1}>NEXT PAGE →</button>
          </div>
        )}
        <p className="portfolio-hint">hover a frame to upload an artwork — {photoSaveHint} · click an artwork to view it up close</p>
      </div>
      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Artwork viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="lightbox-close">✕ CLOSE</button>
          <img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  );
}

/** All uploaded images of one journal post (slots journal-<post id>-1, -2, …),
    stacked above one empty "add" slot. While the post is being edited the
    empty slot is always shown (so a new photo can be added); on a saved card
    the whole block stays hidden until the first image is uploaded. */
function JournalImages({ postId, editing }: { postId: string; editing: boolean }) {
  const [count, setCount] = useState(1);
  const [images, setImages] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let alive = true;
    const unsubs: (() => void)[] = [];
    for (let index = 1; index <= count; index++) {
      const slot = `journal-${postId}-${index}`;
      getStoredPhoto(slot).then((value) => { if (alive) setImages((current) => ({ ...current, [index]: value })); });
      unsubs.push(subscribePhoto(slot, (value) => { if (alive) setImages((current) => ({ ...current, [index]: value })); }));
    }
    return () => { alive = false; unsubs.forEach((unsubscribe) => unsubscribe()); };
  }, [postId, count]);

  const highestFilled = Object.entries(images)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => Number(key))
    .reduce((max, index) => Math.max(max, index), 0);
  const needed = Math.max(1, highestFilled + 1);
  if (needed !== count) setCount(needed); // derived state; re-renders immediately
  if (highestFilled === 0 && !editing) return null;

  return (
    <div className="journal-photos">
      {Array.from({ length: count }, (_, offset) => {
        const index = offset + 1;
        const value = images[index];
        if (!value && index !== count) return null;
        return (
          <figure key={index} className="journal-photo">
            <Photo name={`journal-${postId}-${index}`} icon="camera" label={`Journal photo ${index}`} editable eager={index === 1} />
            {!value && <figcaption className="journal-photo-hint">UPLOAD A PHOTO HERE — {photoSaveHint}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

/** LIFE UPDATES → JOURNAL — dated updates you can write, edit and delete. */
export function JournalPage({ navigate }: { navigate: Navigate }) {
  const posts = useJournal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ date: string; title: string; body: string } | null>(null);

  const startEdit = (post: { id: string; date: string; title: string; body: string }) => {
    setEditingId(post.id);
    setDraft({ date: post.date, title: post.title, body: post.body });
  };

  const startNew = () => {
    const post = addPost();
    setEditingId(post.id);
    setDraft({ date: post.date, title: post.title, body: post.body });
  };

  const save = (id: string) => {
    if (!draft) return;
    const date = draft.date || todayIso();
    savePostEdit(id, { date, dateLabel: formatDateLabel(date), title: draft.title.trim() || 'UNTITLED UPDATE', body: draft.body.trim() });
    setEditingId(null);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (window.confirm('Delete this update? This cannot be undone.')) deletePost(id);
  };

  return (
    <main className="shell page-shell extras-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>← CASE FILE</button><span>/</span><span>EXTRAS / LIFE UPDATES</span></div>
      <div className="menu-card menu-extras extras-wide">
        <h1 className="card-heading">⋆ JOURNAL ⋆</h1>
        <p className="card-script">life updates, written down as they happen</p>
        <div className="card-rule" />
        <div className="journal-list">
          {posts.map((post) => editingId === post.id && draft ? (
            <article key={post.id} className="journal-card is-editing">
              <div className="form-row">
                <label className="form-field"><span>DATE</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
                <label className="form-field form-grow"><span>TITLE</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              </div>
              <label className="form-field"><span>THE UPDATE</span><textarea rows={4} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
              <JournalImages postId={post.id} editing />
              <div className="journal-actions-row">
                <button className="button button-primary button-small" onClick={() => save(post.id)}>SAVE UPDATE</button>
                <button className="button button-ghost button-small" onClick={() => { setEditingId(null); setDraft(null); }}>CANCEL</button>
                <button className="button button-ghost button-small journal-delete" onClick={() => remove(post.id)}>✕ DELETE</button>
              </div>
            </article>
          ) : (
            <article key={post.id} className="journal-card">
              <div className="journal-top">
                <span className="journal-date">⋆ {post.dateLabel}</span>
                <span className="journal-tools">
                  <button className="journal-tool" onClick={() => startEdit(post)}>✎ EDIT</button>
                  <button className="journal-tool journal-tool-danger" onClick={() => remove(post.id)} title="Delete this update">✕</button>
                </span>
              </div>
              <h3>{post.title}</h3>
              {post.body && <p>{post.body}</p>}
              <JournalImages postId={post.id} editing={false} />
            </article>
          ))}
        </div>
        <button className="button button-primary journal-new" onClick={startNew}>+ NEW UPDATE</button>
      </div>
    </main>
  );
}
