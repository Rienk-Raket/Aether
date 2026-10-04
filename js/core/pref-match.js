// Applies the requirements of an appointment (see requirements.js) to venues and to travel times.
// Pure functions: no browser, no storage.

import { WISH_KEYS } from './requirements.js';
import { rushLevel } from './traffic.js';

// Venue fields used here (see data/venues.json): diets[], allergen_safe[], accessible,
// accessible_toilet, terrace, kid_friendly, dog_friendly, quiet, parking, charger.

// Why would this venue not satisfy the hard requirements? Returns a list of keys (empty = fits).
export function failedRequirements(venue, req) {
  const failed = [];
  for (const diet of req.hard.diets) if (!venue.diets?.includes(diet)) failed.push(`diet:${diet}`);
  for (const allergy of req.hard.allergies) if (!venue.allergen_safe?.includes(allergy)) failed.push(`allergy:${allergy}`);
  for (const need of req.hard.accessibility) {
    const ok = need === 'accessible_toilet' ? venue.accessible_toilet : venue.accessible;
    if (!ok) failed.push(`access:${need}`);
  }
  for (const key of WISH_KEYS) if (req.hard.wishes[key] && !venue[key]) failed.push(`wish:${key}`);
  return failed;
}

// Wishes that are not met, and a score (higher is better).
export function softScore(venue, req) {
  const { soft } = req;
  const missed = [];
  let score = 0;

  score += soft.cuisines[venue.cuisine] ?? 0;
  score += soft.types[venue.type] ?? 0;
  if (soft.maxPrice && venue.price_level > soft.maxPrice) {
    score -= venue.price_level - soft.maxPrice;
    missed.push('price');
  }
  for (const key of Object.keys(soft.wishes)) {
    if (venue[key]) score += 1;
    else missed.push(`wish:${key}`);
  }
  for (const diet of soft.diets) {
    if (venue.diets?.includes(diet)) score += 1;
    else missed.push(`diet:${diet}`);
  }
  return { score, missed };
}

// Removes venues that fail a hard requirement and puts the best matches first.
// Each venue gets `pref_score` and `pref_missed` (wishes that are not met).
// The sort is stable, so equal scores keep the order they came in.
export function applyVenuePrefs(venues, req) {
  return venues
    .filter((venue) => failedRequirements(venue, req).length === 0)
    .map((venue) => {
      const { score, missed } = softScore(venue, req);
      return { ...venue, pref_score: score, pref_missed: missed };
    })
    .sort((a, b) => b.pref_score - a.pref_score);
}

export const PARKING_MINUTES = 8;
export const CHARGER_MINUTES = 10;

// Extra time some participants lose at this venue (looking for parking, a charger).
// participants: [{ id, name, mode, limits: { needsParking, needsCharger }, electric }]
export function venueTravelNotes(venue, participants) {
  const notes = [];
  for (const p of participants) {
    if (p.mode !== 'car') continue;
    if (p.limits.needsParking && !venue.parking) notes.push({ personId: p.id, name: p.name, kind: 'parking', minutes: PARKING_MINUTES });
    if (p.limits.needsCharger && p.electric && !venue.charger) notes.push({ personId: p.id, name: p.name, kind: 'charger', minutes: CHARGER_MINUTES });
  }
  return notes;
}

const RUSH_WEIGHT = 0.3; // extra weight of a trip in rush hour for someone who wants to avoid it
const OVER_LIMIT_WEIGHT = 2; // every minute above a person's maximum counts this many times

// Adds `costTimes` (what the ranking uses) and `violations` (what the screen warns about) to each
// candidate place. The real `times` stay untouched, because those are what people will travel.
// participants: [{ id, name, mode, limits }] in the same order as candidate.times.
// when: start of the appointment (Date). durationMinutes: how long it lasts.
export function applyTravelPreferences(candidates, participants, when, durationMinutes) {
  const rush = rushLevel(when);
  const startMinute = when.getHours() * 60 + when.getMinutes();

  return candidates.map((candidate) => {
    const violations = [];
    const costTimes = candidate.times.map((time, i) => {
      const { id, name, mode, limits } = participants[i];
      let cost = time;

      if (limits.avoidRush && rush > 0 && (mode === 'car' || mode === 'transit')) cost += time * RUSH_WEIGHT * rush;
      if (limits.maxMinutes && time > limits.maxMinutes) {
        cost += (time - limits.maxMinutes) * OVER_LIMIT_WEIGHT;
        violations.push({ kind: 'max_time', personId: id, name, minutes: Math.round(time), limit: limits.maxMinutes });
      }
      if (limits.latestReturnHour) {
        const homeAt = startMinute + durationMinutes + time; // minutes after midnight of the appointment day
        if (homeAt > limits.latestReturnHour * 60) violations.push({ kind: 'late_return', personId: id, name, limit: limits.latestReturnHour });
      }
      return cost;
    });
    return { ...candidate, costTimes, violations };
  });
}

// Is the participant's chosen transport available to them? (Used when choosing transport.)
// Returns the mode to use: the chosen one, or the first available fallback.
export function usableMode(chosen, available, preferred) {
  if (available.includes(chosen)) return chosen;
  return available.includes(preferred) ? preferred : available.includes('transit') ? 'transit' : available[0];
}
