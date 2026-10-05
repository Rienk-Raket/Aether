// Fictional starting data for the demo business account. Everything here is made up.

import { TRIAL_DAYS } from '../core/plans.js';
import { addMonths } from '../core/billing.js';
import { seeded } from '../core/stats.js';

const day = (offset, hour, minute = 0, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const REQUESTS = [
  ['Vrijdagborrel', 'Anna', 4, 19, 6, ['vegetarian'], 0.91, 'new'],
  ['Team Marketing', 'Cem', 10, 18, 12, ['group_menu'], 0.78, 'new'],
  ['Boekclub', 'Fenna', 13, 17, 5, ['quiet'], 0.88, 'new'],
  ['Familie De Wit', 'Daan', -2, 18, 8, ['kid_friendly'], 0.83, 'confirmed'],
  ['Wandelclub', 'Ilse', -5, 12, 14, [], 0.66, 'declined'],
  ['Studiegroep', 'Bram', -9, 19, 4, ['vegetarian'], 0.9, 'confirmed'],
];

function requests(now) {
  return REQUESTS.map(([group, by, offset, hour, people, wishes, fairness, status], i) => ({
    id: `req-${i + 1}`, group_name: group, requested_by: by, datetime: day(offset, hour, i % 2 ? 30 : 0, now),
    people, wishes, fairness, status, created_at: day(Math.min(offset - 3, -1), 10, 0, now),
  }));
}

const TEAM = [
  { id: 'u-sanne', name: 'Sanne Bakker', email: 'sanne@keukenkade.example', role: 'owner', last_active: 0 },
  { id: 'u-joost', name: 'Joost Maas', email: 'joost@keukenkade.example', role: 'admin', last_active: -1 },
  { id: 'u-lieke', name: 'Lieke Smit', email: 'lieke@keukenkade.example', role: 'viewer', last_active: -3 },
];

const asTeam = (team, now) => team.map((u) => ({ ...u, last_active: day(u.last_active, 9, 0, now) }));
const billing = (name) => ({ company: `${name} B.V. (fictief)`, kvk: '00000000', vat: 'NL000000000B01', email: `facturen@${name.toLowerCase().replaceAll(/[^a-z]+/g, '')}.example` });

// A ready-made account: Groei, yearly contract, with a few bought extras and a history.
export function buildDemoState(venue, now = new Date()) {
  const started = new Date(now.getFullYear(), 2, 1, 10, 0, 0);
  if (started > now) started.setFullYear(started.getFullYear() - 1);
  return {
    business: { id: `biz-${venue.id}`, name: venue.name, billing: billing(venue.name) },
    venue_id: venue.id,
    users: asTeam(TEAM, now),
    current_user: 'u-sanne',
    subscription: {
      plan: 'growth', status: 'active', billing_period: 'year',
      started_at: started.toISOString(), renews_at: addMonths(started, 12).toISOString(), trial_ends_at: null, cancel_at: null,
      addons: { featured_weeks: 1 }, featured_used: 2, pending_plan: null,
      purchases: [
        { id: 'x-featured', name: 'featured_week', amount: 25, at: day(-112, 11, 0, now) },
        { id: 'x-requests', name: 'requests_pack', amount: 12, at: day(-33, 14, 0, now) },
      ],
    },
    requests: requests(now),
    created_at: started.toISOString(),
  };
}

// A fresh sign-up: the owner only, 30 days of Groei for free, no requests yet.
export function newBusinessState(venue, owner, now = new Date()) {
  const ends = new Date(now);
  ends.setDate(ends.getDate() + TRIAL_DAYS);
  return {
    business: { id: `biz-${venue.id}`, name: venue.name, billing: billing(venue.name) },
    venue_id: venue.id,
    users: [{ id: 'u-owner', name: owner.name, email: owner.email, role: 'owner', last_active: now.toISOString() }],
    current_user: 'u-owner',
    subscription: {
      plan: 'growth', status: 'trial', billing_period: 'month',
      started_at: now.toISOString(), renews_at: ends.toISOString(), trial_ends_at: ends.toISOString(), cancel_at: null,
      addons: {}, featured_used: 0, pending_plan: null, purchases: [],
    },
    requests: [],
    created_at: now.toISOString(),
  };
}

// Used by the fictional "incoming request" feature when a visitor books this venue in the personal app.
export function requestFromBooking(appointment, groupName, rndSeed) {
  const rnd = seeded(rndSeed);
  return {
    id: `req-${rndSeed}`, group_name: groupName, requested_by: 'Jij', datetime: appointment.datetime,
    people: appointment.booking?.persons ?? 4, wishes: [], fairness: appointment.fairness_score ?? +(0.75 + rnd() * 0.2).toFixed(2),
    status: 'new', created_at: new Date().toISOString(),
  };
}
