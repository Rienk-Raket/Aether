// Venues that were created from an uploaded guide (the "Kaart" screen). They live in IndexedDB
// on this device and are merged into the venue list of the (fictional) service Plekwijzer.

import { getDB } from './db.js';
import { cacheClear } from './cache.js';
import { logActivity } from './activity.js';

export async function listImported() {
  return (await getDB()).getAll('imported_venues');
}

// Replaces everything that was imported with the same import_id, then refreshes the caches so
// the new venues show up everywhere (map, Ontdek plekken, Aanbod & wensen).
export async function saveImported(venues, label) {
  const db = await getDB();
  const importId = venues[0]?.import_id;
  const tx = db.transaction('imported_venues', 'readwrite');
  for (const old of await tx.store.getAll()) if (old.import_id === importId) await tx.store.delete(old.id);
  for (const venue of venues) await tx.store.put(venue);
  await tx.done;
  await cacheClear();
  await logActivity('place', `${venues.length} locaties geïmporteerd`, label, '#/kaart');
  document.dispatchEvent(new CustomEvent('aether:venues'));
}

export async function clearImported() {
  const db = await getDB();
  const count = await db.count('imported_venues');
  await db.clear('imported_venues');
  await cacheClear();
  document.dispatchEvent(new CustomEvent('aether:venues'));
  return count;
}

// [{ import_id, count, cities }] — what has been imported so far.
export async function importSummary() {
  const groups = new Map();
  for (const v of await listImported()) {
    const g = groups.get(v.import_id) ?? { import_id: v.import_id, count: 0, areas: new Set() };
    g.count += 1;
    g.areas.add(v.area_id);
    groups.set(v.import_id, g);
  }
  return [...groups.values()].map((g) => ({ import_id: g.import_id, count: g.count, cities: g.areas.size }));
}
