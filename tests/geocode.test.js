import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchEntries, nearestEntry } from '../js/services/mock/geocode-mock.js';

const { entries } = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'data', 'addresses.json'), 'utf8'));

describe('fictional address book', () => {
  it('has unique ids and coordinates inside the Netherlands', () => {
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    for (const e of entries) {
      expect(e.lat).toBeGreaterThan(50.7);
      expect(e.lat).toBeLessThan(53.6);
      expect(e.lng).toBeGreaterThan(3.3);
      expect(e.lng).toBeLessThan(7.3);
    }
  });
});

describe('searchEntries', () => {
  it('finds by city, city first', () => {
    const results = searchEntries(entries, 'utrecht');
    expect(results[0].id).toBe('utrecht-centrum');
    expect(results.every((r) => r.city === 'Utrecht')).toBe(true);
  });

  it('requires every word to match, case-insensitive', () => {
    const results = searchEntries(entries, 'LINDELAAN amsterdam');
    expect(results.map((r) => r.id)).toEqual(['amsterdam-1']);
  });

  it('ignores accents and apostrophes', () => {
    expect(searchEntries(entries, 's-hertogenbosch')[0].city).toBe('’s-Hertogenbosch');
  });

  it('returns nothing for an empty or unknown query', () => {
    expect(searchEntries(entries, '   ')).toEqual([]);
    expect(searchEntries(entries, 'xyzzy')).toEqual([]);
  });
});

describe('nearestEntry', () => {
  it('finds the closest known place', () => {
    const nearDom = { lat: 52.0908, lng: 5.1215 };
    expect(nearestEntry(entries, nearDom).id).toBe('utrecht-centrum');
  });
});
