import { describe, it, expect } from 'vitest';
import { failedRequirements, applyVenuePrefs, venueTravelNotes, applyTravelPreferences, usableMode } from '../js/core/pref-match.js';
import { rankCandidates } from '../js/core/fairness.js';

const emptyReq = () => ({
  hard: { diets: [], allergies: [], accessibility: [], wishes: {} },
  soft: { diets: [], cuisines: {}, types: {}, wishes: {}, maxPrice: null },
});

const venue = (over = {}) => ({
  id: 'v',
  type: 'restaurant',
  cuisine: 'Italiaans',
  price_level: 2,
  diets: ['vegetarian'],
  allergen_safe: ['peanut'],
  accessible: true,
  accessible_toilet: false,
  terrace: true,
  ...over,
});

describe('failedRequirements', () => {
  it('passes a venue when nothing is required', () => {
    expect(failedRequirements(venue(), emptyReq())).toEqual([]);
  });

  it('reports every hard requirement that is not met', () => {
    const req = emptyReq();
    req.hard.diets = ['vegan'];
    req.hard.allergies = ['peanut', 'fish'];
    req.hard.accessibility = ['accessible_toilet'];
    req.hard.wishes = { kid_friendly: true, terrace: true };
    expect(failedRequirements(venue(), req).sort()).toEqual(['access:accessible_toilet', 'allergy:fish', 'diet:vegan', 'wish:kid_friendly']);
  });
});

describe('applyVenuePrefs', () => {
  it('removes venues that fail and orders the rest by score', () => {
    const req = emptyReq();
    req.hard.diets = ['vegetarian'];
    req.soft.cuisines = { Aziatisch: 2 };
    req.soft.maxPrice = 2;
    const venues = [
      venue({ id: 'plain' }),
      venue({ id: 'asian', cuisine: 'Aziatisch' }),
      venue({ id: 'meat', diets: [] }),
      venue({ id: 'pricey', price_level: 4 }),
    ];
    const result = applyVenuePrefs(venues, req);
    expect(result.map((v) => v.id)).toEqual(['asian', 'plain', 'pricey']);
    expect(result.at(-1).pref_missed).toContain('price');
  });

  it('keeps the incoming order for equal scores', () => {
    const venues = [venue({ id: 'b' }), venue({ id: 'a' })];
    expect(applyVenuePrefs(venues, emptyReq()).map((v) => v.id)).toEqual(['b', 'a']);
  });

  it('notes missed wishes without removing the venue', () => {
    const req = emptyReq();
    req.soft.wishes = { quiet: true };
    const [result] = applyVenuePrefs([venue()], req);
    expect(result.pref_missed).toEqual(['wish:quiet']);
  });
});

describe('venueTravelNotes', () => {
  const people = [
    { id: 'a', name: 'Anna', mode: 'car', electric: true, limits: { needsParking: true, needsCharger: true } },
    { id: 'b', name: 'Bram', mode: 'transit', electric: false, limits: { needsParking: true, needsCharger: false } },
  ];

  it('adds time only for people who come by car and miss parking or a charger', () => {
    const notes = venueTravelNotes(venue({ parking: false, charger: false }), people);
    expect(notes.map((n) => `${n.name}:${n.kind}`)).toEqual(['Anna:parking', 'Anna:charger']);
  });

  it('adds nothing when the venue has what they need', () => {
    expect(venueTravelNotes(venue({ parking: true, charger: true }), people)).toEqual([]);
  });
});

describe('applyTravelPreferences', () => {
  const when = new Date(2026, 9, 9, 18, 0); // a Friday evening
  const limits = (over = {}) => ({ maxMinutes: 0, latestReturnHour: 0, avoidRush: false, ...over });
  const candidates = [
    { id: 'near-anna', times: [10, 70] },
    { id: 'near-bram', times: [60, 20] },
  ];

  it('flags people who travel longer than their maximum, and keeps the real times', () => {
    const people = [
      { id: 'a', name: 'Anna', mode: 'car', limits: limits() },
      { id: 'b', name: 'Bram', mode: 'car', limits: limits({ maxMinutes: 45 }) },
    ];
    const result = applyTravelPreferences(candidates, people, when, 120);
    expect(result[0].times).toEqual([10, 70]);
    expect(result[0].violations).toEqual([{ kind: 'max_time', personId: 'b', name: 'Bram', minutes: 70, limit: 45 }]);
    expect(result[0].costTimes[1]).toBe(70 + (70 - 45) * 2);
    expect(result[1].violations).toEqual([]);
  });

  it('flags a return home that is too late', () => {
    const people = [
      { id: 'a', name: 'Anna', mode: 'transit', limits: limits({ latestReturnHour: 22 }) },
      { id: 'b', name: 'Bram', mode: 'transit', limits: limits() },
    ];
    // Ends at 21:00. Home at 21:10 after 10 minutes → fine; home at 22:10 after 70 minutes → too late.
    const [near, far] = [applyTravelPreferences(candidates, people, when, 180)[0], applyTravelPreferences([{ id: 'x', times: [70, 5] }], people, when, 180)[0]];
    expect(near.violations).toEqual([]);
    expect(far.violations).toEqual([{ kind: 'late_return', personId: 'a', name: 'Anna', limit: 22 }]);
  });

  it('makes a candidate that breaks a limit rank lower', () => {
    const people = [
      { id: 'a', name: 'Anna', mode: 'car', limits: limits() },
      { id: 'b', name: 'Bram', mode: 'car', limits: limits({ maxMinutes: 30 }) },
    ];
    const close = [
      { id: 'near-anna', times: [10, 50] }, // mean 30, but Bram would travel 50 minutes
      { id: 'near-bram', times: [45, 20] }, // mean 32.5
    ];
    const plain = rankCandidates(close, 0).map((c) => c.id);
    const withLimits = rankCandidates(applyTravelPreferences(close, people, when, 60), 0).map((c) => c.id);
    expect(plain[0]).toBe('near-anna');
    expect(withLimits[0]).toBe('near-bram');
  });

  it('weighs rush hour more for someone who wants to avoid it', () => {
    const people = [
      { id: 'a', name: 'Anna', mode: 'car', limits: limits({ avoidRush: true }) },
      { id: 'b', name: 'Bram', mode: 'car', limits: limits() },
    ];
    const [first] = applyTravelPreferences([{ id: 'x', times: [40, 40] }], people, new Date(2026, 9, 9, 17, 15), 60);
    expect(first.costTimes[0]).toBeGreaterThan(40);
    expect(first.costTimes[1]).toBe(40);
  });
});

describe('usableMode', () => {
  it('keeps the chosen mode when it is available', () => {
    expect(usableMode('car', ['car', 'walk'], 'walk')).toBe('car');
  });
  it('falls back to the preferred mode, then transit', () => {
    expect(usableMode('car', ['bike', 'transit', 'walk'], 'bike')).toBe('bike');
    expect(usableMode('car', ['bike', 'transit', 'walk'], 'car')).toBe('transit');
  });
});
