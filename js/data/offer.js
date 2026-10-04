// The user's wishes and the allowed booking routes ("Aanbod & wensen"), stored on this device.
// The pure rules are in core/offer.js.

import { defaultPrefs, normalizePrefs } from '../core/offer.js';
import { loadBundledJson } from '../services/mock/network.js';

const KEY = 'aether.offer';

export function getPrefs() {
  try {
    return normalizePrefs(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaultPrefs();
  }
}

// Saves, then tells every open screen (events: 'aether:offer').
export function savePrefs(prefs) {
  const clean = normalizePrefs(prefs);
  try {
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // storage full or blocked: the wishes are used for now but not remembered
  }
  document.dispatchEvent(new CustomEvent('aether:offer'));
  return clean;
}

export const resetPrefs = () => savePrefs(defaultPrefs());

// The (fictional) booking sites and agencies.
export async function listProviders() {
  return (await loadBundledJson('data/providers.json')).providers;
}

// All venues in the demo data, for counting in the settings screen. No simulated delay.
export async function allVenues() {
  return (await loadBundledJson('data/venues.json')).venues;
}
