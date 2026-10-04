// Photo uploads — stored client-side in IndexedDB so they survive refreshes
// without a backend. Resolution order in the Photo component:
//   1. an uploaded photo for this slot (this store)
//   2. public/photos/<name>.jpg  →  .png
//   3. the themed placeholder

const DB_NAME = 'case-file-photos';
const STORE = 'photos';

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

export async function getStoredPhoto(name: string): Promise<string | null> {
  try {
    return (await run<string | undefined>('readonly', (store) => store.get(name))) ?? null;
  } catch {
    return null;
  }
}

export async function saveStoredPhoto(name: string, dataUrl: string): Promise<void> {
  await run('readwrite', (store) => store.put(dataUrl, name));
  emit(name);
}

export async function removeStoredPhoto(name: string): Promise<void> {
  await run('readwrite', (store) => store.delete(name));
  emit(name);
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

/** Reads an image file, shrinks it to a sane size, and returns a data URL. */
export async function fileToSlotDataUrl(file: File, max = 1280): Promise<string> {
  const raw = await readFile(file);
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
