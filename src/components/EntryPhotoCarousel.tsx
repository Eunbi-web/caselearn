// Journal-page photo carousel — each entry holds a stack of photos instead of
// a single slot. The taped polaroid frame stays, gains prev/next arrows, a
// little counter chip and an "+ ADD PHOTO" chip under it. The framed photo
// keeps the usual hover tools: CHANGE replaces the photo you're looking at,
// ✕ removes it and the stack closes up. Photos added later simply join the
// end of the carousel; clicking the photo opens the artwork-style viewer.
// Storage keeps every photo as its own slot (entry-<id>-001, -002, …) so
// single-photo entries carry over untouched.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { iconPaths } from './Photo';
import { appendPhoto, fileToSlotDataUrl, getStoredPhoto, listPhotoSlots, removeStoredPhoto, saveStoredPhoto } from '../state/photos';

type Slide = { slot: string; src: string };

export function EntryPhotoCarousel({ entryId, icon, label, eager = false }: { entryId: string; icon: 'book' | 'bulb' | 'pencil' | 'monitor' | 'eye'; label: string; eager?: boolean }) {
  const [slides, setSlides] = useState<Slide[] | null>(null); // null = still listing
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<null | 'add' | 'swap'>(null);
  const [peek, setPeek] = useState(false); // the artwork-style enlarged viewer
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<'add' | 'change'>('add');

  const refresh = useCallback(async () => {
    const slots = await listPhotoSlots(`entry-${entryId}`);
    const loaded = await Promise.all(slots.map(async (slot) => ({ slot, src: await getStoredPhoto(slot) })));
    setSlides(loaded.filter((slide): slide is Slide => !!slide.src));
  }, [entryId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const total = slides?.length ?? 0;
  const current = total ? slides![Math.min(index, total - 1)] : null;
  const shown = Math.min(index, Math.max(0, total - 1));
  const goPrev = () => setIndex((i) => (Math.min(i, total - 1) - 1 + total) % total);
  const goNext = () => setIndex((i) => (Math.min(i, total - 1) + 1) % total);

  // the enlarged viewer: Escape closes, arrow keys flip photos while it's open
  useEffect(() => {
    if (!peek) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPeek(false);
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // stop the page scrolling behind the modal
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [peek, total]);

  const pickFile = (mode: 'add' | 'change') => {
    modeRef.current = mode;
    inputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const replacing = modeRef.current === 'change' && !!current;
    setBusy(replacing ? 'swap' : 'add');
    try {
      const dataUrl = await fileToSlotDataUrl(file);
      if (replacing) {
        await saveStoredPhoto(current!.slot, dataUrl); // upsert — stays in its place
      } else {
        await appendPhoto(`entry-${entryId}`, dataUrl);
        setIndex(total); // land on the freshly added slide
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Could not save the photo:\n${message}`);
    } finally {
      setBusy(null);
      void refresh();
    }
  };

  const removeCurrent = async () => {
    if (!current) return;
    try {
      await removeStoredPhoto(current.slot);
      setIndex(Math.max(0, Math.min(index, total - 2)));
    } catch (error) {
      window.alert(`Could not remove the photo:\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      void refresh();
    }
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(event) => { void handleFiles(event.target.files); event.target.value = ''; }}
    />
  );

  return (
    <>
      <span className="entry-photo polaroid">
        <span className="tape tape-top" aria-hidden="true" />
        <span className="polaroid-window photo-slot" style={{ display: 'block' }}>
          {current ? (
            <>
              <img
                className="photo photo-peeks"
                src={current.src}
                alt={`${label} — photo ${shown + 1} of ${total}`}
                loading={eager && index === 0 ? 'eager' : 'lazy'}
                title="click to view enlarged"
                onClick={() => setPeek(true)}
              />
              {input}
              <span className={`photo-edit ${busy === 'swap' ? 'is-busy' : ''}`}>
                <button type="button" className="photo-edit-btn" onClick={() => pickFile('change')}>
                  {busy === 'swap' ? 'SAVING…' : 'CHANGE'}
                </button>
                <button type="button" className="photo-edit-btn photo-edit-remove" onClick={() => { void removeCurrent(); }} title="Remove this photo from the carousel">
                  ✕
                </button>
              </span>
            </>
          ) : (
            <>
              <span className="photo-fallback" role="img" aria-label={label}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{iconPaths[icon]}</svg>
                <small>{slides === null ? 'looking for photos…' : 'no photos yet — hover to add the first one'}</small>
              </span>
              {input}
              <span className="photo-edit">
                <button type="button" className="photo-edit-btn" onClick={() => pickFile('add')}>
                  {busy === 'add' ? 'SAVING…' : 'UPLOAD ⤴'}
                </button>
              </span>
            </>
          )}
        </span>
        {total > 0 && (
          <span className="carousel-strip">
            <button type="button" className="car-arrow" onClick={goPrev} disabled={total < 2} aria-label="Previous photo">
              ‹
            </button>
            <span className="car-count">{shown + 1} / {total}</span>
            <button type="button" className="car-arrow" onClick={goNext} disabled={total < 2} aria-label="Next photo">
              ›
            </button>
            <button type="button" className="photo-edit-btn car-add" onClick={() => pickFile('add')} disabled={!!busy}>
              {busy === 'add' ? 'SAVING…' : '+ ADD PHOTO'}
            </button>
          </span>
        )}
      </span>
      {peek && current && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${label} viewer`} onClick={() => setPeek(false)}>
          <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setPeek(false)}>✕ CLOSE</button>
            <img src={current.src} alt={`${label} — enlarged view`} />
            <span className="lightbox-caption">{label} · photo {shown + 1} of {total}</span>
            {total > 1 && (
              <>
                <button type="button" className="car-arrow lightbox-nav lightbox-nav-l" onClick={goPrev} aria-label="Previous photo">‹</button>
                <button type="button" className="car-arrow lightbox-nav lightbox-nav-r" onClick={goNext} aria-label="Next photo">›</button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
