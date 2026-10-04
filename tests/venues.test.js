import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rushLevel, trafficFactor, trafficLabel } from '../js/core/traffic.js';
import { openStatus, formatHours, is24h, crowdLevel, filterVenues, sortVenues, venuesNear, VENUE_TYPES } from '../js/core/venues.js';

const root = join(import.meta.dirname, '..');
const { venues } = JSON.parse(readFileSync(join(root, 'data', 'venues.json'), 'utf8'));
const { places } = JSON.parse(readFileSync(join(root, 'data', 'nl-places.json'), 'utf8'));

// Local-time helper: 5 October 2026 is a Monday, 9 October a Friday, 10 October a Saturday.
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute);

describe('traffic', () => {
  it('has rush hours on weekdays only', () => {
    expect(rushLevel(at(5, 8))).toBe(1);
    expect(rushLevel(at(5, 17, 15))).toBe(1);
    expect(rushLevel(at(5, 12))).toBe(0);
    expect(rushLevel(at(10, 8))).toBe(0); // Saturday
  });

  it('slows down cars most, public transport less, bikes not at all', () => {
    const peak = at(5, 8);
    expect(trafficFactor('car', peak)).toBeCloseTo(1.4, 5);
    expect(trafficFactor('transit', peak)).toBeCloseTo(1.2, 5);
    expect(trafficFactor('bike', peak)).toBe(1);
    expect(trafficFactor('walk', peak)).toBe(1);
  });

  it('has fewer public transport connections late at night', () => {
    expect(trafficFactor('transit', at(9, 23, 30))).toBeCloseTo(1.25, 5);
    expect(trafficFactor('car', at(9, 23, 30))).toBeLessThan(1);
  });

  it('labels the situation', () => {
    expect([trafficLabel(at(5, 8)), trafficLabel(at(5, 7, 30)), trafficLabel(at(5, 13))]).toEqual(['spits', 'druk', 'rustig']);
  });
});

describe('venue data', () => {
  it('is complete and consistent', () => {
    expect(new Set(venues.map((v) => v.id)).size).toBe(venues.length);
    const placeIds = new Set(places.map((p) => p.id));
    for (const v of venues) {
      expect(placeIds.has(v.area_id)).toBe(true);
      expect(VENUE_TYPES).toContain(v.type);
      expect(v.hours).toHaveLength(7);
      expect(v.rating).toBeGreaterThanOrEqual(3.8);
      expect(v.rating).toBeLessThanOrEqual(4.9);
      expect(v.price_level).toBeGreaterThanOrEqual(1);
      expect(v.price_level).toBeLessThanOrEqual(4);
    }
  });
});

describe('venue names', () => {
  it('are all real names (no numbered fallbacks) and unique', () => {
    expect(new Set(venues.map((v) => v.name)).size).toBe(venues.length);
    expect(venues.filter((v) => /\d$/.test(v.name))).toEqual([]);
  });
});

describe('openStatus', () => {
  const restaurant = { hours: [[1020, 1380], null, [1020, 1380], [1020, 1380], [1020, 1380], [1020, 1380], [1020, 1380]] };
  const bar = { hours: [[960, 1500], null, null, [960, 1500], [960, 1500], [960, 1500], [960, 1500]] };

  it('knows when a place is open or closed', () => {
    expect(openStatus(restaurant, at(9, 18)).open).toBe(true); // Friday 18:00
    expect(openStatus(restaurant, at(9, 16)).open).toBe(false);
    expect(openStatus(restaurant, at(5, 18)).open).toBe(false); // Monday: closed
  });

  it('handles opening hours that run past midnight', () => {
    expect(openStatus(bar, at(10, 0, 30)).open).toBe(true); // Saturday 00:30, still Friday's hours
    expect(openStatus(bar, at(10, 1, 30)).open).toBe(false);
    expect(openStatus(bar, at(9, 23, 59)).open).toBe(true);
  });

  it('formats hours', () => {
    expect(formatHours([1020, 1380])).toBe('17:00–23:00');
    expect(formatHours([960, 1500])).toBe('16:00–01:00');
    expect(formatHours(null)).toBe('Gesloten');
    expect(formatHours([0, 1440])).toBe('24 uur open');
    expect(is24h({ hours: Array(7).fill([0, 1440]) })).toBe(true);
  });
});

