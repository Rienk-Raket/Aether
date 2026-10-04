import { describe, it, expect } from 'vitest';
import { resolveRequirements, travelLimits, normalizeAppointmentPrefs, hasRequirements, organizerHasValues } from '../js/core/requirements.js';

// Small helper: a person with some dining/travel preferences.
const person = (id, extra = {}) => ({
  id,
  name: id,
  preferences: {
    default_transport: 'transit',
    budget_level: 3,
    preferred_types: [],
    accessibility: extra.accessibility ?? [],
    dining: { cuisines: [], diets: [], allergies: [], terrace: 'no', kid_friendly: 'no', dog_friendly: 'no', quiet: 'no', ...extra.dining },
    travel: extra.travel,
    ...(extra.budget ? { budget_level: extra.budget } : {}),
  },
});

const prefs = (over = {}) => ({ include_participants: true, conflict_rule: 'strictest', organizer: {}, ...over });

describe('normalizeAppointmentPrefs', () => {
  it('gives safe defaults for missing or damaged data', () => {
    expect(normalizeAppointmentPrefs(undefined).conflict_rule).toBe('strictest');
    expect(normalizeAppointmentPrefs({ conflict_rule: 'nonsense' }).conflict_rule).toBe('strictest');
    expect(normalizeAppointmentPrefs({ organizer: { max_price: 9 } }).organizer.max_price).toBeNull();
  });
});

describe('strictest rule', () => {
  const people = [person('a', { dining: { diets: ['vegetarian'], terrace: 'prefer' } }), person('b', { dining: { diets: ['halal'], terrace: 'must' }, budget: 2 })];

  it('combines every hard requirement and takes the strictest wish and lowest price', () => {
    const req = resolveRequirements(people, prefs());
    expect(req.hard.diets.sort()).toEqual(['halal', 'vegetarian']);
    expect(req.hard.wishes.terrace).toBe(true);
    expect(req.soft.maxPrice).toBe(2);
    expect(req.sources.diets).toBe('participants');
  });

  it('ignores people without preferences', () => {
    const req = resolveRequirements([...people, { id: 'c', name: 'c', preferences: null }], prefs());
    expect(req.hard.diets).toHaveLength(2);
  });
});

describe('include_participants off', () => {
  it('uses only what the organizer filled in', () => {
    const people = [person('a', { dining: { diets: ['vegan'], allergies: ['peanut'] } })];
    const req = resolveRequirements(people, prefs({ include_participants: false, organizer: { diets: ['halal'] } }));
    expect(req.hard.diets).toEqual(['halal']);
    expect(req.hard.allergies).toEqual([]);
    expect(req.sources.diets).toBe('organizer');
  });

  it('has no requirements when nothing is set', () => {
    expect(hasRequirements(resolveRequirements([person('a', { dining: { diets: ['vegan'] } })], prefs({ include_participants: false })))).toBe(false);
  });
});

describe('organizer rule', () => {
  const people = [person('a', { dining: { diets: ['vegan'], terrace: 'must' }, budget: 1 })];

  it('lets the organizer override participants where the organizer set a value', () => {
    const req = resolveRequirements(people, prefs({ conflict_rule: 'organizer', organizer: { diets: ['halal'], wishes: { terrace: 'prefer' }, max_price: 4 } }));
    expect(req.hard.diets).toEqual(['halal']);
    expect(req.hard.wishes.terrace).toBeUndefined();
    expect(req.soft.wishes.terrace).toBe(true);
    expect(req.soft.maxPrice).toBe(4);
  });

  it('falls back to the strictest where the organizer left a field empty', () => {
    const req = resolveRequirements(people, prefs({ conflict_rule: 'organizer', organizer: { max_price: 3 } }));
    expect(req.hard.diets).toEqual(['vegan']);
    expect(req.hard.wishes.terrace).toBe(true);
  });

  it('never drops an allergy', () => {
    const withAllergy = [person('a', { dining: { allergies: ['peanut'] } })];
    const req = resolveRequirements(withAllergy, prefs({ conflict_rule: 'organizer', organizer: { allergies: ['egg'] } }));
    expect(req.hard.allergies.sort()).toEqual(['egg', 'peanut']);
  });
});

describe('majority rule', () => {
  const people = [
    person('a', { dining: { diets: ['vegetarian'], terrace: 'must' } }),
    person('b', { dining: { diets: ['vegetarian'] } }),
    person('c', { dining: { diets: ['halal'] } }),
  ];

  it('makes a requirement hard only when more than half have it', () => {
    const req = resolveRequirements(people, prefs({ conflict_rule: 'majority' }));
    expect(req.hard.diets).toEqual(['vegetarian']);
    expect(req.soft.diets).toEqual(['halal']);
  });

  it('turns a lonely "moet" into nothing when the others do not care', () => {
    const req = resolveRequirements(people, prefs({ conflict_rule: 'majority' }));
    expect(req.hard.wishes.terrace).toBeUndefined();
  });

  it('still keeps allergies', () => {
    const req = resolveRequirements([...people, person('d', { dining: { allergies: ['fish'] } })], prefs({ conflict_rule: 'majority' }));
    expect(req.hard.allergies).toEqual(['fish']);
  });
});

describe('organizerHasValues', () => {
  it('tells whether anything was filled in', () => {
    expect(organizerHasValues({})).toBe(false);
    expect(organizerHasValues({ max_minutes: 45 })).toBe(true);
    expect(organizerHasValues({ wishes: { terrace: 'must' } })).toBe(true);
  });
});

describe('travelLimits', () => {
  const traveller = person('a', { travel: { max_minutes: 60, latest_return_hour: 24, needs_parking: true } });

  it('uses the stricter of the person and the organizer', () => {
    const limits = travelLimits(traveller, prefs({ organizer: { max_minutes: 45, latest_return_hour: 25 } }));
    expect(limits.maxMinutes).toBe(45);
    expect(limits.latestReturnHour).toBe(24);
    expect(limits.needsParking).toBe(true);
  });

  it('lets the organizer replace the limit under the organizer rule', () => {
    expect(travelLimits(traveller, prefs({ conflict_rule: 'organizer', organizer: { max_minutes: 90 } })).maxMinutes).toBe(90);
  });

  it('ignores personal limits when participants are not included', () => {
    const limits = travelLimits(traveller, prefs({ include_participants: false, organizer: { max_minutes: 30 } }));
    expect(limits.maxMinutes).toBe(30);
    expect(limits.needsParking).toBe(false);
  });

  it('means no limit when nobody set one', () => {
    expect(travelLimits({ id: 'x', preferences: null }, prefs()).maxMinutes).toBe(0);
  });
});
