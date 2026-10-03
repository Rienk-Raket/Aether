import { describe, it, expect } from 'vitest';
import { travelStats, fairnessScore, cost, rankCandidates, FAIRNESS_WEIGHT } from '../js/core/fairness.js';

// Worked example from docs/PLAN.md section 4 (Anna, Bram, Cem).
const A = { id: 'A', times: [5, 20, 26] };
const B = { id: 'B', times: [25, 27, 29] };

describe('travelStats', () => {
  it('computes mean, population stddev, min and max', () => {
    const stats = travelStats(A.times);
    expect(stats.mean).toBe(17);
    expect(stats.stddev).toBeCloseTo(Math.sqrt(78), 10); // 8.83
    expect(stats.min).toBe(5);
    expect(stats.max).toBe(26);
  });

  it('has zero spread when everyone travels equally long', () => {
    expect(travelStats([12, 12, 12]).stddev).toBe(0);
  });

  it('works for a single person', () => {
    expect(travelStats([30])).toEqual({ mean: 30, stddev: 0, min: 30, max: 30 });
  });

  it('rejects an empty list', () => {
    expect(() => travelStats([])).toThrow();
  });
});

describe('fairnessScore', () => {
  it('matches the worked example', () => {
    expect(fairnessScore(travelStats(A.times))).toBeCloseTo(0.48, 2);
    expect(fairnessScore(travelStats(B.times))).toBeCloseTo(0.94, 2);
  });

  it('is 1 for equal times and when everyone is already there', () => {
    expect(fairnessScore(travelStats([20, 20]))).toBe(1);
    expect(fairnessScore(travelStats([0, 0, 0]))).toBe(1);
  });

  it('never goes below 0, even for extreme spread', () => {
    expect(fairnessScore(travelStats([0, 0, 0, 100]))).toBe(0);
  });
});

describe('cost', () => {
  it('uses the documented weight', () => {
    expect(FAIRNESS_WEIGHT).toBe(2);
  });

  it('matches the worked example table', () => {
    const a = travelStats(A.times);
    const b = travelStats(B.times);
    expect(cost(a, 0)).toBeCloseTo(17.0, 1);
    expect(cost(a, 0.5)).toBeCloseTo(25.8, 1);
    expect(cost(a, 1)).toBeCloseTo(34.7, 1);
    expect(cost(b, 0)).toBeCloseTo(27.0, 1);
    expect(cost(b, 0.5)).toBeCloseTo(28.6, 1);
    expect(cost(b, 1)).toBeCloseTo(30.3, 1);
  });

  it('clamps the slider to 0..1', () => {
    const a = travelStats(A.times);
    expect(cost(a, -1)).toBe(cost(a, 0));
    expect(cost(a, 5)).toBe(cost(a, 1));
  });
});

describe('rankCandidates', () => {
  const winner = (alpha) => rankCandidates([A, B], alpha)[0].id;

  it('picks the efficient place when the slider is at "efficiënt"', () => {
    expect(winner(0)).toBe('A');
    expect(winner(0.5)).toBe('A');
  });

  it('picks the fair place when the slider is at "eerlijk"', () => {
    expect(winner(1)).toBe('B');
  });

  it('switches around α ≈ 0.69', () => {
    expect(winner(0.69)).toBe('A');
    expect(winner(0.7)).toBe('B');
  });

  it('adds stats, fairness and cost without changing the input', () => {
    const [first] = rankCandidates([B], 1);
    expect(first).toMatchObject({ id: 'B', times: B.times });
    expect(first.fairness).toBeCloseTo(0.94, 2);
    expect(B).not.toHaveProperty('cost');
  });

  it('breaks ties by shortest worst-case trip', () => {
    const balanced = { id: 'x', times: [10, 10] };
    const lopsided = { id: 'y', times: [0, 20] };
    // Both have mean 10, so at α = 0 the costs tie.
    expect(rankCandidates([lopsided, balanced], 0)[0].id).toBe('x');
  });
});
