import { describe, it, expect } from 'vitest';
import { groupEmissions, formatChange, GRAMS_PER_KM } from '../js/core/co2.js';
import { timeAgo, todayLabel } from '../js/core/dates.js';

const utrecht = { lat: 52.0907, lng: 5.1214 };
const amsterdam = { lat: 52.373, lng: 4.8924 };

describe('groupEmissions', () => {
  it('is 0% when everybody drives', () => {
    const people = [
      { location: amsterdam, mode: 'car' },
      { location: utrecht, mode: 'car' },
    ];
    const result = groupEmissions(people, { lat: 52.2, lng: 5.0 });
    expect(result.changePct).toBe(0);
    expect(result.actualGrams).toBe(result.carGrams);
  });

  it('is −100% when everybody cycles or walks', () => {
    const people = [
      { location: amsterdam, mode: 'bike' },
      { location: utrecht, mode: 'walk' },
    ];
    expect(groupEmissions(people, utrecht).changePct).toBe(-100);
  });

  it('shows a saving when part of the group uses public transport', () => {
    const place = { lat: 52.2, lng: 5.0 };
    const mixed = groupEmissions(
      [
        { location: amsterdam, mode: 'transit' },
        { location: utrecht, mode: 'car' },
      ],
      place,
    );
    expect(mixed.changePct).toBeLessThan(0);
    expect(mixed.changePct).toBeGreaterThan(-100);
  });

  it('handles everybody already being there', () => {
    expect(groupEmissions([{ location: utrecht, mode: 'car' }], utrecht).changePct).toBe(0);
  });

  it('uses documented factors', () => {
    expect(GRAMS_PER_KM.car).toBe(146);
    expect(GRAMS_PER_KM.transit).toBe(28);
  });
});

describe('formatChange', () => {
  it('formats with a real minus sign', () => {
    expect(formatChange(-18)).toBe('−18%');
    expect(formatChange(0)).toBe('0%');
  });
});

describe('date labels', () => {
  const now = new Date('2026-10-04T12:00:00');
  it('describes how long ago something happened', () => {
    expect(timeAgo('2026-10-04T11:59:50', now)).toBe('zojuist');
    expect(timeAgo('2026-10-04T11:48:00', now)).toBe('12 minuten geleden');
    expect(timeAgo('2026-10-04T09:00:00', now)).toBe('3 uur geleden');
    expect(timeAgo('2026-10-03T12:00:00', now)).toBe('gisteren');
  });

  it('writes today in the top bar style', () => {
    expect(todayLabel(new Date(2026, 9, 4))).toBe('Zondag · 4 oktober 2026');
  });
});
