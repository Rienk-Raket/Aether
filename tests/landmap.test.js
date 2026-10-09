import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyFilters, emptyFilters, normalizeFilters, activeCount, CONDITIONS } from '../js/core/map-filters.js';
import { clusterPoints, boundsOf } from '../js/core/map-cluster.js';
import { project, MAP_WIDTH, MAP_HEIGHT, MAINLAND, toPolygon } from '../js/core/nl-outline.js';
import { VENUE_TYPES } from '../js/core/venues.js';

const read = (file) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
const guide = read('gids-venues.json').venues;
const base = read('venues.json').venues;
const places = read('nl-places.json').places;
const now = new Date('2026-10-07T13:00:00'); // a Wednesday afternoon

const venue = (over) => ({ id: 'v', name: 'Test', type: 'cafe', rating: 4.4, hours: Array(7).fill([480, 1200]), cuisine: 'Koffie', ...over });

describe('guide data (data/gids-venues.json)', () => {
  it('has unique ids and the same shape as the other venues', () => {
    expect(new Set(guide.map((v) => v.id)).size).toBe(guide.length);
    expect(guide.length).toBeGreaterThan(600);
    for (const v of guide) {
      expect(VENUE_TYPES).toContain(v.type);
      expect(v.hours).toHaveLength(7);
      expect(v.price_range).toHaveLength(2);
      expect(Number.isFinite(v.lat) && Number.isFinite(v.lng)).toBe(true);
      expect(v.booking_partners.length).toBeGreaterThan(0);
      expect(places.some((p) => p.id === v.area_id)).toBe(true);
    }
    const ids = new Set(base.map((v) => v.id));
    expect(guide.some((v) => ids.has(v.id))).toBe(false);
  });

  it('has all five kinds and the details of the first six cities', () => {
    expect(new Set(guide.map((v) => v.type))).toEqual(new Set(['restaurant', 'cafe', 'meeting_room', 'hotel', 'event']));
    const rijks = guide.find((v) => v.name === 'RIJKS®');
    expect(rijks).toMatchObject({ rating: 4.6, review_count: 1850, type: 'restaurant', area_id: 'amsterdam' });
    expect(rijks.hours[1]).toBeNull(); // closed on Monday (Wednesday to Sunday)
    expect(rijks.hours[3]).toEqual([720, 1350]);
    expect(guide.find((v) => v.name === 'Café de Dokter').hours[0]).toEqual([960, 1500]); // until 01:00
  });
});

describe('map filters', () => {
  const list = [venue({ id: 'a', terrace: true, parking: false }), venue({ id: 'b', terrace: false, parking: true, type: 'hotel', rating: 4.8 }), venue({ id: 'c', terrace: true, parking: true, name: 'Zonnehof', type: 'event', rating: 3.9 })];
  const ids = (filters) => applyFilters(list, { ...emptyFilters(), ...filters }, now).map((v) => v.id);

  it('shows everything without filters', () => expect(ids({})).toEqual(['a', 'b', 'c']));
  it('requires a condition with "yes" and excludes it with "no"', () => {
    expect(ids({ conditions: { terrace: 'yes' } })).toEqual(['a', 'c']);
    expect(ids({ conditions: { terrace: 'no' } })).toEqual(['b']);
    expect(ids({ conditions: { terrace: 'yes', parking: 'yes' } })).toEqual(['c']);
    expect(ids({ conditions: { terrace: 'yes', parking: 'no' } })).toEqual(['a']);
  });
  it('filters on type, rating and search text', () => {
    expect(ids({ types: ['hotel'] })).toEqual(['b']);
    expect(ids({ minRating: 4.3 })).toEqual(['a', 'b']);
    expect(ids({ search: 'zonne' })).toEqual(['c']);
  });
  it('knows who is open right now', () => {
    const closed = venue({ id: 'd', hours: Array(7).fill(null) });
    const open = applyFilters([closed, venue({ id: 'e' })], { ...emptyFilters(), conditions: { open_now: 'yes' } }, now);
    expect(open.map((v) => v.id)).toEqual(['e']);
  });
  it('treats every condition as a yes/no test', () => {
    for (const test of Object.values(CONDITIONS)) expect(typeof test(venue({}), now)).toBe('boolean');
  });
  it('cleans up damaged saved filters and counts what is active', () => {
    const f = normalizeFilters({ types: ['hotel', 'ufo'], minRating: 9, search: 5, conditions: { terrace: 'yes', nonsense: 'yes', parking: 'maybe' } });
    expect(f).toEqual({ types: ['hotel'], minRating: 0, search: '', conditions: { terrace: 'yes' } });
    expect(activeCount(emptyFilters())).toBe(0);
    expect(activeCount(f)).toBe(2);
  });
});

describe('map', () => {
  it('puts known cities in the right order on the map', () => {
    const find = (id) => project(places.find((p) => p.id === id));
    expect(find('groningen').y).toBeLessThan(find('amsterdam').y);
    expect(find('amsterdam').y).toBeLessThan(find('maastricht').y);
    expect(find('amsterdam').x).toBeLessThan(find('enschede').x);
    for (const p of places) {
      const { x, y } = project(p);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(MAP_WIDTH);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(MAP_HEIGHT);
    }
  });
  it('draws a closed outline', () => expect(toPolygon(MAINLAND).split(' ')).toHaveLength(MAINLAND.length));

  it('groups pins that lie close together', () => {
    const points = [{ x: 1, y: 1 }, { x: 3, y: 2 }, { x: 100, y: 100 }];
    const groups = clusterPoints(points, 10);
    expect(groups.map((g) => g.items.length).sort()).toEqual([1, 2]);
    expect(clusterPoints(points, 1)).toHaveLength(3);
    expect(boundsOf(points, 0)).toEqual({ x: 1, y: 1, width: 99, height: 99 });
  });
});
