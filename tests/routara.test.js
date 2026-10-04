import { describe, it, expect } from 'vitest';
import { computeMatrix } from '../js/services/mock/routara-mock.js';
import { estimateTravelMinutes } from '../js/core/travel-estimate.js';
import { hashKey } from '../js/core/hash.js';

const amsterdam = { lat: 52.373, lng: 4.8924 };
const utrecht = { lat: 52.0907, lng: 5.1214 };
const gouda = { id: 'gouda', lat: 52.0115, lng: 4.7105 };

const monday = (hour) => new Date(2026, 9, 5, hour, 0);
const saturday = (hour) => new Date(2026, 9, 10, hour, 0);

describe('Routara (simulated routing)', () => {
  const people = [
    { location: amsterdam, mode: 'car' },
    { location: utrecht, mode: 'transit' },
  ];

  it('returns minutes as [place][participant]', () => {
    const matrix = computeMatrix(people, [gouda, utrecht], monday(12));
    expect(matrix).toHaveLength(2);
    expect(matrix[0]).toHaveLength(2);
  });

  it('gives the same answer every time', () => {
    expect(computeMatrix(people, [gouda], monday(8))).toEqual(computeMatrix(people, [gouda], monday(8)));
  });

  it('is slower in rush hour than on a quiet weekend morning (car)', () => {
    const rush = computeMatrix(people, [gouda], monday(8))[0][0];
    const quiet = computeMatrix(people, [gouda], saturday(8))[0][0];
    expect(rush).toBeGreaterThan(quiet * 1.3);
  });

  it('stays within a few percent of the offline estimate when there is no traffic', () => {
    const quiet = computeMatrix(people, [gouda], saturday(11))[0][0];
    const estimate = estimateTravelMinutes(amsterdam, gouda, 'car');
    expect(Math.abs(quiet / estimate - 1)).toBeLessThanOrEqual(0.031);
  });

  it('is 0 when someone is already at the place', () => {
    expect(computeMatrix([{ location: utrecht, mode: 'car' }], [utrecht], monday(12))[0][0]).toBe(0);
  });
});

describe('hashKey', () => {
  it('is stable and different for different text', () => {
    expect(hashKey('abc')).toBe(hashKey('abc'));
    expect(hashKey('abc')).not.toBe(hashKey('abd'));
  });
});
