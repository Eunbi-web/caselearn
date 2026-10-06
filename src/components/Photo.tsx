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

/**
 * A picture slot. Resolution order:
 *   1. a photo uploaded from the site (saved in this browser)
 *   2. public/photos/<name>.jpg, then .png
 *   3. a themed placeholder naming the file to add
 * With `editable`, hovering the photo reveals UPLOAD/CHANGE (+ remove) controls.
 */
export function Photo({ name, icon = 'camera', label, className = '', eager = false, editable = false }: { name: string; icon?: IconName; label: string; className?: string; eager?: boolean; editable?: boolean }) {
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

  const image = src ? (
    <img
      className={`photo ${className}`}
      src={src}
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

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setBusy(true);
    try {
      await saveStoredPhoto(name, await fileToSlotDataUrl(file));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Could not upload the photo:\n${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className={`photo-slot ${className}`}>
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

/**
 * Scrapbook collage of paper clippings for the home folder: three overlapping,
 * hand-cut photo slots (each uploadable) with tape, a doodle and a scribbled note.
 */
export function ClippingCollage() {
  return (
    <span className="clip-collage">
      <span className="clip-frame clip-second">
        <Photo name="collage-a" icon="star" label="Second cut-out photo" editable />
      </span>
      <span className="clip-frame clip-main">
        <span className="clip-tape tape-a" aria-hidden="true" />
        <Photo name="profile-photo" icon="user" label="Main cut-out photo" editable eager />
      </span>
      <span className="clip-frame clip-third">
        <span className="clip-tape tape-b" aria-hidden="true" />
        <Photo name="collage-b" icon="camera" label="Third cut-out photo" editable />
      </span>
      <svg className="clip-doodle" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 3l4.6 9.6 10.4 1.4-7.6 7.3 1.9 10.4L20 26.8 10.7 31.7l1.9-10.4L5 14l10.4-1.4z" />
      </svg>
      <span className="clip-scrawl" aria-hidden="true">case no. 001 ✦</span>
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
