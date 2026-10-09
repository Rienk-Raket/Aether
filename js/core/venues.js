// Rules for venues: filtering, opening hours, crowd forecast and distance.
// A venue has `hours`: 7 entries (Sunday first) of [openMinute, closeMinute] or null (closed);
// a closing time above 1440 means after midnight.

import { haversineKm } from './geo.js';

export const VENUE_TYPES = ['restaurant', 'cafe', 'bar', 'meeting_room', 'hotel', 'event'];

// Opening status at a moment: { open: boolean, today: [open, close]|null }
export function openStatus(venue, date) {
  const minute = date.getHours() * 60 + date.getMinutes();
  const day = date.getDay();
  const today = venue.hours[day];
  const yesterday = venue.hours[(day + 6) % 7];

  if (today && minute >= today[0] && minute < today[1]) return { open: true, today };
  // Yesterday's hours that run past midnight (for example open until 01:00).
  if (yesterday && yesterday[1] > 1440 && minute < yesterday[1] - 1440) return { open: true, today };
  return { open: false, today };
}

export function is24h(venue) {
  return venue.hours.every((h) => h && h[0] === 0 && h[1] >= 1440);
}

// "17:00–23:00", "16:00–01:00", "24 uur open" or "Gesloten"
export function formatHours(range) {
  if (!range) return 'Gesloten';
  if (range[0] === 0 && range[1] >= 1440) return '24 uur open';
  const text = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${text(range[0])}–${text(range[1])}`;
}

// Expected crowd at a moment: 'low' | 'medium' | 'high'. Evenings and weekends are busier,
// and so are popular places. This is a forecast, not live data.
export function crowdLevel(venue, date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  const day = date.getDay();
  let score = venue.popularity * 0.5;
  if (hour >= 18 && hour < 21.5) score += 0.4;
  else if (hour >= 12 && hour < 14) score += 0.25;
  else if (hour >= 21.5) score += 0.2;
  if (day === 5 || day === 6) score += 0.2;
  if (venue.type === 'meeting_room' && (day === 0 || day === 6)) score = 0;
  return score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low';
}

// filters: { types: string[] (empty = all), accessible, quiet, vegetarian } (booleans = "must have")
export function filterVenues(venues, filters) {
  return venues.filter((v) => {
    if (filters.types?.length && !filters.types.includes(v.type)) return false;
    if (filters.accessible && !v.accessible) return false;
    if (filters.quiet && !v.quiet) return false;
    if (filters.vegetarian && !v.vegetarian) return false;
    return true;
  });
}

// Open ones first, then the best rated.
export function sortVenues(venues, date) {
  return [...venues].sort((a, b) => {
    const openA = openStatus(a, date).open ? 1 : 0;
    const openB = openStatus(b, date).open ? 1 : 0;
    return openB - openA || b.rating - a.rating || a.name.localeCompare(b.name, 'nl');
  });
}

// Venues within `radiusKm` of a point, nearest first, with `distance_km` added.
export function venuesNear(venues, point, radiusKm) {
  return venues
    .map((venue) => ({ venue, km: haversineKm(venue, point) }))
    .filter((x) => x.km <= radiusKm)
    .sort((a, b) => a.km - b.km)
    .map((x) => ({ ...x.venue, distance_km: Number(x.km.toFixed(1)) }));
}

// Short text about opening at a moment: { open, text } — "Open tot 23:00", "Gesloten · opent 17:00",
// "Gesloten op dit tijdstip" (closed all day), or "24 uur open".
export function openLabel(venue, date) {
  if (is24h(venue)) return { open: true, text: '24 uur open' };
  const { open, today } = openStatus(venue, date);
  const clock = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const minute = date.getHours() * 60 + date.getMinutes();

  if (open) {
    const yesterday = venue.hours[(date.getDay() + 6) % 7];
    const closes = today && minute >= today[0] && minute < today[1] ? today[1] : yesterday[1];
    return { open: true, text: `Open tot ${clock(closes)}` };
  }
  if (today && minute < today[0]) return { open: false, text: `Gesloten · opent ${clock(today[0])}` };
  return { open: false, text: 'Gesloten op dit tijdstip' };
}

// "€25–40 p.p." or "€95–140 per kamer/nacht"
export function formatPriceRange(venue) {
  const [low, high] = venue.price_range;
  return `€${low}–${high} ${venue.price_unit === 'room' ? 'per kamer/nacht' : 'p.p.'}`;
}