describe('crowdLevel', () => {
  const popular = { popularity: 1, type: 'restaurant' };
  const quiet = { popularity: 0.1, type: 'cafe' };

  it('is busier on Friday evening than on Monday afternoon', () => {
    expect(crowdLevel(popular, at(9, 19))).toBe('high');
    expect(crowdLevel(popular, at(5, 15))).toBe('medium');
    expect(crowdLevel(quiet, at(5, 15))).toBe('low');
  });

  it('has empty meeting rooms in the weekend', () => {
    expect(crowdLevel({ popularity: 1, type: 'meeting_room' }, at(10, 19))).toBe('low');
  });
});

describe('filtering and sorting', () => {
  const sample = [
    { id: 'a', type: 'cafe', accessible: true, quiet: false, vegetarian: true, rating: 4.1, name: 'A', hours: Array(7).fill(null) },
    { id: 'b', type: 'bar', accessible: true, quiet: true, vegetarian: false, rating: 4.8, name: 'B', hours: Array(7).fill([0, 1440]) },
    { id: 'c', type: 'bar', accessible: false, quiet: true, vegetarian: true, rating: 4.5, name: 'C', hours: Array(7).fill([0, 1440]) },
  ];

  it('combines type and "must have" filters', () => {
    expect(filterVenues(sample, { types: ['bar'] }).map((v) => v.id)).toEqual(['b', 'c']);
    expect(filterVenues(sample, { types: ['bar'], accessible: true }).map((v) => v.id)).toEqual(['b']);
    expect(filterVenues(sample, { quiet: true, vegetarian: true }).map((v) => v.id)).toEqual(['c']);
    expect(filterVenues(sample, {})).toHaveLength(3);
  });

  it('puts open places first, then the best rated', () => {
    expect(sortVenues(sample, at(9, 12)).map((v) => v.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('venuesNear', () => {
  it('finds venues around a town, nearest first', () => {
    const utrecht = places.find((p) => p.id === 'utrecht');
    const near = venuesNear(venues, utrecht, 10);
    expect(near.length).toBeGreaterThanOrEqual(3);
    expect(near[0].distance_km).toBeLessThanOrEqual(near.at(-1).distance_km);
    expect(near.every((v) => v.distance_km <= 10)).toBe(true);
  });

  it('returns nothing in the middle of the sea', () => {
    expect(venuesNear(venues, { lat: 53.5, lng: 4.0 }, 5)).toEqual([]);
  });
});

import { openLabel } from '../js/core/venues.js';

describe('openLabel', () => {
  const restaurant = { hours: [[1020, 1380], null, [1020, 1380], [1020, 1380], [1020, 1380], [1020, 1380], [1020, 1380]] };
  const bar = { hours: [[960, 1500], null, null, [960, 1500], [960, 1500], [960, 1500], [960, 1500]] };

  it('says until when a place is open', () => {
    expect(openLabel(restaurant, at(9, 18))).toEqual({ open: true, text: 'Open tot 23:00' });
    expect(openLabel(bar, at(10, 0, 30))).toEqual({ open: true, text: 'Open tot 01:00' });
  });

  it('says when a closed place opens, or that it is closed', () => {
    expect(openLabel(restaurant, at(9, 15))).toEqual({ open: false, text: 'Gesloten · opent 17:00' });
    expect(openLabel(restaurant, at(5, 18))).toEqual({ open: false, text: 'Gesloten op dit tijdstip' });
    expect(openLabel(restaurant, at(9, 23, 30))).toEqual({ open: false, text: 'Gesloten op dit tijdstip' });
  });

  it('knows 24-hour places', () => {
    expect(openLabel({ hours: Array(7).fill([0, 1440]) }, at(9, 3)).text).toBe('24 uur open');
  });
});
