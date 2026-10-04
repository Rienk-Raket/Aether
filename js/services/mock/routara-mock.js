// Fictional routing service "Routara". It pretends to return live travel times: our own
// estimate, slowed down by simulated rush hour and with a small stable "real-world" variation.

import { estimateTravelMinutes } from '../../core/travel-estimate.js';
import { trafficFactor } from '../../core/traffic.js';
import { hashKey } from '../../core/hash.js';
import { simulateLatency } from './network.js';

// Same answer for the same trip every time (no random numbers), between -3% and +3%.
function variation(from, to, mode) {
  const code = hashKey(`${from.lat.toFixed(3)},${from.lng.toFixed(3)}>${to.lat.toFixed(3)},${to.lng.toFixed(3)}:${mode}`);
  return 1 + ((parseInt(code, 36) % 7) - 3) / 100;
}

// participants: [{ location, mode }], places: [{ lat, lng }], when: Date
// Returns minutes as [place][participant].
export function computeMatrix(participants, places, when) {
  return places.map((place) =>
    participants.map((p) => {
      const base = estimateTravelMinutes(p.location, place, p.mode);
      if (base === 0) return 0;
      return Math.round(base * trafficFactor(p.mode, when) * variation(p.location, place, p.mode) * 10) / 10;
    }),
  );
}

export async function matrix(participants, places, when) {
  await simulateLatency(300, 700);
  return computeMatrix(participants, places, when);
}
