import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SERVICES,
  DIETS,
  PRESETS,
  defaultPrefs,
  normalizePrefs,
  venueMatches,
  filterByPrefs,
  bookable,
  activePreset,
  applyPreset,
  wishCount,
  reachableProviders,
} from '../js/core/offer.js';
import { formatPriceRange, VENUE_TYPES } from '../js/core/venues.js';

const root = join(import.meta.dirname, '..');
const { venues } = JSON.parse(readFileSync(join(root, 'data', 'venues.json'), 'utf8'));
const { providers } = JSON.parse(readFileSync(join(root, 'data', 'providers.json'), 'utf8'));

const venue = (extra = {}) => ({
  type: 'restaurant',
  price_level: 2,
  accessible: true,
  quiet: false,
  services: ['lunch', 'dinner'],
  diets: ['vegetarian'],
  booking_partners: ['tafelaar', 'direct'],
  ...extra,
});

describe('venue and provider data', () => {
  it('has complete facets for every venue', () => {
    const providerIds = new Set(providers.map((p) => p.id));
    for (const v of venues) {
      expect(v.services.length).toBeGreaterThan(0);
      expect(v.services.every((s) => SERVICES.includes(s))).toBe(true);
      expect(v.diets.every((d) => DIETS.includes(d))).toBe(true);
      expect(v.booking_partners.length).toBeGreaterThan(0);
      expect(v.booking_partners.every((id) => providerIds.has(id))).toBe(true);
      expect(v.price_range[0]).toBeLessThan(v.price_range[1]);
      expect(['pp', 'room']).toContain(v.price_unit);
      // vegetarian flag and diet list agree
      expect(v.diets.includes('vegetarian')).toBe(v.vegetarian);
    }
  });

  it('only hotels offer a stay, and every service has at least one venue', () => {
    expect(venues.filter((v) => v.services.includes('stay')).every((v) => v.type === 'hotel')).toBe(true);
    for (const service of SERVICES) expect(venues.some((v) => v.services.includes(service))).toBe(true);
  });
});

describe('venueMatches', () => {
  it('accepts everything without wishes', () => {
    expect(venueMatches(venue(), defaultPrefs())).toBe(true);
    expect(filterByPrefs(venues, defaultPrefs())).toHaveLength(venues.length);
  });

  it('needs: any of them by default, all of them when asked', () => {
    const lunchOrStay = { ...defaultPrefs(), needs: ['lunch', 'stay'] };
    expect(venueMatches(venue(), lunchOrStay)).toBe(true);
    expect(venueMatches(venue(), { ...lunchOrStay, matchAll: true })).toBe(false);
    expect(venueMatches(venue({ services: ['dinner', 'stay'], type: 'hotel' }), { ...defaultPrefs(), needs: ['dinner', 'stay'], matchAll: true })).toBe(true);
  });

  it('diets must all be possible', () => {
    expect(venueMatches(venue(), { ...defaultPrefs(), diets: ['vegetarian'] })).toBe(true);
    expect(venueMatches(venue(), { ...defaultPrefs(), diets: ['vegetarian', 'halal'] })).toBe(false);
  });

  it('applies accessible, quiet and price limits', () => {
    expect(venueMatches(venue({ accessible: false }), { ...defaultPrefs(), accessible: true })).toBe(false);
    expect(venueMatches(venue(), { ...defaultPrefs(), quiet: true })).toBe(false);
    expect(venueMatches(venue({ price_level: 3 }), { ...defaultPrefs(), maxPriceLevel: 2 })).toBe(false);
    expect(venueMatches(venue({ price_level: 2 }), { ...defaultPrefs(), maxPriceLevel: 2 })).toBe(true);
  });

  it('applies the kinds of businesses', () => {
    const noBars = { ...defaultPrefs(), types: VENUE_TYPES.filter((t) => t !== 'bar') };
    expect(venueMatches(venue({ type: 'bar' }), noBars)).toBe(false);
    expect(venueMatches(venue(), noBars)).toBe(true);
    expect(filterByPrefs(venues, { ...defaultPrefs(), types: [] })).toEqual([]);
  });
});

describe('booking routes', () => {
  it('hides a venue when all its routes are switched off', () => {
    const off = (...ids) => ({ ...defaultPrefs(), providers: Object.fromEntries(ids.map((id) => [id, false])) });
    expect(bookable(venue(), off('tafelaar'))).toBe(true); // still bookable via "direct"
    expect(bookable(venue(), off('tafelaar', 'direct'))).toBe(false);
    expect(venueMatches(venue(), off('tafelaar', 'direct'))).toBe(false);
  });

  it('lists the routes that still lead to a proposal', () => {
    const prefs = { ...defaultPrefs(), needs: ['stay'], providers: { direct: false } };
    expect(reachableProviders(venues, prefs).has('overnachter')).toBe(true); // hotels are booked here
    expect(reachableProviders(venues, prefs).has('direct')).toBe(false); // switched off
    expect(reachableProviders(venues, prefs).has('tafelaar')).toBe(false);
  });
});

describe('presets', () => {
  it('apply and are recognised again', () => {
    for (const id of Object.keys(PRESETS)) expect(activePreset(applyPreset(defaultPrefs(), id))).toBe(id);
    expect(activePreset(defaultPrefs())).toBe(null);
    expect(activePreset({ ...defaultPrefs(), needs: ['lunch'], matchAll: true })).toBe(null);
  });

  it('"eten + overnachten" finds hotels with a restaurant', () => {
    const found = filterByPrefs(venues, applyPreset(defaultPrefs(), 'food_stay'));
    expect(found.length).toBeGreaterThan(5);
    expect(found.every((v) => v.type === 'hotel' && v.services.includes('dinner'))).toBe(true);
  });

  it('can have no results at all', () => {
    const impossible = { ...defaultPrefs(), needs: ['stay'], types: ['cafe'] };
    expect(filterByPrefs(venues, impossible)).toEqual([]);
  });
});

describe('normalizePrefs and wishCount', () => {
  it('survives damaged data', () => {
    expect(normalizePrefs(null)).toEqual(defaultPrefs());
    expect(normalizePrefs('x')).toEqual(defaultPrefs());
    const cleaned = normalizePrefs({ needs: ['lunch', 'nonsense'], diets: 'vegan', maxPriceLevel: 9, types: ['bar', 'ufo'], providers: { direct: false, tafelaar: true } });
    expect(cleaned.needs).toEqual(['lunch']);
    expect(cleaned.diets).toEqual([]);
    expect(cleaned.maxPriceLevel).toBe(4);
    expect(cleaned.types).toEqual(['bar']);
    expect(cleaned.providers).toEqual({ direct: false });
  });

  it('counts the wishes that differ from the default', () => {
    expect(wishCount(defaultPrefs())).toBe(0);
    expect(wishCount({ ...defaultPrefs(), needs: ['stay'], diets: ['vegan'], quiet: true, providers: { direct: false } })).toBe(4);
  });
});

describe('formatPriceRange', () => {
  it('writes per person or per room', () => {
    expect(formatPriceRange({ price_range: [25, 40], price_unit: 'pp' })).toBe('€25–40 p.p.');
    expect(formatPriceRange({ price_range: [95, 140], price_unit: 'room' })).toBe('€95–140 per kamer/nacht');
  });
});
