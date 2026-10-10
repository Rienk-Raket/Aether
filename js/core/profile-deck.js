// The cards a new profile is built from. Each card is a statement (swipe right = yes, left = no)
// or a choice (tap one option). The answers are turned into profile settings here: pure code, no
// browser needed. The texts of the cards are in js/i18n/nl-deck.js.

import { normalizePreferences } from './profile-model.js';

export const PROFILE_KINDS = ['personal', 'business'];

// type 'statement': answer 'yes' | 'no'. type 'choice': answer is one of the option values.
export const DECKS = {
  personal: [
    { id: 'terrace', type: 'statement' },
    { id: 'quiet', type: 'statement' },
    { id: 'vegetarian', type: 'statement' },
    { id: 'kid_friendly', type: 'statement' },
    { id: 'dog_friendly', type: 'statement' },
    { id: 'parking', type: 'statement' },
    { id: 'rush', type: 'statement' },
    { id: 'fair', type: 'statement' },
    { id: 'transport', type: 'choice', options: ['car', 'transit', 'bike', 'walk'] },
    { id: 'max_minutes', type: 'choice', options: ['15', '30', '45', '0'] },
    { id: 'budget', type: 'choice', options: ['1', '2', '3', '4'] },
    { id: 'place', type: 'choice', options: ['restaurant', 'cafe', 'bar', 'meeting_room'] },
  ],
  business: [
    { id: 'venue_type', type: 'choice', options: ['restaurant', 'cafe', 'bar', 'hotel', 'meeting_room', 'event'] },
    { id: 'size', type: 'choice', options: ['small', 'medium', 'large', 'xl'] },
    { id: 'groups', type: 'statement' },
    { id: 'terrace', type: 'statement' },
    { id: 'evening', type: 'statement' },
    { id: 'vegetarian', type: 'statement' },
    { id: 'accessible', type: 'statement' },
    { id: 'goal_requests', type: 'statement' },
    { id: 'guest_budget', type: 'choice', options: ['1', '2', '3', '4'] },
    { id: 'plan', type: 'choice', options: ['basis', 'start', 'growth', 'pro'] },
  ],
};

const yes = (answers, id) => answers[id] === 'yes';
const answered = (answers, id) => answers[id] === 'yes' || answers[id] === 'no';

// Personal answers → the preferences of the profile (on top of what it already has).
export function applyPersonalAnswers(answers, prefs) {
  const p = normalizePreferences(prefs);
  const level = (id) => (yes(answers, id) ? 'prefer' : 'no');
  const dining = { ...p.dining };
  for (const key of ['terrace', 'quiet', 'kid_friendly', 'dog_friendly']) if (answered(answers, key)) dining[key] = level(key);
  if (yes(answers, 'vegetarian')) dining.diets = [...new Set([...dining.diets, 'vegetarian'])];
  if (answers.vegetarian === 'no') dining.diets = dining.diets.filter((d) => d !== 'vegetarian');

  const travel = { ...p.travel };
  if (answered(answers, 'parking')) travel.needs_parking = yes(answers, 'parking');
  if (answered(answers, 'rush')) travel.avoid_rush_hour = yes(answers, 'rush');
  if (answers.max_minutes !== undefined) travel.max_minutes = Number(answers.max_minutes);

  const next = { ...p, dining, travel };
  if (answered(answers, 'fair')) next.fairness_priority = yes(answers, 'fair') ? 0.85 : 0.35;
  if (['car', 'transit', 'bike', 'walk'].includes(answers.transport)) next.default_transport = answers.transport;
  if (['1', '2', '3', '4'].includes(answers.budget)) next.budget_level = Number(answers.budget);
  if (DECKS.personal.find((c) => c.id === 'place').options.includes(answers.place)) next.preferred_types = [answers.place];
  return normalizePreferences(next);
}

// Business answers → what we know about the venue of this owner (used when connecting a zaak).
export function businessProfileFrom(answers) {
  const traits = Object.fromEntries(['groups', 'terrace', 'evening', 'vegetarian', 'accessible', 'goal_requests'].filter((id) => answered(answers, id)).map((id) => [id, yes(answers, id)]));
  return {
    venue_type: answers.venue_type ?? null,
    size: answers.size ?? null,
    guest_budget: answers.guest_budget ? Number(answers.guest_budget) : null,
    plan_interest: answers.plan ?? null,
    traits,
  };
}

// How many cards have an answer (skipped cards do not count).
export const answeredCount = (answers) => Object.values(answers).filter((v) => v !== undefined && v !== null).length;

export const deckFor = (kind) => DECKS[kind] ?? DECKS.personal;
