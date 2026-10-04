// What gets stored in an appointment when an area is chosen as the meeting place.
// Shared by "Kies deze plek" (Ontdek) and by finishing a vote.

import { rankCandidates } from './fairness.js';

// candidate: { id, name, lat, lng, times }, alpha: slider position 0–1
export function areaSelection(candidate, alpha) {
  const ranked = rankCandidates([candidate], alpha)[0];
  return {
    selected_area: { id: candidate.id, name: candidate.name, lat: candidate.lat, lng: candidate.lng },
    fairness_score: Number(ranked.fairness.toFixed(2)),
    average_travel_time: Math.round(ranked.stats.mean),
    travel_time_stddev: Math.round(ranked.stats.stddev),
    fairness_priority: alpha,
  };
}
