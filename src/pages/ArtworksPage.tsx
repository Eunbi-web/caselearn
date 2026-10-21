// ARTWORKS — one long paper gallery that grows by itself: the empty frame at
// the end says "add a new artwork", and as soon as you fill it another frame
// appears below. Click any uploaded artwork to view it enlarged in a modal.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';
import { ScatteredNotes } from '../components/ScatteredNotes';
import { PageHero } from '../components/UI';
import { getStoredPhoto, subscribePhoto } from '../state/photos';
import { getArtworkTitle, saveArtworkTitle, subscribeArtworkTitle } from '../state/artworkTitles';

/** Tracks which artwork slots hold an upload. The slot list always ends with
    one empty "add" frame — filling it grows the list again automatically. */
function useArtworkSlots(): { slots: number[]; filled: Record<number, boolean> } {
  const [slotCount, setSlotCount] = useState(6); // artwork-01…06 to start (the seeded frames)
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
  const needed = Math.max(6, highestFilled + 1); // every filled slot + one empty add frame
  if (needed !== slotCount) setSlotCount(needed); // derived state; re-renders right away

  const slots = Array.from({ length: slotCount }, (_, offset) => offset + 1);
  return { slots, filled };
}

type Lightbox = { src: string; alt: string } | null;

/** The caption title ("Artwork 01" by default) — click it to rename. Renames
    survive refreshes (localStorage, synced to Supabase when available). */
function ArtworkTitle({ slot, index }: { slot: string; index: number }) {
  const [title, setTitle] = useState(`Artwork ${String(index).padStart(2, '0')}`);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let alive = true;
    getArtworkTitle(slot).then((value) => { if (alive && value) setTitle(value); });
    const unsubscribe = subscribeArtworkTitle(slot, (value) => { if (alive && value) setTitle(value); });
    return () => { alive = false; unsubscribe(); };
  }, [slot]);

  const startEdit = () => { setDraft(title); setEditing(true); };
  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== title) void saveArtworkTitle(slot, next);
    if (next) setTitle(next);
  };

  if (editing) {
    return (
      <input
        className="gallery-title-edit"
        value={draft}
        maxLength={80}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <h3
      className="gallery-title-clickable"
      title="click to rename this artwork"
      onClick={startEdit}
    >
      {title}
    </h3>
  );
}

export function ArtworksPage({ navigate }: { navigate: (to: string) => void }) {
  const { slots, filled } = useArtworkSlots();
  const [lightbox, setLightbox] = useState<Lightbox>(null);

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

  const isLast = (index: number) => index === slots[slots.length - 1];

  return (
    <div className="artworks-page">
      <PageHero
        num="03"
        title="artworks"
      />
      <div className="sheet-pad">
        <div className="gallery-list">
          {slots.map((index) => (
            <figure
              className={`gallery-item ${isLast(index) && !filled[index] ? 'artwork-add' : ''}`}
              key={index}
              onClick={(event) => openViewer(index, event)}
            >
              <div className="g-window">
                <Photo name={`artwork-${String(index).padStart(2, '0')}`} icon="star" label={`Artwork ${String(index).padStart(2, '0')}`} editable eager={index <= 2} />
              </div>
              <figcaption className="gallery-caption">
                <span className="g-num">{String(index).padStart(2, '0')}</span>
                <ArtworkTitle slot={`artwork-${String(index).padStart(2, '0')}`} index={index} />
                {isLast(index) && !filled[index] && (
                  <span className="artwork-add-caption">room for another piece — hover the frame and upload ⤴</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="gallery-end">
          <span className="spark" aria-hidden="true">✳</span>{' '}
          that’s the bottom of this page
          <br />
          for now, anyway
        </p>

        <p className="tip-line" style={{ paddingBottom: 34 }}>
          <a href="/visual-journal" className="btn" onClick={(event) => { event.preventDefault(); navigate('/visual-journal'); }}>
            then wander into the visual journal ↘
          </a>
        </p>
      </div>

      {/* eyes on the open wall of the portfolio: the hero corner above the
          first frame, the wide empties at the bottom of the scroll, plus two
          fixed rail watchers riding the side margins the whole way down */}
      {/* eyes on the open wall of the portfolio: the hero corner above the
          first frame, pokes in the black margin at intervals down the long
          scroll, and one near the bottom of the pile */}
      <ScatteredEyes
        spots={[
          { top: '250px', poke: 'r', rotate: 12, drift: 0, eager: true },
          { top: '22%', poke: 'l', rotate: -18, spin: true, drift: .8 },
          { top: '55%', poke: 'r', rotate: 22, flip: true, drift: 2 },
          { top: 'calc(100% - 330px)', poke: 'r', rotate: 34, flip: true, drift: 1.2 },
        ]}
      />

      {/* portal: the page-transition animation keeps a transform on <main>,
          which would trap a fixed-position modal — so the lightbox lives on
          document.body instead */}
      {lightbox && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Artwork viewer" onClick={() => setLightbox(null)}>
          <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setLightbox(null)}>✕ CLOSE</button>
            <img src={lightbox.src} alt={lightbox.alt} />
            <span className="lightbox-caption">{lightbox.alt.replace(' — enlarged view', ' · kept from the pile')}</span>
          </div>
        </div>,
        document.body,
      )}
      {/* note piles on the wall between the gallery frames */}
      <ScatteredNotes
        spots={[
          { top: '400px', poke: 'l', pile: 2, rotate: -10, eager: true },
          { top: 'calc(100% - 420px)', poke: 'l', pile: 3, rotate: 26, flip: true },
        ]}
      />
    </div>
  );
}
