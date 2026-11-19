/**
 * Browser IndexedDB Map Cache Utility
 * 
 * Provides instant map restore across browser refreshes without waiting for
 * network roundtrips.
 * 
 * Features:
 * - Native IndexedDB API (no external dependencies)
 * - Version-aware snapshot storage
 * - Safety guards for quota / private browsing mode
 * - Clean asynchronous Promise-based API
 */

const DB_NAME = 'pic2speak_map_cache_v1';
const STORE_NAME = 'published_map_store';
const RECORD_KEY = 'current_published_map';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }

    try {
      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.warn('⚠️ IndexedDB open error:', event.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('⚠️ IndexedDB initialization failed:', err);
      resolve(null);
    }
  });
};

/**
 * Save lightweight published map snapshot to IndexedDB
 */
export const saveMapSnapshot = async (mapData) => {
  if (!mapData || typeof window === 'undefined') return false;

  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const version = mapData.publishedAt
          ? new Date(mapData.publishedAt).getTime().toString()
          : 'v1';

        const record = {
          key: RECORD_KEY,
          version,
          data: mapData,
          savedAt: Date.now()
        };

        const putReq = store.put(record);

        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);

        tx.oncomplete = () => db.close();
      } catch (err) {
        console.warn('⚠️ Failed to store map snapshot in IndexedDB:', err);
        resolve(false);
      }
    });
  } catch (err) {
    return false;
  }
};

/**
 * Load map snapshot from IndexedDB
 */
export const loadMapSnapshot = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(RECORD_KEY);

        getReq.onsuccess = (event) => {
          const result = event.target.result;
          resolve(result ? result : null);
        };

        getReq.onerror = () => resolve(null);

        tx.oncomplete = () => db.close();
      } catch (err) {
        console.warn('⚠️ Failed to load map snapshot from IndexedDB:', err);
        resolve(null);
      }
    });
  } catch (err) {
    return null;
  }
};

/**
 * Clear map snapshot
 */
export const clearMapSnapshot = async () => {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(RECORD_KEY);
    tx.oncomplete = () => db.close();
  } catch (err) {}
};
