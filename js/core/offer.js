// "Aanbod & wensen": which venues may Aether propose? The user sets wishes (what they are looking
// for, diets, price, kinds of businesses) and chooses which (fictional) booking sites and agencies
// are allowed. A venue is only proposed when it passes all of that.

import { VENUE_TYPES } from './venues.js';

export const SERVICES = ['breakfast', 'lunch', 'dinner', 'coffee', 'drinks', 'stay', 'meeting', 'event'];
export const DIETS = ['vegetarian', 'vegan', 'gluten_free', 'halal', 'lactose_free'];

// Ready-made combinations. matchAll: the same venue must offer every service.
export const PRESETS = {
  food_only: { needs: ['lunch', 'dinner'], matchAll: false },
  food_stay: { needs: ['dinner', 'stay'], matchAll: true },
  breakfast: { needs: ['breakfast'], matchAll: false },
  lunch: { needs: ['lunch'], matchAll: false },
  coffee: { needs: ['coffee'], matchAll: false },
  meeting: { needs: ['meeting', 'coffee'], matchAll: true },
  event: { needs: ['event'], matchAll: false },
};

export function defaultPrefs() {
  return {
    needs: [], // empty = no wish: propose everything
    matchAll: false,
    diets: [], // every chosen diet must be possible
    accessible: false,
    quiet: false,
    maxPriceLevel: 4, // 1 (€) … 4 (€€€€)
    types: [...VENUE_TYPES], // kinds of businesses that may be proposed
    typesVersion: 2, // 1 (or missing) = saved before the type 'event' existed
    providers: {}, // { providerId: false } for switched-off ones; missing = on
  };
}

// Before venue type 'event' existed, "all types" meant these five: such saved wishes now include events.
const LEGACY_ALL_TYPES = ['restaurant', 'cafe', 'bar', 'meeting_room', 'hotel'];

const onlyKnown = (list, known) => (Array.isArray(list) ? known.filter((item) => list.includes(item)) : []);

// Stored data may be old or damaged: keep only what we understand.
export function normalizePrefs(raw) {
  const base = defaultPrefs();
  if (!raw || typeof raw !== 'object') return base;
  const level = Number(raw.maxPriceLevel);
  return {
    needs: onlyKnown(raw.needs, SERVICES),
    matchAll: raw.matchAll === true,
    diets: onlyKnown(raw.diets, DIETS),
    accessible: raw.accessible === true,
    quiet: raw.quiet === true,
    maxPriceLevel: Number.isInteger(level) && level >= 1 && level <= 4 ? level : base.maxPriceLevel,
    types: Array.isArray(raw.types) ? onlyKnown(raw.types, VENUE_TYPES).concat(migratedTypes(raw)) : base.types,
    typesVersion: 2,
    providers: Object.fromEntries(Object.entries(raw.providers ?? {}).filter(([, on]) => on === false)),
  };
}

function migratedTypes(raw) {
  const legacyAll = raw.typesVersion !== 2 && LEGACY_ALL_TYPES.every((type) => raw.types.includes(type));
  return legacyAll && !raw.types.includes('event') ? ['event'] : [];
}

export const providerOn = (prefs, id) => prefs.providers[id] !== false;

// Can this venue be booked through at least one allowed booking route?
export function bookable(venue, prefs) {
  return venue.booking_partners.some((id) => providerOn(prefs, id));
}

export function venueMatches(venue, prefs) {
  if (!prefs.types.includes(venue.type)) return false;
  if (venue.price_level > prefs.maxPriceLevel) return false;
  if (prefs.accessible && !venue.accessible) return false;
  if (prefs.quiet && !venue.quiet) return false;
  if (!prefs.diets.every((diet) => venue.diets.includes(diet))) return false;
  if (prefs.needs.length) {
    const test = (need) => venue.services.includes(need);
    if (!(prefs.matchAll ? prefs.needs.every(test) : prefs.needs.some(test))) return false;
  }
  return bookable(venue, prefs);
}

export const filterByPrefs = (venues, prefs) => venues.filter((v) => venueMatches(v, prefs));

// Which preset is currently selected, or null.
export function activePreset(prefs) {
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  return Object.entries(PRESETS).find(([, p]) => p.matchAll === prefs.matchAll && same(p.needs, prefs.needs))?.[0] ?? null;
}

export function applyPreset(prefs, presetId) {
  const preset = PRESETS[presetId];
  return preset ? { ...prefs, needs: [...preset.needs], matchAll: preset.matchAll } : prefs;
}

// How many wishes differ from "no wishes" (shown as a number in the interface).
export function wishCount(prefs) {
  const base = defaultPrefs();
  return [
    prefs.needs.length > 0,
    prefs.diets.length > 0,
    prefs.accessible,
    prefs.quiet,
    prefs.maxPriceLevel < base.maxPriceLevel,
    prefs.types.length < base.types.length,
    Object.keys(prefs.providers).length > 0,
  ].filter(Boolean).length;
}

// Booking routes that are switched on and used by at least one venue that passes the wishes.
export function reachableProviders(venues, prefs) {
  const ids = new Set();
  for (const venue of filterByPrefs(venues, prefs)) for (const id of venue.booking_partners) if (providerOn(prefs, id)) ids.add(id);
  return ids;
}
