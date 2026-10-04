// Local cache for answers of the (simulated) online services, stored in IndexedDB.
// An entry has an expiry time. An expired entry is not thrown away: when offline we can still
// show it, marked as outdated.

import { getDB, now } from './db.js';

// Returns { data, expired } or null when nothing is stored.
export async function cacheGet(key) {
  const row = await (await getDB()).get('cache', key);
  return row ? { data: row.data, expired: row.expires_at < Date.now() } : null;
}

export async function cacheSet(key, data, ttlMs) {
  await (await getDB()).put('cache', { key, data, expires_at: Date.now() + ttlMs, created_at: now() });
}

// First stored entry whose key starts with `prefix` and whose data satisfies `test`.
export async function cacheFind(prefix, test) {
  const rows = await (await getDB()).getAll('cache');
  const hit = rows.find((row) => row.key.startsWith(prefix) && test(row.data));
  return hit ? { data: hit.data, expired: hit.expires_at < Date.now() } : null;
}

export async function cacheClear() {
  await (await getDB()).clear('cache');
}

