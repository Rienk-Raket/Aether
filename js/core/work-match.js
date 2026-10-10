// Which venues suit someone who meets for work (a profile of the kind "Zakelijk afspreken")?
// The wishes come from the profile cards (core/profile-deck.js, applyWorkAnswers). Pure code.

import { haversineKm } from './geo.js';
import { openStatus } from './venues.js';

// Venue types that fit each kind of meeting, best fit first.
export const KIND_TYPES = {
  lunch: ['restaurant', 'cafe', 'hotel'],
  meeting: ['meeting_room', 'hotel', 'event'],
  client: ['meeting_room', 'hotel', 'restaurant'],
  workshop: ['meeting_room', 'event', 'hotel'],
  drinks: ['bar', 'cafe', 'restaurant', 'hotel'],
};
export const GROUP_MAX = { small: 4, medium: 8, large: 20, xl: 60 }; // people the venue must hold
export const NEAR_CENTRE_KM = 2;

// The test of every wish: (venue, context) → true when the venue satisfies it.
const TESTS = {
  av: (v) => v.type !== 'cafe' && (v.services ?? []).includes('meeting'),
  wifi: (v) => (v.services ?? []).includes('meeting') || (v.services ?? []).includes('coffee'),
  catering: (v) => (v.services ?? []).some((s) => ['lunch', 'coffee', 'dinner'].includes(s)),
  parking: (v) => Boolean(v.parking),
  quiet: (v) => Boolean(v.quiet),
  near_centre: (v, ctx) => !ctx.centre || haversineKm(v, ctx.centre) <= NEAR_CENTRE_KM,
  office_hours: (v) => [1, 2, 3, 4, 5].every((d) => v.hours?.[d] && v.hours[d][0] <= 540 + 60 && v.hours[d][1] >= 1020) || (v.hours ?? []).every((h) => h && h[0] === 0 && h[1] >= 1440),
};

// Wishes the work profile has switched on (receipt and co2 do not depend on the venue).
export const activeNeeds = (work) => Object.entries(work?.needs ?? {}).filter(([key, on]) => on && key in TESTS).map(([key]) => key);

// Reasons a venue fits, as keys the screen shows as chips; `missing` are wishes it does not meet.
export function evaluate(venue, work, ctx = {}) {
  const met = [];
  const missing = [];
  for (const need of activeNeeds(work)) (TESTS[need](venue, ctx) ? met : missing).push(need);
  const types = KIND_TYPES[work?.meeting_kind] ?? [];
  const typeFit = types.length ? types.includes(venue.type) : true;
  const seats = GROUP_MAX[work?.group_size] ?? 0;
  const fitsGroup = !seats || (venue.capacity ?? 0) >= seats;
  const inBudget = !work?.budget_level || venue.price_level <= work.budget_level + (venue.type === 'hotel' ? 1 : 0);
  return { met, missing, typeFit, fitsGroup, inBudget };
}

// Best venues first: must fit the kind of meeting, the group and the budget; then the wishes
// that are met, the rating and (when known) the distance count.
export function recommend(venues, work, { from = null, centreOf = null, limit = 12, now = new Date() } = {}) {
  const scored = [];
  for (const venue of venues) {
    const ctx = { centre: centreOf?.(venue) ?? null };
    const result = evaluate(venue, work, ctx);
    if (!result.typeFit || !result.fitsGroup || !result.inBudget) continue;
    const km = from ? haversineKm(from, venue) : null;
    const open = openStatus(venue, now).open;
    const score = result.met.length * 2 - result.missing.length * 3 + (venue.rating ?? 0) + (open ? 0.3 : 0) - (km === null ? 0 : Math.min(km / 25, 2));
    scored.push({ venue, ...result, km, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// The map filters (see core/map-filters.js) that match this work profile.
export function mapFiltersFor(work) {
  const types = KIND_TYPES[work?.meeting_kind] ?? ['meeting_room', 'hotel', 'restaurant', 'event'];
  const conditions = { business: 'yes' };
  const needs = work?.needs ?? {};
  if (needs.parking) conditions.parking = 'yes';
  if (needs.quiet) conditions.quiet = 'yes';
  const services = [];
  if (needs.av) services.push('meeting');
  return { types, services, minRating: 0, search: '', conditions };
}

// ---- Costs (declaraties) ----
// Estimated cost of one appointment: the average price of the venue times the number of people.
export function estimateCost(appointment) {
  const poi = appointment.selected_poi;
  if (!poi?.price_range) return null;
  const people = appointment.booking?.persons ?? appointment.participants?.length ?? 1;
  const perPerson = (poi.price_range[0] + poi.price_range[1]) / 2;
  return Math.round(poi.price_unit === 'room' ? perPerson * Math.max(1, Math.ceil(people / 2)) : perPerson * people);
}

// Rows for the expenses screen and the CSV: appointments with a chosen venue, newest first.
export function expenseRows(appointments) {
  return appointments
    .filter((a) => a.selected_poi)
    .map((a) => ({
      id: a.id,
      date: a.datetime,
      place: a.selected_poi.name,
      address: a.selected_poi.address,
      people: a.booking?.persons ?? a.participants?.length ?? 1,
      cost: estimateCost(a),
      status: a.booking?.status ?? (a.status === 'confirmed' ? 'confirmed' : 'draft'),
      reference: a.booking?.reference ?? '',
    }))
    .sort((x, y) => y.date.localeCompare(x.date));
}

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
export function expensesToCsv(rows) {
  const head = ['datum', 'plek', 'adres', 'personen', 'geschat bedrag (EUR, excl. btw)', 'status', 'referentie'];
  return [head, ...rows.map((r) => [r.date.slice(0, 10), r.place, r.address, r.people, r.cost ?? '', r.status, r.reference])].map((line) => line.map(csvCell).join(';')).join('\n');
}
