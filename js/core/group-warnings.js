// Edge-case warnings for a group before calculating (spec section 8, "Randgevallen").

import { maxPairwiseDistanceKm } from './geo.js';

export const FAR_APART_KM = 500;
export const LARGE_GROUP_SIZE = 20;

// members: [{ name, location: { lat, lng } | null }]
// Returns a list of { code, ... } objects; an empty list means all good.
export function groupWarnings(members) {
  const warnings = [];

  for (const member of members) {
    if (!member.location) warnings.push({ code: 'missing_location', name: member.name });
  }

  if (members.length > LARGE_GROUP_SIZE) warnings.push({ code: 'large_group' });

  const points = members.map((m) => m.location).filter(Boolean);
  if (maxPairwiseDistanceKm(points) > FAR_APART_KM) warnings.push({ code: 'far_apart' });

  return warnings;
}

// "missing_location" blocks the calculation; the others are only informational.
export const isBlocking = (warning) => warning.code === 'missing_location';
