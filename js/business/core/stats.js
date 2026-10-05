// Demo statistics for a venue. Nothing is measured: numbers are generated from a fixed seed
// (venue + date), so the same day always shows the same figures, offline and in tests.
// Privacy rule, enforced here too: a split with fewer than MIN_GROUP choices is hidden.

export const MIN_GROUP = 5;
export const SIZE_BUCKETS = ['2-3', '4-6', '7-9', '10+'];
export const WISHES = ['vegetarian', 'accessible', 'quiet', 'terrace', 'halal'];

// Small deterministic random generator (mulberry32) from a text seed.
export function seeded(text) {
  let h = 1779033703;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353) << 13 | h >>> 19;
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_FACTOR = [0.7, 0.6, 0.65, 0.8, 1.2, 1.5, 1.0]; // Sunday … Saturday
const dayStart = (iso) => new Date(`${iso}T12:00:00`);
export const isoDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// One day of numbers. `origins` are city names, nearest first (the venue's own city first).
export function dayStats(venue, iso, origins) {
  const rnd = seeded(`${venue.id}|${iso}`);
  const factor = DAY_FACTOR[dayStart(iso).getDay()] * (0.55 + (venue.popularity ?? 0.5) * 0.9) * (0.9 + rnd() * 0.25);
  const shown = Math.round(120 * factor);
  const shortlisted = Math.round(shown * (0.32 + rnd() * 0.16));
  const chosen = Math.round(shortlisted * (0.045 + rnd() * 0.05) * (venue.rating ? venue.rating / 4.3 : 1));
  const requests = Math.round(chosen * (0.5 + rnd() * 0.25));
  const spread = (weights, total) => Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, total * w * (0.8 + rnd() * 0.4)]));
  return {
    date: iso, shown, shortlisted, chosen, requests,
    sizes: spread({ '2-3': 0.14, '4-6': 0.49, '7-9': 0.26, '10+': 0.11 }, chosen),
    fairness_sum: +(chosen * (0.78 + rnd() * 0.12)).toFixed(3),
    travel_sum: Math.round(chosen * (19 + rnd() * 9)),
    origins: spread(Object.fromEntries(origins.map((city, i) => [city, [0.46, 0.22, 0.14, 0.1, 0.08][i] ?? 0.05])), chosen),
    wishes: spread({ vegetarian: 0.5, accessible: 0.35, quiet: 0.28, terrace: 0.22, halal: 0.15 }, chosen),
  };
}

const roundMap = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Math.round(v)]));
const sumMaps = (maps) => roundMap(maps.reduce((acc, m) => Object.fromEntries([...new Set([...Object.keys(acc), ...Object.keys(m)])].map((k) => [k, (acc[k] ?? 0) + (m[k] ?? 0)])), {}));

// `days` days ending at endIso (inclusive), plus the same length before it for the trend.
export function rangeStats(venue, days, endIso, origins) {
  const end = dayStart(endIso);
  const list = (offset) => Array.from({ length: days }, (_, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - offset - (days - 1 - i));
    return dayStats(venue, isoDay(d), origins);
  });
  const current = list(0);
  const previous = list(days);
  const total = (rows, key) => rows.reduce((s, r) => s + r[key], 0);
  const chosen = total(current, 'chosen');
  return {
    days: current,
    shown: total(current, 'shown'), shortlisted: total(current, 'shortlisted'), chosen, requests: total(current, 'requests'),
    sizes: sumMaps(current.map((r) => r.sizes)),
    origins: sumMaps(current.map((r) => r.origins)),
    wishes: sumMaps(current.map((r) => r.wishes)),
    fairness: chosen ? total(current, 'fairness_sum') / chosen : 0,
    travel: chosen ? total(current, 'travel_sum') / chosen : 0,
    trend: { chosen: trend(chosen, total(previous, 'chosen')), shortlisted: trend(total(current, 'shortlisted'), total(previous, 'shortlisted')), requests: trend(total(current, 'requests'), total(previous, 'requests')) },
  };
}

// Percentage change, or null when there is nothing to compare with.
export const trend = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

// [{ key, count, share }] biggest first; null when the total is below the privacy minimum.
export function splitShares(map) {
  const total = Object.values(map).reduce((s, n) => s + n, 0);
  if (total < MIN_GROUP) return null;
  return Object.entries(map).map(([key, count]) => ({ key, count, share: Math.round((count / total) * 100) })).sort((a, b) => b.count - a.count);
}

export function funnel(range) {
  return [
    { key: 'shown', count: range.shown, of: null },
    { key: 'shortlisted', count: range.shortlisted, of: range.shown },
    { key: 'chosen', count: range.chosen, of: range.shortlisted },
    { key: 'requests', count: range.requests, of: range.chosen },
  ].map((step) => ({ ...step, rate: step.of === null ? null : pct(step.count, step.of) }));
}

// Neighbourhood comparison: the median of venues of the same type within radius (anonymous).
export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function toCsv(range) {
  const head = 'datum;getoond;shortlist;gekozen;aanvragen';
  return [head, ...range.days.map((d) => [d.date, d.shown, d.shortlisted, d.chosen, d.requests].join(';'))].join('\n');
}
