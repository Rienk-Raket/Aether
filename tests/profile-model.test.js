import { describe, it, expect } from 'vitest';
import { normalizePreferences, availableModes, hasElectricCar, DEFAULT_PROFILE_EXTRAS } from '../js/core/profile-model.js';

describe('normalizePreferences', () => {
  it('fills in everything for an old profile', () => {
    const result = normalizePreferences({ default_transport: 'bike', budget_level: 3 });
    expect(result.default_transport).toBe('bike');
    expect(result.vehicles).toEqual([]);
    expect(result.dining).toEqual(DEFAULT_PROFILE_EXTRAS.dining);
    expect(result.travel.max_minutes).toBe(0);
  });

  it('keeps stored values and drops unknown vehicles', () => {
    const result = normalizePreferences({
      vehicles: [{ id: '1', kind: 'electric' }, { id: '2', kind: 'rocket' }],
      dining: { terrace: 'must' },
    });
    expect(result.vehicles.map((v) => v.kind)).toEqual(['electric']);
    expect(result.dining.terrace).toBe('must');
    expect(result.dining.quiet).toBe('no');
  });

  it('does not change its input', () => {
    const input = { dining: { terrace: 'prefer' } };
    normalizePreferences(input);
    expect(input).toEqual({ dining: { terrace: 'prefer' } });
  });
});

describe('availableModes', () => {
  it('allows everything when nothing is filled in yet', () => {
    expect(availableModes({}).sort()).toEqual(['bike', 'car', 'transit', 'walk']);
  });

  it('allows a car only when the person has one', () => {
    expect(availableModes({ vehicles: [{ id: '1', kind: 'bike' }] }).sort()).toEqual(['bike', 'transit', 'walk']);
    expect(availableModes({ vehicles: [{ id: '1', kind: 'diesel' }] })).toContain('car');
  });

  it('removes the car when "no car" is on, even if a car is listed', () => {
    expect(availableModes({ no_car: true, vehicles: [{ id: '1', kind: 'petrol' }] })).not.toContain('car');
  });
});

describe('hasElectricCar', () => {
  it('detects an electric car', () => {
    expect(hasElectricCar({ vehicles: [{ id: '1', kind: 'electric' }] })).toBe(true);
    expect(hasElectricCar({ vehicles: [{ id: '1', kind: 'hybrid' }] })).toBe(false);
  });
});
