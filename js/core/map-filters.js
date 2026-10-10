// Filters of the map of the Netherlands. Every condition can be required ("wel"), excluded
// ("niet") or ignored. Types, a minimum rating and a search text work on top of that.

import { openStatus, is24h, VENUE_TYPES } from './venues.js';

const BUSINESS_TYPES = ['restaurant', 'meeting_room', 'hotel', 'event'];
const PRIVATE_TYPES = ['restaurant', 'cafe', 'bar', 'hotel', 'event'];

// Suitable for business / private use: when the guide describes it, or when the type fits.
export const forBusiness = (v) => Boolean(v.use_business) || BUSINESS_TYPES.includes(v.type);
export const forPrivate = (v) => Boolean(v.use_private) || PRIVATE_TYPES.includes(v.type);

// key → test(venue, now). The order is the order on screen.
export const CONDITIONS = {
  terrace: (v) => Boolean(v.terrace),
  parking: (v) => Boolean(v.parking),
  accessible: (v) => Boolean(v.accessible),
  quiet: (v) => Boolean(v.quiet),
  vegetarian: (v) => Boolean(v.vegetarian),
  kid_friendly: (v) => Boolean(v.kid_friendly),
  dog_friendly: (v) => Boolean(v.dog_friendly),
  charger: (v) => Boolean(v.charger),
  business: forBusiness,
  private: forPrivate,
  open_now: (v, now) => is24h(v) || openStatus(v, now).open,
  open_24h: (v) => is24h(v),
};

export const SERVICES = ['breakfast', 'lunch', 'dinner', 'coffee', 'drinks', 'stay', 'meeting', 'event'];

export const emptyFilters = () => ({ types: [...VENUE_TYPES], services: [], minRating: 0, search: '', conditions: {} });

// What the search box looks in: name, city, kind, address and the guide's highlights.
export const searchText = (v, city = '') => `${v.name} ${city} ${v.cuisine ?? ''} ${v.address ?? ''} ${(v.highlights ?? []).join(' ')}`.toLowerCase();

// conditions: { terrace: 'yes' | 'no' } — missing = do not care
export function normalizeFilters(raw) {
  const base = emptyFilters();
  if (!raw || typeof raw !== 'object') return base;
  const rating = Number(raw.minRating);
  return {
    types: Array.isArray(raw.types) ? VENUE_TYPES.filter((t) => raw.types.includes(t)) : base.types,
    services: Array.isArray(raw.services) ? SERVICES.filter((s) => raw.services.includes(s)) : [],
    minRating: Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : 0,
    search: typeof raw.search === 'string' ? raw.search.slice(0, 60) : '',
    conditions: Object.fromEntries(Object.entries(raw.conditions ?? {}).filter(([key, value]) => key in CONDITIONS && (value === 'yes' || value === 'no'))),
  };
}

export function applyFilters(venues, filters, now = new Date(), cityName = () => '') {
  const search = filters.search.trim().toLowerCase();
  const rules = Object.entries(filters.conditions);
  return venues.filter((v) => {
    if (!filters.types.includes(v.type)) return false;
    if (filters.minRating && (v.rating ?? 0) < filters.minRating) return false;
    if (filters.services.length && !filters.services.some((s) => v.services?.includes(s))) return false;
    if (search && !searchText(v, cityName(v)).includes(search)) return false;
    return rules.every(([key, want]) => CONDITIONS[key](v, now) === (want === 'yes'));
  });
}

// How many conditions are set (for the "x filters actief" label).
export const activeCount = (filters) =>
  Object.keys(filters.conditions).length + (filters.services.length ? 1 : 0) + (filters.types.length < VENUE_TYPES.length ? 1 : 0) + (filters.minRating ? 1 : 0) + (filters.search.trim() ? 1 : 0);
