import { describe, it, expect } from 'vitest';
import { scoreSlot, bestSlots, levelOf } from '../js/core/slots.js';

const limits = (over = {}) => ({ maxMinutes: 0, latestReturnHour: 0, avoidRush: false, ...over });
// Two people about 30 km apart (Utrecht and Amersfoort area), both by car.
const traveller = (id, lat, lng, over = {}) => ({ id, name: id, mode: 'car', location: { lat, lng }, limits: limits(), ...over });
const pair = (a = {}, b = {}) => [traveller('Anna', 52.09, 5.12, a), traveller('Bram', 52.16, 5.39, b)];

// 2026-10-09 is a Friday.
const at = (h, m = 0, day = 9) => new Date(2026, 9, day, h, m);

describe('scoreSlot', () => {
  it('rates a quiet Saturday afternoon as good', () => {
    const result = scoreSlot({ start: at(14, 0, 10), durationMinutes: 90, travelers: pair() });
    expect(result.level).toBe('good');
    expect(result.reasons).toEqual([]);
  });

  it('lowers the score in weekday rush hour', () => {
    const quiet = scoreSlot({ start: at(11), durationMinutes: 60, travelers: pair() });
    const rush = scoreSlot({ start: at(17, 15), durationMinutes: 60, travelers: pair() });
    expect(rush.score).toBeLessThan(quiet.score);
    expect(rush.reasons.map((r) => r.code)).toContain('rush');
  });

  it('adds a reason for someone who wants to avoid rush hour', () => {
    const result = scoreSlot({ start: at(17, 15), durationMinutes: 60, travelers: pair({ limits: limits({ avoidRush: true }) }) });
    expect(result.reasons).toContainEqual({ code: 'avoid_rush', name: 'Anna' });
  });

  it('flags a person whose trip is longer than their maximum', () => {
    const result = scoreSlot({ start: at(11), durationMinutes: 60, travelers: pair({ limits: limits({ maxMinutes: 5 }) }) });
    expect(result.reasons).toContainEqual({ code: 'max_time', name: 'Anna' });
    expect(result.level).not.toBe('good');
  });

  it('flags a return home after the latest hour', () => {
    // Ends at 22:00; the trip home pushes someone past 22:30.
    const late = scoreSlot({ start: at(20, 30), durationMinutes: 90, travelers: pair({ limits: limits({ latestReturnHour: 22 }) }) });
    const early = scoreSlot({ start: at(12), durationMinutes: 90, travelers: pair({ limits: limits({ latestReturnHour: 22 }) }) });
    expect(late.reasons).toContainEqual({ code: 'late_return', name: 'Anna' });
    expect(early.reasons).toEqual([]);
  });

  it('never goes below 0', () => {
    const hard = pair({ limits: limits({ maxMinutes: 1, latestReturnHour: 1 }) }, { limits: limits({ maxMinutes: 1, latestReturnHour: 1 }) });
    expect(scoreSlot({ start: at(17, 15), durationMinutes: 60, travelers: hard }).score).toBe(0);
  });
});

describe('levelOf', () => {
  it('maps scores to levels', () => {
    expect(levelOf(0.9)).toBe('good');
    expect(levelOf(0.6)).toBe('ok');
    expect(levelOf(0.2)).toBe('bad');
  });
});

describe('bestSlots', () => {
  const from = new Date(2026, 9, 5, 9, 0); // Monday

  it('returns the requested number of moments, one per day, in the future', () => {
    const slots = bestSlots({ from, durationMinutes: 90, travelers: pair(), count: 3 });
    expect(slots).toHaveLength(3);
    expect(new Set(slots.map((s) => s.start.toDateString())).size).toBe(3);
    expect(slots.every((s) => s.start > from)).toBe(true);
  });

  it('is sorted best first', () => {
    const slots = bestSlots({ from, durationMinutes: 90, travelers: pair(), count: 4 });
    for (let i = 1; i < slots.length; i++) expect(slots[i - 1].score).toBeGreaterThanOrEqual(slots[i].score - 0.02);
  });

  it('avoids moments that break someone\'s latest return hour', () => {
    const travelers = pair({ limits: limits({ latestReturnHour: 21 }) });
    const slots = bestSlots({ from, durationMinutes: 120, travelers, count: 5 });
    expect(slots.every((s) => !s.reasons.some((r) => r.code === 'late_return'))).toBe(true);
  });

  it('returns nothing for an empty group', () => {
    expect(bestSlots({ from, durationMinutes: 60, travelers: [] })).toEqual([]);
  });
});
