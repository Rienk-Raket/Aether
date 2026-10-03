import { describe, it, expect } from 'vitest';
import { haversineKm, centroid, maxPairwiseDistanceKm } from '../js/core/geo.js';
import { estimateTravelMinutes, TRANSPORT_MODES } from '../js/core/travel-estimate.js';
import { groupWarnings, isBlocking } from '../js/core/group-warnings.js';

const amsterdam = { lat: 52.3791, lng: 4.9003 }; // Amsterdam Centraal
const utrecht = { lat: 52.0894, lng: 5.11 }; // Utrecht Centraal
const london = { lat: 51.5074, lng: -0.1278 };
const paris = { lat: 48.8566, lng: 2.3522 };

describe('haversineKm', () => {
  it('matches known straight-line distances', () => {
    expect(haversineKm(amsterdam, utrecht)).toBeGreaterThan(34);
    expect(haversineKm(amsterdam, utrecht)).toBeLessThan(36);
    expect(haversineKm(london, paris)).toBeCloseTo(343.5, 0);
  });

  it('is zero for the same point and symmetric', () => {
    expect(haversineKm(utrecht, utrecht)).toBe(0);
    expect(haversineKm(amsterdam, utrecht)).toBeCloseTo(haversineKm(utrecht, amsterdam), 10);
  });
});

describe('centroid and spread', () => {
  it('averages the points', () => {
    expect(centroid([{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }])).toEqual({ lat: 1, lng: 2 });
  });

  it('finds the largest distance in the group', () => {
    expect(maxPairwiseDistanceKm([amsterdam, utrecht, paris])).toBeCloseTo(haversineKm(amsterdam, paris), 6);
    expect(maxPairwiseDistanceKm([amsterdam])).toBe(0);
  });
});

describe('estimateTravelMinutes', () => {
  it('ranks modes from slow to fast for Amsterdam → Utrecht', () => {
    const t = (mode) => estimateTravelMinutes(amsterdam, utrecht, mode);
    expect(t('walk')).toBeGreaterThan(t('bike'));
    expect(t('bike')).toBeGreaterThan(t('transit'));
    expect(t('transit')).toBeGreaterThan(t('car'));
  });

  it('gives plausible times for Amsterdam → Utrecht', () => {
    // ~35 km straight line. Door to door: car ~45–55 min incl. parking,
    // train ~50–70 min incl. getting to/from the station, bike ~3 h.
    const t = (mode) => estimateTravelMinutes(amsterdam, utrecht, mode);
    expect(t('car')).toBeGreaterThan(40);
    expect(t('car')).toBeLessThan(55);
    expect(t('transit')).toBeGreaterThan(50);
    expect(t('transit')).toBeLessThan(70);
    expect(t('bike')).toBeGreaterThan(150);
  });

  it('is zero when already there and rejects unknown modes', () => {
    for (const mode of Object.keys(TRANSPORT_MODES)) {
      expect(estimateTravelMinutes(utrecht, utrecht, mode)).toBe(0);
    }
    expect(() => estimateTravelMinutes(amsterdam, utrecht, 'rocket')).toThrow();
  });
});

describe('groupWarnings', () => {
  it('returns nothing for a normal group', () => {
    expect(groupWarnings([
      { name: 'Anna', location: amsterdam },
      { name: 'Bram', location: utrecht },
    ])).toEqual([]);
  });

  it('blocks when someone has no location', () => {
    const warnings = groupWarnings([{ name: 'Anna', location: amsterdam }, { name: 'Cem', location: null }]);
    expect(warnings).toEqual([{ code: 'missing_location', name: 'Cem' }]);
    expect(isBlocking(warnings[0])).toBe(true);
  });

  it('warns when people are more than 500 km apart', () => {
    const warnings = groupWarnings([{ name: 'Anna', location: amsterdam }, { name: 'Dee', location: { lat: 41.39, lng: 2.17 } }]);
    expect(warnings).toEqual([{ code: 'far_apart' }]);
    expect(isBlocking(warnings[0])).toBe(false);
  });

  it('warns for groups larger than 20', () => {
    const members = Array.from({ length: 21 }, (_, i) => ({ name: `P${i}`, location: utrecht }));
    expect(groupWarnings(members)).toEqual([{ code: 'large_group' }]);
  });
});
