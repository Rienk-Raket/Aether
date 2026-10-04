// Turns the preferences of the participants and of the organizer into the requirements for ONE
// appointment, following the conflict rule that the organizer chose.
//
// Hard requirements remove venues (an allergy, a diet, accessibility, a wish set to "moet").
// Soft wishes only change the order (kitchen, kind of place, price, a wish set to "liever").
//
// Conflict rules:
//   strictest  every hard requirement of anyone counts; the lowest price limit counts
//   organizer  what the organizer filled in wins; empty fields follow "strictest"
//   majority   a requirement is hard only when more than half of the voters have it, else it is a wish
// Allergies are always hard and always combined, whatever the rule: nobody is outvoted on safety.

import { normalizePreferences } from './profile-model.js';

export const CONFLICT_RULES = ['strictest', 'organizer', 'majority'];
export const WISH_KEYS = ['terrace', 'kid_friendly', 'dog_friendly', 'quiet'];
const LEVEL = { no: 0, prefer: 1, must: 2 };
const LEVEL_NAMES = ['no', 'prefer', 'must'];

export function defaultAppointmentPrefs() {
  return { include_participants: true, conflict_rule: 'strictest', organizer: {}, set_by: null };
}

const list = (value) => (Array.isArray(value) ? value.filter((x) => typeof x === 'string') : []);

// Stored data may be old or damaged: keep only what we understand.
export function normalizeAppointmentPrefs(raw) {
  const base = defaultAppointmentPrefs();
  if (!raw || typeof raw !== 'object') return base;
  const org = raw.organizer ?? {};
  const price = Number(org.max_price);
  return {
    include_participants: raw.include_participants !== false,
    conflict_rule: CONFLICT_RULES.includes(raw.conflict_rule) ? raw.conflict_rule : base.conflict_rule,
    set_by: raw.set_by ?? null,
    organizer: {
      types: list(org.types),
      cuisines: list(org.cuisines),
      diets: list(org.diets),
      allergies: list(org.allergies),
      accessibility: list(org.accessibility),
      max_price: Number.isInteger(price) && price >= 1 && price <= 4 ? price : null,
      wishes: Object.fromEntries(WISH_KEYS.filter((k) => ['prefer', 'must'].includes(org.wishes?.[k])).map((k) => [k, org.wishes[k]])),
      max_minutes: Math.max(0, Number(org.max_minutes) || 0),
      latest_return_hour: Math.max(0, Number(org.latest_return_hour) || 0),
    },
  };
}

// True when the organizer set at least one value.
export function organizerHasValues(organizer) {
  const o = normalizeAppointmentPrefs({ organizer }).organizer;
  return (
    ['types', 'cuisines', 'diets', 'allergies', 'accessibility'].some((k) => o[k].length) ||
    o.max_price !== null ||
    Object.keys(o.wishes).length > 0 ||
    o.max_minutes > 0 ||
    o.latest_return_hour > 0
  );
}

// What one participant wants, in the same shape as the organizer's values.
function viewOf(person) {
  const p = normalizePreferences(person.preferences);
  return {
    id: person.id,
    types: p.preferred_types,
    cuisines: p.dining.cuisines,
    diets: p.dining.diets,
    allergies: p.dining.allergies,
    accessibility: p.accessibility,
    max_price: p.budget_level,
    wishes: Object.fromEntries(WISH_KEYS.map((k) => [k, p.dining[k]])),
  };
}

const unique = (values) => [...new Set(values)];

// Diets and accessibility: { hard, soft, source }
function hardList(field, views, org, rule) {
  const orgValues = org[field];
  if (rule === 'organizer' && orgValues.length) return { hard: orgValues, soft: [], source: 'organizer' };

  const all = unique([...views.flatMap((v) => v[field]), ...orgValues]);
  const source = sourceOf(all, views.flatMap((v) => v[field]), orgValues);
  if (rule !== 'majority') return { hard: all, soft: [], source };

  const voters = views.length + (orgValues.length ? 1 : 0); // every participant, plus the organizer when they filled this in
  const votes = (value) => views.filter((v) => v[field].includes(value)).length + (orgValues.includes(value) ? 1 : 0);
  return {
    hard: all.filter((value) => votes(value) * 2 > voters),
    soft: all.filter((value) => votes(value) * 2 <= voters),
    source,
  };
}

function sourceOf(all, fromParticipants, fromOrganizer) {
  if (all.length === 0) return null;
  if (fromOrganizer.length && fromParticipants.length) return 'both';
  return fromOrganizer.length ? 'organizer' : 'participants';
}

