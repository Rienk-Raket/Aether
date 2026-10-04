// Candidate meeting places: known places around the group, plus a grid of points when there are
// too few (for example outside the Netherlands). Then every participant's travel time to each.

import { haversineKm, centroid } from './geo.js';
import { estimateTravelMinutes } from './travel-estimate.js';

export const MIN_CANDIDATES = 6;
const MIN_MARGIN_KM = 10;
const KM_PER_DEGREE_LAT = 111.32;

// points: participants' start locations [{ lat, lng }]
// places: [{ id, name, lat, lng }]
// Returns [{ id, name, lat, lng, generated }]
export function buildCandidates(points, places) {
  if (points.length === 0) return [];

  const box = expandedBox(points);
  const inside = places.filter((p) => p.lat >= box.south && p.lat <= box.north && p.lng >= box.west && p.lng <= box.east);
  const candidates = inside.map((p) => ({ ...p, generated: false }));

  if (candidates.length < MIN_CANDIDATES) {
    candidates.push(...gridCandidates(box, places));
  }
  return candidates;
}

// Bounding box around everyone, widened by 20% of the group's size (at least 10 km),
// so places just outside the group are considered too.
export function expandedBox(points) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const middleLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kmPerDegreeLng = KM_PER_DEGREE_LAT * Math.cos((middleLat * Math.PI) / 180);

  const spanKm = Math.max(
    (Math.max(...lats) - Math.min(...lats)) * KM_PER_DEGREE_LAT,
    (Math.max(...lngs) - Math.min(...lngs)) * kmPerDegreeLng,
  );
  const marginKm = Math.max(MIN_MARGIN_KM, spanKm * 0.2);

  return {
    south: Math.min(...lats) - marginKm / KM_PER_DEGREE_LAT,
    north: Math.max(...lats) + marginKm / KM_PER_DEGREE_LAT,
    west: Math.min(...lngs) - marginKm / kmPerDegreeLng,
    east: Math.max(...lngs) + marginKm / kmPerDegreeLng,
  };
}

// 5×5 grid over the box, named after the nearest known place (or "Punt n").
function gridCandidates(box, places, size = 5) {
  const result = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const point = {
        lat: box.south + ((row + 0.5) / size) * (box.north - box.south),
        lng: box.west + ((col + 0.5) / size) * (box.east - box.west),
      };
      const near = nearest(places, point);
      result.push({
        id: `grid-${row}-${col}`,
        name: near && haversineKm(near, point) < 25 ? `Omgeving ${near.name}` : `Punt ${row * size + col + 1}`,
        ...point,
        generated: true,
      });
    }
  }
  return result;
}

function nearest(places, point) {
  let best = null;
  for (const place of places) {
    if (!best || haversineKm(place, point) < haversineKm(best, point)) best = place;
  }
  return best;
}

// participants: [{ id, location: { lat, lng }, mode }]
// Adds `times` (minutes per participant, same order) to each candidate.
export function withTravelTimes(candidates, participants, estimate = estimateTravelMinutes) {
  return candidates.map((candidate) => ({
    ...candidate,
    times: participants.map((p) => estimate(p.location, candidate, p.mode)),
  }));
}

export function groupCentre(participants) {
  return centroid(participants.map((p) => p.location));
}
