// Opens the local IndexedDB database. All app data lives here, on this device only.

import { openDB, deleteDB } from '../../vendor/idb.js';

const DB_NAME = 'aether';
const DB_VERSION = 3;

let dbPromise = null;

export function getDB() {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // "people" holds you and your contacts (each with their own locations).
        db.createObjectStore('people', { keyPath: 'id' });
        db.createObjectStore('groups', { keyPath: 'id' });
        const appointments = db.createObjectStore('appointments', { keyPath: 'id' });
        appointments.createIndex('group_id', 'group_id');
        // Cached responses from the (simulated) online services.
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        // Feed of things that happened (shown in "Activiteit").
        db.createObjectStore('activity', { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        // Venues that came from an uploaded guide (see data/imported-venues.js).
        db.createObjectStore('imported_venues', { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
}

// Removes the whole database ("Alle gegevens wissen").
export async function deleteDatabase() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
  await deleteDB(DB_NAME);
}

export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
