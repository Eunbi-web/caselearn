// Journal-page photo carousel — each entry holds a stack of photos instead of
// a single slot. The taped polaroid frame stays, gains prev/next arrows, a
// little counter chip and an "+ ADD PHOTO" chip under it. The framed photo
// keeps the usual hover tools: CHANGE replaces the photo you're looking at,
// ✕ removes it and the stack closes up. Photos added later simply join the
// end of the carousel. Storage keeps every photo as its own slot
// (entry-<id>-001, -002, …) so single-photo entries carry over untouched.

import { useCallback, useEffect, useRef, useState } from 'react';
import { iconPaths } from './Photo';
import { appendPhoto, fileToSlotDataUrl, getStoredPhoto, listPhotoSlots, removeStoredPhoto, saveStoredPhoto } from '../state/photos';

type Slide = { slot: string; src: string };

export function EntryPhotoCarousel({ entryId, icon, label, eager = false }: { entryId: string; icon: 'book' | 'bulb' | 'pencil' | 'monitor' | 'eye'; label: string; eager?: boolean }) {
  const [slides, setSlides] = useState<Slide[] | null>(null); // null = still listing
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<null | 'add' | 'swap'>(null);
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
    <span className="entry-photo polaroid">
      <span className="tape tape-top" aria-hidden="true" />
      <span className="polaroid-window" style={{ display: 'block' }}>
        {current ? (
          <>
            <img
              className="photo"
              src={current.src}
              alt={`${label} — photo ${Math.min(index, total - 1) + 1} of ${total}`}
              loading={eager && index === 0 ? 'eager' : 'lazy'}
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
          <button
            type="button"
            className="car-arrow"
            onClick={() => setIndex((i) => (Math.min(i, total - 1) - 1 + total) % total)}
            disabled={total < 2}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <span className="car-count">{Math.min(index, total - 1) + 1} / {total}</span>
          <button
            type="button"
            className="car-arrow"
            onClick={() => setIndex((i) => (Math.min(i, total - 1) + 1) % total)}
            disabled={total < 2}
            aria-label="Next photo"
          >
            ›
          </button>
          <button type="button" className="photo-edit-btn car-add" onClick={() => pickFile('add')} disabled={!!busy}>
            {busy === 'add' ? 'SAVING…' : '+ ADD PHOTO'}
          </button>
        </span>
      )}
    </span>
  );
}
