import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCandidates, expandedBox, withTravelTimes, MIN_CANDIDATES } from '../js/core/candidates.js';
import { rankCandidates } from '../js/core/fairness.js';
import { personLevel, durationLevel, fairnessLevel } from '../js/core/levels.js';
import { createProjection } from '../js/core/projection.js';

const { places } = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'data', 'nl-places.json'), 'utf8'));
const byName = (name) => places.find((p) => p.name === name);

const amsterdam = byName('Amsterdam');
const rotterdam = byName('Rotterdam');
const utrecht = byName('Utrecht');

describe('nl-places dataset', () => {
  it('has unique ids and coordinates inside the Netherlands', () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const p of places) {
      expect(p.lat).toBeGreaterThan(50.7);
      expect(p.lat).toBeLessThan(53.6);
      expect(p.lng).toBeGreaterThan(3.3);
      expect(p.lng).toBeLessThan(7.3);
    }
  });
});

describe('buildCandidates', () => {
  it('includes the places between the participants', () => {
    const names = buildCandidates([amsterdam, rotterdam, utrecht], places).map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Gouda', 'Woerden', 'Leiden', 'Utrecht']));
    expect(names).not.toContain('Groningen');
  });

  it('adds grid points when there are too few known places (e.g. abroad)', () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const lyon = { lat: 45.764, lng: 4.8357 };
    const candidates = buildCandidates([paris, lyon], places);
    expect(candidates.length).toBeGreaterThanOrEqual(MIN_CANDIDATES);
    expect(candidates.every((c) => c.generated)).toBe(true);
  });

  it('handles everyone at the same spot', () => {
    const box = expandedBox([utrecht, utrecht]);
    expect(box.north - box.south).toBeGreaterThan(0.15); // at least ±10 km
    expect(buildCandidates([utrecht], places).map((c) => c.name)).toContain('Utrecht');
  });

  it('returns nothing without participants', () => {
    expect(buildCandidates([], places)).toEqual([]);
  });
});

describe('ranking real places', () => {
  it('prefers a place in the middle when fairness matters', () => {
    const participants = [
      { id: 'a', location: amsterdam, mode: 'transit' },
      { id: 'r', location: rotterdam, mode: 'transit' },
    ];
    const ranked = rankCandidates(withTravelTimes(buildCandidates([amsterdam, rotterdam], places), participants), 1);
    // The winner must be roughly equally far from both cities.
    const [a, r] = ranked[0].times;
    expect(Math.abs(a - r)).toBeLessThan(15);
    expect(['Amsterdam', 'Rotterdam']).not.toContain(ranked[0].name);
  });
});

describe('levels', () => {
  it('colors a person’s trip relative to the average', () => {
    expect(personLevel(20, 20)).toBe('good');
    expect(personLevel(25, 20)).toBe('medium');
    expect(personLevel(30, 20)).toBe('bad');
    expect(personLevel(0, 0)).toBe('good');
  });

  it('colors durations and fairness', () => {
    expect([durationLevel(25), durationLevel(45), durationLevel(90)]).toEqual(['good', 'medium', 'bad']);
    expect([fairnessLevel(0.9), fairnessLevel(0.7), fairnessLevel(0.3)]).toEqual(['good', 'medium', 'bad']);
  });
});

describe('createProjection', () => {
  it('fits points inside the box with north up', () => {
    const project = createProjection([amsterdam, rotterdam, utrecht], { width: 300, height: 200, padding: 20 });
    for (const p of [amsterdam, rotterdam, utrecht]) {
      const { x, y } = project(p);
      expect(x).toBeGreaterThanOrEqual(19.99);
      expect(x).toBeLessThanOrEqual(280.01);
      expect(y).toBeGreaterThanOrEqual(19.99);
      expect(y).toBeLessThanOrEqual(180.01);
    }
    expect(project(amsterdam).y).toBeLessThan(project(rotterdam).y); // Amsterdam is north of Rotterdam
    expect(project(utrecht).x).toBeGreaterThan(project(rotterdam).x); // Utrecht is east of Rotterdam
  });

  it('copes with a single point', () => {
    const { x, y } = createProjection([utrecht], { width: 100, height: 100 })(utrecht);
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
  });
});
