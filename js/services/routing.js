// Travel times. The screens only talk to this file.
// Demo mode: backed by the fictional service Routara. Answers are cached for 30 minutes.
// Offline: the last known answer, or else our own estimate without traffic.

import * as provider from './mock/routara-mock.js';
import { isOffline } from './connectivity.js';
import { cacheGet, cacheSet } from '../data/cache.js';
import { hashKey } from '../core/hash.js';
import { estimateTravelMinutes } from '../core/travel-estimate.js';
import { now } from '../data/db.js';

export const PROVIDER_NAME = 'Routara (demo)';
const TTL_MS = 30 * 60 * 1000;

// source: 'live' (just asked) | 'cache' (asked recently) | 'stale' (old answer, offline)
//       | 'estimate' (our own offline estimate, no traffic)
function result(times, source, fetchedAt = null) {
  return { times, source, fetchedAt };
}

const roundedHalfHour = (when) => `${when.getFullYear()}-${when.getMonth()}-${when.getDate()}-${when.getHours()}-${when.getMinutes() < 30 ? 0 : 1}`;

// participants: [{ location, mode }], places: [{ id, lat, lng }]
// Returns { times: minutes as [place][participant], source, fetchedAt }
export async function travelMatrix({ participants, places, when }) {
  const people = participants.map((p) => `${p.mode}@${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}`).join('|');
  const spots = places.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  const key = `route:${hashKey(`${people}#${spots}#${roundedHalfHour(when)}`)}`;

  const cached = await cacheGet(key);
  if (cached && !cached.expired) return result(cached.data.times, 'cache', cached.data.fetchedAt);

  if (isOffline()) {
    if (cached) return result(cached.data.times, 'stale', cached.data.fetchedAt);
    return result(places.map((place) => participants.map((p) => estimateTravelMinutes(p.location, place, p.mode))), 'estimate');
  }

  const times = await provider.matrix(participants, places, when);
  const fetchedAt = now();
  await cacheSet(key, { times, fetchedAt }, TTL_MS);
  return result(times, 'live', fetchedAt);
}

// Travel times of all participants to one place: { times: [participant], source, fetchedAt }
export async function travelTimesTo(participants, place, when) {
  const { times, source, fetchedAt } = await travelMatrix({ participants, places: [place], when });
  return { times: times[0], source, fetchedAt };
}
