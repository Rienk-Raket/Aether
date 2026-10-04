// "When can everyone?": scores a moment (start time + duration) for a group and finds the best ones.
// A moment is good when nobody travels in rush hour or late at night, stays within their own maximum
// travel time and is home on time. Travel times are estimates to the middle of the group.
// Pure functions, no browser needed.

import { centroid } from './geo.js';
import { estimateTravelMinutes } from './travel-estimate.js';
import { rushLevel, trafficFactor } from './traffic.js';
import { addMinutes } from './dates.js';

export const LEVELS = { good: 0.8, ok: 0.5 };

const RUSH_PENALTY = 0.35; // at full rush hour for the whole group
const OVER_MAX_PENALTY = 0.3; // per person above their maximum travel time
const LATE_RETURN_PENALTY = 0.3; // per person who gets home too late
const NIGHT_PENALTY = 0.15; // someone travels after 22:30 or before 05:30
const AVOID_RUSH_EXTRA = 0.15; // extra when someone asked to avoid rush hour

export const levelOf = (score) => (score >= LEVELS.good ? 'good' : score >= LEVELS.ok ? 'ok' : 'bad');

const isNight = (date) => {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= 22.5 || hour < 5.5;
};

// travelers: [{ id, name, mode, location: { lat, lng }, limits: { maxMinutes, latestReturnHour, avoidRush } }]
// Returns { score 0–1, level, reasons: [{ code, name? }], times: minutes per person (outward trip) }.
export function scoreSlot({ start, durationMinutes, travelers, centre }) {
  const middle = centre ?? centroid(travelers.map((p) => p.location));
  const end = addMinutes(start, durationMinutes);
  const reasons = [];
  let penalty = 0;

  const rush = Math.max(rushLevel(start), rushLevel(end));
  if (rush >= 0.2) {
    penalty += RUSH_PENALTY * rush;
    reasons.push({ code: 'rush' });
  }

  const times = travelers.map((p) => {
    const base = estimateTravelMinutes(p.location, middle, p.mode);
    const outward = base * trafficFactor(p.mode, start);
    const back = base * trafficFactor(p.mode, end);

    if (rush >= 0.2 && p.limits.avoidRush && (p.mode === 'car' || p.mode === 'transit')) {
      penalty += AVOID_RUSH_EXTRA * rush;
      reasons.push({ code: 'avoid_rush', name: p.name });
    }
    if (p.limits.maxMinutes && Math.max(outward, back) > p.limits.maxMinutes) {
      penalty += OVER_MAX_PENALTY;
      reasons.push({ code: 'max_time', name: p.name });
    }
    if (p.limits.latestReturnHour) {
      const homeMinute = end.getHours() * 60 + end.getMinutes() + back + (end.getDate() !== start.getDate() ? 1440 : 0);
      if (homeMinute > p.limits.latestReturnHour * 60) {
        penalty += LATE_RETURN_PENALTY;
        reasons.push({ code: 'late_return', name: p.name });
      }
    }
    if (isNight(start) || isNight(addMinutes(end, back))) {
      penalty += NIGHT_PENALTY / travelers.length;
      if (!reasons.some((r) => r.code === 'night')) reasons.push({ code: 'night' });
    }
    return outward;
  });

  const score = Math.max(0, 1 - penalty);
  return { score, level: levelOf(score), reasons, times };
}

// The best moments in the coming days, at most one per day, best first (earlier wins a tie).
// Tries every half hour between `fromHour` and `toHour`.
export function bestSlots({ from, days = 14, durationMinutes, travelers, count = 3, fromHour = 9, toHour = 21 }) {
  if (travelers.length === 0) return [];
  const centre = centroid(travelers.map((p) => p.location));
  const best = [];

  for (let day = 0; day < days; day++) {
    let top = null;
    for (let half = fromHour * 2; half <= toHour * 2; half++) {
      const start = new Date(from);
      start.setDate(start.getDate() + day);
      start.setHours(Math.floor(half / 2), (half % 2) * 30, 0, 0);
      if (start <= from) continue;
      const result = scoreSlot({ start, durationMinutes, travelers, centre });
      // Within a day, evenings and lunch are more natural than the early morning: break ties towards 17–20h.
      const preference = Math.abs(start.getHours() + start.getMinutes() / 60 - 18.5) / 100;
      const ranked = result.score - preference;
      if (!top || ranked > top.ranked) top = { start, ...result, ranked };
    }
    if (top) best.push(top);
  }
  return best.sort((a, b) => b.ranked - a.ranked || a.start - b.start).slice(0, count).map(({ ranked: _ranked, ...slot }) => slot);
}
