// Photo uploads — every upload slot on the site (profile photo, entry photos,
// folder covers, portfolio artworks).
//   • Supabase configured → files go to the public `site-photos` storage
//     bucket and are recorded in the `photos` table (slot → storage path),
//     so uploads are shared with every visitor. Uploads are owner-only (RLS).
//   • No Supabase → stored client-side in IndexedDB so they survive refreshes
//     without a backend.
//
// Resolution order in the Photo component:
//   1. an uploaded photo for this slot (this module)
//   2. public/photos/<name>.jpg  →  .png
//   3. the themed placeholder

import { SITE_PHOTOS_BUCKET, hasSupabase, supabase } from '../lib/supabase';

const DB_NAME = 'case-file-photos';
const STORE = 'photos';

// --- remote (Supabase storage) ------------------------------------------------

const remoteCache = new Map<string, string | null>();

function publicUrl(client: NonNullable<typeof supabase>, path: string): string {
  return client.storage.from(SITE_PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

// --- local (IndexedDB) ---------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, access: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = access(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

// --- public API ----------------------------------------------------------------

export async function getStoredPhoto(name: string): Promise<string | null> {
  const client = supabase;
  if (client && hasSupabase) {
    if (remoteCache.has(name)) return remoteCache.get(name) ?? null;
    try {
      const { data, error } = await client.from('photos').select('storage_path').eq('slot', name).maybeSingle();
      if (error) throw error;
      const url = data ? publicUrl(client, data.storage_path) : null;
      remoteCache.set(name, url);
      return url;
    } catch (error) {
      console.error(`[case-file] loading photo "${name}":`, error);
      remoteCache.set(name, null);
      return null;
    }
  }
  try {
    return (await run<string | undefined>('readonly', (store) => store.get(name))) ?? null;
  } catch {
    return null;
  }
}

export async function saveStoredPhoto(name: string, dataUrl: string): Promise<void> {
  const client = supabase;
  if (client && hasSupabase) {
    const blob = await (await fetch(dataUrl)).blob();
    const contentType = blob.type || 'image/jpeg';
    const extension = contentType.includes('gif')
      ? 'gif'
      : contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : 'jpg';
    const path = `slots/${name}-${Date.now().toString(36)}.${extension}`;
    const { error } = await client.storage.from(SITE_PHOTOS_BUCKET).upload(path, blob, { contentType });
    if (error) throw error;
    const { error: dbError } = await client
      .from('photos')
      .upsert({ slot: name, storage_path: path, content_type: contentType });
    if (dbError) throw dbError;
    remoteCache.set(name, publicUrl(client, path));
    emit(name);
    return;
  }
  await run('readwrite', (store) => store.put(dataUrl, name));
  emit(name);
}

export async function removeStoredPhoto(name: string): Promise<void> {
  const client = supabase;
  if (client && hasSupabase) {
    try {
      const { data } = await client.from('photos').select('storage_path').eq('slot', name).maybeSingle();
      if (data?.storage_path) {
        await client.storage.from(SITE_PHOTOS_BUCKET).remove([data.storage_path]);
      }
    } catch (error) {
      console.error(`[case-file] removing file for "${name}":`, error); // row removal still proceeds
    }
    const { error } = await client.from('photos').delete().eq('slot', name);
    if (error) throw error;
    remoteCache.set(name, null);
    emit(name);
    return;
  }
  await run('readwrite', (store) => store.delete(name));
  emit(name);
}

// --- multi-photo slots (entry carousels) ---------------------------------------
//
// A carousel owns every slot that shares a base name: the bare base slot
// (single-photo uploads from before the carousel existed) acts as slide one,
// and each added photo gets a zero-padded `-NNN` suffix. Sorting by slot name
// therefore keeps the insertion order, and replacing a photo keeps its place.

/** Every photo slot for a base name, in carousel order. */
export async function listPhotoSlots(base: string): Promise<string[]> {
  const client = supabase;
  if (client && hasSupabase) {
    const [legacy, rows] = await Promise.all([
      client.from('photos').select('slot').eq('slot', base).maybeSingle(),
      client.from('photos').select('slot').like('slot', `${base}-%`).order('slot'),
    ]);
    if (rows.error || legacy.error) {
      console.error(`[case-file] listing photos for "${base}":`, rows.error?.message ?? legacy.error?.message);
    }
    const suffixed: string[] = (rows.data ?? []).map((row) => row.slot as string);
    return legacy.data ? [base, ...suffixed] : suffixed;
  }
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys();
      request.onsuccess = () => {
        const keys = request.result as string[];
        resolve(keys.filter((key) => key === base || key.startsWith(`${base}-`)).sort());
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** Saves an uploaded photo as the next slide of a carousel; returns the slot. */
export async function appendPhoto(base: string, dataUrl: string): Promise<string> {
  const existing = await listPhotoSlots(base);
  let max = 0;
  for (const slot of existing) {
    const n = parseInt(slot.slice(base.length).replace(/^-/, ''), 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  const slot = `${base}-${String(max + 1).padStart(3, '0')}`;
  await saveStoredPhoto(slot, dataUrl);
  return slot;
}

const listeners = new Map<string, Set<(value: string | null) => void>>();

export function subscribePhoto(name: string, listener: (value: string | null) => void): () => void {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

function emit(name: string) {
  listeners.get(name)?.forEach((listener) => {
    getStoredPhoto(name).then((value) => listener(value));
  });
}

// --- file → slot image ------------------------------------------------------

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Reads an image file, shrinks it to a sane size, and returns a data URL.
 * GIFs skip the canvas entirely — drawing one frame would flatten animation
 * and drop the transparency — so they upload exactly as-is.
 */
export async function fileToSlotDataUrl(file: File, max = 1280): Promise<string> {
  const raw = await readFile(file);
  if (file.type === 'image/gif') return raw;
  const image = await loadImage(raw);
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  if (scale === 1 && file.size <= 700_000) return raw;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return raw;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
}
