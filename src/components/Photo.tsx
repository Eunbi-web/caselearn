import { useEffect, useRef, useState } from 'react';
import { fileToSlotDataUrl, getStoredPhoto, removeStoredPhoto, saveStoredPhoto, subscribePhoto } from '../state/photos';

export type IconName = 'user' | 'book' | 'bulb' | 'pencil' | 'monitor' | 'eye' | 'camera' | 'star';

const iconPaths: Record<IconName, React.ReactNode> = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M20 18.5H6.5A2.5 2.5 0 0 0 4 21" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.2 1.5 2.1h4c0-.9.7-1.5 1.5-2.1A6 6 0 0 0 12 3z" /></>,
  pencil: <><path d="M17 3l4 4L8 20l-5 1 1-5z" /><path d="m14 6 4 4" /></>,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M9 21h6M12 17v4" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="3" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="14" r="3.5" /></>,
  star: <><path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9z" /></>,
};

/** Knocks a flat near-white background out of a still image (doodle slot). */
async function knockOutWhite(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const px = frame.data;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i] > 232 && px[i + 1] > 232 && px[i + 2] > 232) px[i + 3] = 0;
        }
        context.putImageData(frame, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null); // tainted canvas etc. — show the original
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

const whiteKeyCache = new Map<string, string | null>();

/**
 * A picture slot. Resolution order:
 *   1. a photo uploaded from the site (saved in this browser)
 *   2. public/photos/<name>.jpg, then .png
 *   3. a themed placeholder naming the file to add
 * With `editable`, hovering the photo reveals UPLOAD/CHANGE (+ remove) controls.
 * With `whiteKey`, uploaded still images get their flat near-white background
 * erased automatically; GIFs are always stored byte-for-byte so animation and
 * real transparency survive (passing them through canvas would flatten both).
 */
export function Photo({ name, icon = 'camera', label, className = '', eager = false, editable = false, whiteKey = false }: { name: string; icon?: IconName; label: string; className?: string; eager?: boolean; editable?: boolean; whiteKey?: boolean }) {
  const [custom, setCustom] = useState<string | null | undefined>(undefined); // undefined = still checking
  const [attempt, setAttempt] = useState(0); // 0 = jpg, 1 = png, 2 = placeholder
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setAttempt(0);
    getStoredPhoto(name).then((value) => { if (alive) setCustom(value); });
    const unsubscribe = subscribePhoto(name, (value) => { if (alive) { setCustom(value); setAttempt(0); } });
    return () => { alive = false; unsubscribe(); };
  }, [name]);

  const staticSrc = attempt === 0 ? `${import.meta.env.BASE_URL}photos/${name}.jpg` : attempt === 1 ? `${import.meta.env.BASE_URL}photos/${name}.png` : null;
  const src = custom ?? staticSrc;
  const isGif = !!src && (src.startsWith('data:image/gif') || /\.gif(\?|#|$)/i.test(src));

  // whiteKey slots: erase the flat white background of still images at render
  // time; GIFs (uploaded bytes) are shown as-is so animation survives.
  const [knocked, setKnocked] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setKnocked(null);
    if (!whiteKey || !src || isGif) return;
    const cached = whiteKeyCache.get(src);
    if (cached !== undefined) { setKnocked(cached); return; }
    knockOutWhite(src).then((out) => {
      if (!alive) return;
      whiteKeyCache.set(src, out);
      setKnocked(out);
    });
    return () => { alive = false; };
  }, [src, whiteKey, isGif]);
  const displaySrc = whiteKey && knocked ? knocked : (src ?? undefined);

  const image = src ? (
    <img
      className={`photo ${className}`}
      src={displaySrc}
      alt={label}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => { if (typeof custom !== 'string') setAttempt((current) => current + 1); }}
    />
  ) : (
    <span className={`photo-fallback ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{iconPaths[icon]}</svg>
      <small>photos/{name}.jpg</small>
    </span>
  );

  if (!editable) return image;

  const handleFiles = async (files: FileList | null) => {    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setBusy(true);
    try {
      let dataUrl = await fileToSlotDataUrl(file);
      if (whiteKey && file.type !== 'image/gif') {
        dataUrl = (await knockOutWhite(dataUrl)) ?? dataUrl;
      }
      await saveStoredPhoto(name, dataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Could not upload the photo:\n${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className={`photo-slot ${src ? '' : 'is-empty'} ${className}`}>
      {image}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => { handleFiles(event.target.files); event.target.value = ''; }}
      />
      <span className={`photo-edit ${busy ? 'is-busy' : ''}`}>
        <button type="button" className="photo-edit-btn" onClick={() => inputRef.current?.click()}>
          {busy ? 'SAVING…' : custom ? 'CHANGE PHOTO' : 'UPLOAD ⤴'}
        </button>
        {custom && (
          <button type="button" className="photo-edit-btn photo-edit-remove" onClick={() => { removeStoredPhoto(name).catch((error) => window.alert(`Could not remove the photo:\n${error instanceof Error ? error.message : String(error)}`)); }} title="Remove this uploaded photo">
            ✕
          </button>
        )}
      </span>
    </span>
  );
}

/** Instant-photo frame: white border, tape strip, handwritten-style caption. */
export function Polaroid({ name, icon = 'camera', label, caption, className = '', rotate = 'left', editable = false }: { name: string; icon?: IconName; label: string; caption?: string; className?: string; rotate?: 'left' | 'right' | 'none'; editable?: boolean }) {
  return (
    <figure className={`polaroid polaroid-${rotate} ${className}`}>
      <span className="polaroid-tape" aria-hidden="true" />
      <div className="polaroid-window"><Photo name={name} icon={icon} label={label} editable={editable} /></div>
      {caption && <figcaption className="polaroid-caption">{caption}</figcaption>}
    </figure>
  );
}
