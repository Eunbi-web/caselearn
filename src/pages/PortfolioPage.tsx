import { useEffect, useState } from 'react';
import { photoSaveHint } from '../lib/supabase';
import { getStoredPhoto, subscribePhoto } from '../state/photos';
import { Photo } from '../components/Photo';
import type { Navigate } from '../components/UI';

/** Artworks per gallery page. Slots are named artwork-01, artwork-02, … —
    page 1 is artwork-01…03, page 2 artwork-04…06, and so on. */
const PAGE_SIZE = 3;

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

/** PORTFOLIO — flickering-font title, then the artwork gallery three big
    frames at a time with PREVIOUS/NEXT. Hover a frame to upload; click an
    artwork to view it up close. */
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
    <main className="shell page-shell portfolio-page">
      <div className="breadcrumb"><button onClick={() => navigate('/')}>← NOTEBOOK</button><span>/</span><span>PORTFOLIO</span></div>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div className="eyebrow">ART WORKS</div>
        <h1 className="flicker-title">ARTWORKS</h1>
        <p style={{ marginTop: 14, color: 'var(--ink-soft)' }}>a compilation of my artworks in general — three at a time.</p>
      </div>

      <div className="gallery-big">
        {Array.from({ length: PAGE_SIZE }, (_, offset) => {
          const index = page * PAGE_SIZE + offset + 1;
          const slot = `artwork-${String(index).padStart(2, '0')}`;
          const r = [1.1, -0.9, 0.7][offset]; // subtle deterministic tilt
          return (
            <figure key={slot} className="artwork-big" style={{ '--r': r } as React.CSSProperties} onClick={(event) => openViewer(index, event)}>
              <Photo name={slot} icon="star" label={`Artwork ${String(index).padStart(2, '0')}`} editable eager={index === 1} />
            </figure>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="portfolio-pager">
          <button className="button button-ghost button-small" onClick={() => setCurrentPage(page - 1)} disabled={page === 0}>← PREVIOUS</button>
          <span className="portfolio-pager-label">{String(page + 1).padStart(2, '0')} / {String(pages).padStart(2, '0')}</span>
          <button className="button button-primary button-small" onClick={() => setCurrentPage(page + 1)} disabled={page === pages - 1}>NEXT →</button>
        </div>
      )}

      <p className="portfolio-hint">hover a frame to upload an artwork — {photoSaveHint} · click an artwork to view it up close</p>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Artwork viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="lightbox-close" onClick={() => setLightbox(null)}>✕ CLOSE</button>
          <img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  );
}
