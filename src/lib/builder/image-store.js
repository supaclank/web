const DATABASE = 'clank-image-inputs';
const STORE = 'images';
const VERSION = 1;

async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'image_id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Your browser could not open image storage. Keep this tab open and try again.'));
    request.onblocked = () => reject(new Error('Close other Clank tabs to update image storage.'));
  });
}

export async function storeImages(images) {
  if (!images.length) return;
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(new Error('Your images could not be saved. Free browser storage or remove an image.'));
      for (const image of images) transaction.objectStore(STORE).put(image);
    });
  } finally { db.close(); }
}

export async function loadImages(ids) {
  if (!ids.length) return [];
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly');
      const requests = ids.map((id) => transaction.objectStore(STORE).get(id));
      transaction.onabort = () => reject(new Error('Your saved image inputs could not be read.'));
      transaction.oncomplete = () => {
        const images = requests.map((request) => request.result);
        if (images.some((image) => !image)) reject(new Error('An attached image is no longer stored in this browser. Add it again before sending.'));
        else resolve(images);
      };
    });
  } finally { db.close(); }
}
