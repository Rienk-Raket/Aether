// Fictional service "Zaakwijzer": the (made-up) server behind the business portal. It pretends
// to answer over the internet; in reality everything is calculated on this device from fixed seeds.

import { simulateLatency, loadBundledJson } from '../../../services/mock/network.js';
import { fetchAllVenues } from '../../../services/mock/plekwijzer-mock.js';
import { rangeStats, isoDay, median, pct } from '../../core/stats.js';
import { haversineKm } from '../../../core/geo.js';

// The venue's own city first, then the nearest other cities (where groups come from).
async function originCities(venue) {
  const places = (await loadBundledJson('data/nl-places.json')).places;
  const own = places.find((p) => p.id === venue.area_id);
  const nearest = places
    .filter((p) => p.id !== venue.area_id)
    .map((p) => ({ name: p.name, km: haversineKm(venue, p) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map((p) => p.name);
  return [own?.name ?? 'Eigen stad', ...nearest, 'Overig'];
}

export async function fetchStats(venueId, days) {
  await simulateLatency(250, 600);
  const venues = await fetchAllVenues();
  const venue = venues.find((v) => v.id === venueId);
  if (!venue) throw new Error('unknown venue');
  const today = isoDay(new Date());
  const range = rangeStats(venue, days, today, await originCities(venue));
  const benchmark = neighbourhood(venue, venues, today);
  return { range, benchmark, fetched_at: new Date().toISOString() };
}

// Anonymous medians of comparable venues (same type), never single venues. Starts within 2 km
// and widens the area until at least 3 comparable venues are found.
function neighbourhood(venue, venues, today) {
  const same = venues.filter((v) => v.id !== venue.id && v.type === venue.type);
  const radius = [2, 5, 10, 25].find((km) => same.filter((v) => haversineKm(venue, v) <= km).length >= 3);
  if (!radius) return null;
  const peers = same.filter((v) => haversineKm(venue, v) <= radius);
  const rates = peers.map((p) => {
    const r = rangeStats(p, 30, today, ['x']);
    return pct(r.chosen, r.shortlisted);
  });
  return { peers: peers.length, radius, choice_rate: median(rates), rating: median(peers.map((p) => p.rating).filter(Boolean)), travel: median(peers.map((p) => 24 + (p.popularity ?? 0.5) * 6)) };
}
