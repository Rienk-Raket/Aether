// Venues (restaurants, cafés, bars, meeting rooms, hotels). The screens only talk to this file.
// Demo mode: backed by the fictional service Plekwijzer. Answers are cached for 24 hours.
// Offline: only what was looked up before is available.

import * as provider from './mock/plekwijzer-mock.js';
import { isOffline } from './connectivity.js';
import { cacheGet, cacheSet, cacheFind } from '../data/cache.js';
import { venuesNear } from '../core/venues.js';

export const PROVIDER_NAME = 'Plekwijzer (demo)';
const TTL_MS = 24 * 60 * 60 * 1000;

// Thrown when we are offline and nothing was stored earlier.
export class OfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'OfflineError';
  }
}

// Venues within radiusKm of a point, nearest first.
// Returns { venues, source: 'live' | 'cache' | 'stale' }
export async function findVenues({ lat, lng, radiusKm = 10 }) {
  const key = `venues:${lat.toFixed(2)},${lng.toFixed(2)}:${radiusKm}`;
  const cached = await cacheGet(key);
  if (cached && !cached.expired) return { venues: cached.data, source: 'cache' };

  if (isOffline()) {
    if (cached) return { venues: cached.data, source: 'stale' };
    throw new OfflineError();
  }

  const venues = venuesNear(await provider.fetchAllVenues(), { lat, lng }, radiusKm);
  await cacheSet(key, venues, TTL_MS);
  return { venues, source: 'live' };
}

// One venue by id. Returns { venue, source } or { venue: null }.
export async function getVenue(id) {
  const key = `venue:${id}`;
  const cached = await cacheGet(key);
  if (cached && !cached.expired) return { venue: cached.data, source: 'cache' };

  if (isOffline()) {
    if (cached) return { venue: cached.data, source: 'stale' };
    // Seen in a list before? Then we still know it.
    const fromList = await cacheFind('venues:', (list) => list.some((v) => v.id === id));
    if (fromList) return { venue: fromList.data.find((v) => v.id === id), source: 'stale' };
    throw new OfflineError();
  }

  const venue = (await provider.fetchAllVenues()).find((v) => v.id === id) ?? null;
  if (venue) await cacheSet(key, venue, TTL_MS);
  return { venue, source: 'live' };
}
