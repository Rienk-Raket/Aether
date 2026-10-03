// Offline travel-time estimate: straight-line distance, corrected for detours, divided by speed.
// Used as fallback whenever no (simulated) routing service is available.

import { haversineKm } from './geo.js';

// detour:   roads are never straight; real route ≈ straight line × detour
// speedKmh: average door-to-door speed while moving
// overheadMin: fixed extra time (parking, unlocking a bike, walking to a stop and waiting)
export const TRANSPORT_MODES = {
  walk: { detour: 1.2, speedKmh: 5, overheadMin: 0 },
  bike: { detour: 1.25, speedKmh: 15, overheadMin: 2 },
  car: { detour: 1.3, speedKmh: 60, overheadMin: 6 },
  transit: { detour: 1.25, speedKmh: 50, overheadMin: 12 },
};

export function estimateTravelMinutes(from, to, mode) {
  const profile = TRANSPORT_MODES[mode];
  if (!profile) throw new Error(`Unknown transport mode: ${mode}`);

  const routeKm = haversineKm(from, to) * profile.detour;
  if (routeKm === 0) return 0;

  return (routeKm / profile.speedKmh) * 60 + profile.overheadMin;
}
