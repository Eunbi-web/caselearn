// ARTWORKS — one long paper gallery that grows by itself: the empty frame at
// the end says "add a new artwork", and as soon as you fill it another frame
// appears below. Click any uploaded artwork to view it enlarged in a modal.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';
import { PageHero } from '../components/UI';
import { getStoredPhoto, subscribePhoto } from '../state/photos';

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

const TAGS = ['photo / kept work', 'sketchbook page', 'on the desk', 'visual note', 'working piece', 'scrap & study'];

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
        kicker="things made along the way"
        title="artworks"
        sub="A long scroll of pictures, experiments, and bits I wanted to keep."
      />
      <div className="sheet-pad">
        <p className="tip-line">
          <span className="spark" aria-hidden="true">✳</span>
          one continuous gallery — click a piece to see it up close
          <span aria-hidden="true">↓</span>
        </p>

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
                <h3>{`Artwork ${String(index).padStart(2, '0')}`}</h3>
                {isLast(index) && !filled[index] ? (
                  <span className="artwork-add-caption">room for another piece — hover the frame and upload ⤴</span>
                ) : (
                  <>
                    {filled[index] && <span className="g-desc" style={{ cursor: 'zoom-in' }}>click to view up close ⤢</span>}
                    <span className="g-tag">{TAGS[(index - 1) % TAGS.length]}</span>
                  </>
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

      {/* eyes sliding down the long gallery's empty wall margins, alternating
          sides so they line the scroll like little watchers */}
      <ScatteredEyes
        spots={[
          { top: '6%', right: '2%', size: 'clamp(80px, 8.5vw, 128px)', rotate: 12, drift: 0, z: 0, eager: true },
          { top: '38%', left: '1.5%', size: 'clamp(54px, 5.5vw, 84px)', rotate: -20, flip: true, drift: 1.8, z: 0 },
          { top: '50%', right: '5.5%', size: 'clamp(58px, 6vw, 88px)', rotate: 8, drift: 3.6, z: 0 },
          { top: '68%', right: '1%', size: 'clamp(110px, 11.5vw, 170px)', rotate: 34, spin: true, drift: .9, z: 0 },
          { top: '93%', left: '4%', size: 'clamp(44px, 4.5vw, 66px)', rotate: -6, flip: true, drift: 2.6, z: 0 },
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
    </div>
  );
}