function wishLevel(key, views, org, rule) {
  const own = org.wishes[key];
  const levels = views.map((v) => v.wishes[key]);
  const strictest = LEVEL_NAMES[Math.max(0, ...levels.map((l) => LEVEL[l] ?? 0), LEVEL[own] ?? 0)];

  if (rule === 'organizer' && own) return { level: own, source: 'organizer' };
  const source = own ? (levels.some((l) => l !== 'no') ? 'both' : 'organizer') : strictest !== 'no' ? 'participants' : null;
  if (rule !== 'majority') return { level: strictest, source };

  const votes = [...levels, own ?? 'no'].map((l) => LEVEL[l] ?? 0);
  const counts = [0, 1, 2].map((n) => votes.filter((v) => v === n).length);
  // The level with most votes; on a tie the stricter one.
  const best = counts.reduce((winner, count, n) => (count >= counts[winner] ? n : winner), 0);
  return { level: LEVEL_NAMES[best], source };
}

function priceLimit(views, org, rule) {
  const own = org.max_price;
  const values = views.map((v) => v.max_price);
  if (rule === 'organizer' && own) return own;
  const all = own ? [...values, own] : values;
  if (all.length === 0) return null;
  if (rule === 'majority') return [...all].sort((a, b) => a - b)[Math.floor((all.length - 1) / 2)];
  return Math.min(...all);
}

// Soft weights: how many people want this value (the organizer counts double).
function weights(field, views, org, rule) {
  if (rule === 'organizer' && org[field].length) return Object.fromEntries(org[field].map((v) => [v, 2]));
  const result = {};
  for (const view of views) for (const value of view[field]) result[value] = (result[value] ?? 0) + 1;
  for (const value of org[field]) result[value] = (result[value] ?? 0) + 2;
  return result;
}

// people: [{ id, name, preferences }] — those without preferences (null) have no opinion.
export function resolveRequirements(people, rawPrefs) {
  const prefs = normalizeAppointmentPrefs(rawPrefs);
  const { organizer, conflict_rule: rule } = prefs;
  const views = prefs.include_participants ? people.filter((p) => p.preferences).map(viewOf) : [];

  const diets = hardList('diets', views, organizer, rule);
  const access = hardList('accessibility', views, organizer, rule);
  const allergies = unique([...views.flatMap((v) => v.allergies), ...organizer.allergies]);

  const hardWishes = {};
  const softWishes = {};
  const sources = { diets: diets.source, accessibility: access.source, allergies: sourceOf(allergies, views.flatMap((v) => v.allergies), organizer.allergies) };
  for (const key of WISH_KEYS) {
    const { level, source } = wishLevel(key, views, organizer, rule);
    if (level === 'must') hardWishes[key] = true;
    if (level === 'prefer') softWishes[key] = true;
    sources[key] = source;
  }

  return {
    rule,
    includeParticipants: prefs.include_participants,
    hard: { diets: diets.hard, allergies, accessibility: access.hard, wishes: hardWishes },
    soft: {
      diets: diets.soft,
      cuisines: weights('cuisines', views, organizer, rule),
      types: weights('types', views, organizer, rule),
      wishes: softWishes,
      maxPrice: priceLimit(views, organizer, rule),
    },
    sources,
  };
}

// Do the requirements change anything at all?
export function hasRequirements(req) {
  const { hard, soft } = req;
  return (
    hard.diets.length > 0 ||
    hard.allergies.length > 0 ||
    hard.accessibility.length > 0 ||
    Object.keys(hard.wishes).length > 0 ||
    soft.diets.length > 0 ||
    Object.keys(soft.cuisines).length > 0 ||
    Object.keys(soft.wishes).length > 0
  );
}

// Personal travel limits of one participant. The organizer's values apply to everyone.
// "organizer" rule: the organizer's value replaces the person's; otherwise the stricter one counts.
export function travelLimits(person, rawPrefs) {
  const prefs = normalizeAppointmentPrefs(rawPrefs);
  const { organizer, conflict_rule: rule } = prefs;
  const own = prefs.include_participants && person.preferences ? normalizePreferences(person.preferences).travel : null;

  const pick = (ownValue, orgValue, stricter) => {
    if (!ownValue && !orgValue) return 0;
    if (rule === 'organizer' && orgValue) return orgValue;
    if (!ownValue) return orgValue;
    if (!orgValue) return ownValue;
    return stricter(ownValue, orgValue);
  };
  // Latest return: a lower hour is stricter. Max travel time: a lower number is stricter.
  return {
    maxMinutes: pick(own?.max_minutes, organizer.max_minutes, Math.min),
    latestReturnHour: pick(own?.latest_return_hour, organizer.latest_return_hour, Math.min),
    avoidRush: Boolean(own?.avoid_rush_hour),
    needsParking: Boolean(own?.needs_parking),
    needsCharger: Boolean(own?.needs_charger),
  };
}
