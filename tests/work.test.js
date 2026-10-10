import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DECKS, applyWorkAnswers } from '../js/core/profile-deck.js';
import { recommend, evaluate, activeNeeds, mapFiltersFor, estimateCost, expenseRows, expensesToCsv, KIND_TYPES, GROUP_MAX } from '../js/core/work-match.js';
import { applyFilters, normalizeFilters } from '../js/core/map-filters.js';
import { DEFAULT_PREFERENCES } from '../js/data/people.js';

const venues = JSON.parse(readFileSync(new URL('../data/venues.json', import.meta.url), 'utf8')).venues;
const hours = (open, close) => Array(7).fill([open, close]);
const v = (over) => ({ id: 'x', name: 'X', type: 'meeting_room', lat: 52.37, lng: 4.9, rating: 4.4, price_level: 2, capacity: 40, services: ['meeting', 'coffee', 'lunch'], quiet: true, parking: true, hours: hours(480, 1080), ...over });

describe('work deck', () => {
  it('has unique cards with the work wishes', () => {
    const ids = DECKS.work.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['meeting_kind', 'group_size', 'av', 'wifi', 'catering', 'parking', 'office_hours', 'receipt']) expect(ids).toContain(id);
  });

  it('turns the answers into a work profile and keeps the personal settings', () => {
    const { preferences, work } = applyWorkAnswers({ meeting_kind: 'client', group_size: 'medium', budget: '3', transport: 'transit', max_minutes: '45', quiet: 'yes', av: 'yes', wifi: 'no', parking: 'yes', receipt: 'yes' }, DEFAULT_PREFERENCES);
    expect(work).toEqual({ meeting_kind: 'client', group_size: 'medium', budget_level: 3, needs: { av: true, wifi: false, parking: true, receipt: true, quiet: true } });
    expect(preferences.dining.quiet).toBe('must');
    expect(preferences).toMatchObject({ default_transport: 'transit', budget_level: 3 });
    expect(preferences.travel.max_minutes).toBe(45);
    expect(applyWorkAnswers({}, null).work).toEqual({ meeting_kind: null, group_size: null, budget_level: null, needs: {} });
  });
});

describe('work matching', () => {
  const work = { meeting_kind: 'meeting', group_size: 'medium', budget_level: 2, needs: { av: true, parking: true, receipt: true } };

  it('only counts the wishes a venue can meet', () => {
    expect(activeNeeds(work)).toEqual(['av', 'parking']); // receipt does not depend on the venue
    expect(evaluate(v({}), work)).toMatchObject({ met: ['av', 'parking'], missing: [], typeFit: true, fitsGroup: true, inBudget: true });
    expect(evaluate(v({ parking: false, services: ['coffee'] }), work).missing).toEqual(['av', 'parking']);
  });

  it('keeps out venues of the wrong kind, too small or too expensive', () => {
    const picked = recommend([v({ id: 'ok' }), v({ id: 'cafe', type: 'cafe' }), v({ id: 'small', capacity: 4 }), v({ id: 'pricey', price_level: 4 })], work).map((m) => m.venue.id);
    expect(picked).toEqual(['ok']);
    expect(GROUP_MAX.medium).toBe(8);
  });

  it('ranks venues that meet more wishes first, and nearer ones first', () => {
    const list = [v({ id: 'a', parking: false }), v({ id: 'b' }), v({ id: 'far', lat: 51.0, lng: 5.9 })];
    // 'far' meets both wishes and 'a' only one: wishes count for more than distance, distance breaks ties
    expect(recommend(list, work, { from: { lat: 52.37, lng: 4.9 } }).map((m) => m.venue.id)).toEqual(['b', 'far', 'a']);
    expect(recommend(list, work, { limit: 1 })).toHaveLength(1);
  });

  it('finds something in the demo data for every kind of meeting', () => {
    for (const kind of Object.keys(KIND_TYPES)) expect(recommend(venues, { meeting_kind: kind, group_size: null, budget_level: 4, needs: {} }, { limit: 5 }).length, kind).toBeGreaterThan(0);
  });

  it('opens the map with matching filters', () => {
    const f = normalizeFilters(mapFiltersFor(work));
    expect(f.types).toEqual(KIND_TYPES.meeting);
    expect(f.services).toEqual(['meeting']);
    expect(f.conditions).toMatchObject({ business: 'yes', parking: 'yes' });
    expect(applyFilters(venues, f, new Date()).every((x) => KIND_TYPES.meeting.includes(x.type) && x.parking)).toBe(true);
  });
});

describe('costs', () => {
  const appointment = (over) => ({ id: 'a', datetime: '2026-10-07T12:00:00.000Z', participants: [1, 2, 3], status: 'draft', selected_poi: { name: 'Zaal "Noord"', address: 'Straat 1', price_range: [20, 40], price_unit: 'pp' }, ...over });

  it('estimates cost per person, or per room for hotels', () => {
    expect(estimateCost(appointment({}))).toBe(90); // 30 × 3
    expect(estimateCost(appointment({ booking: { persons: 5 } }))).toBe(150);
    expect(estimateCost(appointment({ selected_poi: { name: 'H', price_range: [100, 140], price_unit: 'room' } }))).toBe(240); // 120 × 2 rooms
    expect(estimateCost(appointment({ selected_poi: null }))).toBeNull();
  });

  it('lists appointments with a venue, newest first, and writes safe CSV', () => {
    const rows = expenseRows([appointment({ id: 'old', datetime: '2026-09-01T10:00:00.000Z' }), appointment({}), appointment({ id: 'none', selected_poi: null })]);
    expect(rows.map((r) => r.id)).toEqual(['a', 'old']);
    const csv = expensesToCsv(rows);
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('"Zaal ""Noord"""');
    expect(csv.split('\n')[0]).toContain('datum');
  });
});
