import { describe, it, expect } from 'vitest';
import { participantPoints, placeCandidate, layoutOrb, MAX_RADIUS } from '../js/core/orb-layout.js';

const length = (v) => Math.hypot(...v);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('participantPoints', () => {
  it('gives n unit vectors', () => {
    for (const n of [1, 2, 3, 7]) {
      const points = participantPoints(n);
      expect(points).toHaveLength(n);
      for (const p of points) expect(length(p)).toBeCloseTo(1, 6);
    }
  });

  it('spreads people apart', () => {
    const [a, b, c] = participantPoints(3);
    for (const d of [dist(a, b), dist(b, c), dist(a, c)]) expect(d).toBeGreaterThan(1);
  });
});

describe('placeCandidate', () => {
  const points = participantPoints(3);

  it('puts a place with equal travel times near the middle of the orb', () => {
    expect(length(placeCandidate(points, [30, 30, 30], 1 / 30))).toBeLessThan(0.25);
  });

  it('puts a place closer to the person with the shortest trip', () => {
    const spot = placeCandidate(points, [10, 40, 40], 1 / 30);
    expect(dist(spot, points[0])).toBeLessThan(dist(spot, points[1]));
    expect(dist(spot, points[0])).toBeLessThan(dist(spot, points[2]));
  });

  it('makes line lengths follow travel times', () => {
    const spot = placeCandidate(points, [20, 30, 40], 1 / 30);
    const lengths = points.map((p) => dist(spot, p));
    expect(lengths[0]).toBeLessThan(lengths[1]);
    expect(lengths[1]).toBeLessThan(lengths[2]);
  });

  it('never leaves the orb by much', () => {
    expect(length(placeCandidate(points, [500, 500, 500], 1))).toBeLessThanOrEqual(MAX_RADIUS + 1e-9);
  });

  it('is deterministic', () => {
    expect(placeCandidate(points, [20, 30, 40], 0.03)).toEqual(placeCandidate(points, [20, 30, 40], 0.03));
  });
});

describe('layoutOrb', () => {
  it('places every candidate', () => {
    const { positions, points } = layoutOrb(3, [
      { id: 'a', times: [20, 25, 30] },
      { id: 'b', times: [40, 10, 35] },
    ]);
    expect(points).toHaveLength(3);
    expect([...positions.keys()]).toEqual(['a', 'b']);
  });

  it('puts the fairer place nearer the centre', () => {
    const { positions } = layoutOrb(3, [
      { id: 'fair', times: [30, 30, 30] },
      { id: 'unfair', times: [5, 40, 60] },
    ]);
    expect(length(positions.get('fair'))).toBeLessThan(length(positions.get('unfair')));
  });

  it('handles no candidates', () => {
    expect(layoutOrb(2, []).positions.size).toBe(0);
  });
});
