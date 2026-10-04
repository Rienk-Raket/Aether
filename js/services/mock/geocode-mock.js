// Fictional address search ("Adreszoeker"). Reads data/addresses.json instead of an online API.

import { haversineKm } from '../../core/geo.js';
import { simulateLatency, loadBundledJson } from './network.js';

// Pure search, exported for unit tests: every word of the query must appear in the entry.
export function searchEntries(entries, query, limit = 8) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return entries
    .filter((entry) => {
      const haystack = normalize(`${entry.address} ${entry.city}`);
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => (a.kind === 'city' ? -1 : 0) - (b.kind === 'city' ? -1 : 0))
    .slice(0, limit);
}

export function nearestEntry(entries, point) {
  let best = null;
  let bestKm = Infinity;
  for (const entry of entries) {
    const km = haversineKm(point, entry);
    if (km < bestKm) {
      best = entry;
      bestKm = km;
    }
  }
  return best;
}

// Lowercase and strip accents, so "s-hertogenbosch" also finds "’s-Hertogenbosch".
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '');
}

async function entries() {
  return (await loadBundledJson('data/addresses.json')).entries;
}

export async function search(query) {
  await simulateLatency();
  return searchEntries(await entries(), query);
}

export async function reverse(point) {
  await simulateLatency();
  return nearestEntry(await entries(), point);
}

export async function cities() {
  return (await entries()).filter((entry) => entry.kind === 'city');
}
