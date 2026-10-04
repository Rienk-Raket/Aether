// Fairness algorithm (see docs/PLAN.md, section 4).
//
// For each candidate place we know every participant's travel time (minutes).
//   mean      μ  = average travel time
//   stddev    σ  = how far the times are spread around the mean
//   fairness     = 1 − min(σ/μ, 1)      → 1 means everyone travels equally long
//   cost         = μ + FAIRNESS_WEIGHT · α · σ
// α is the slider: 0 = most efficient (only the average counts), 1 = most fair.
// The candidate with the lowest cost wins.
//
// A candidate may carry `costTimes`: the travel times adjusted for personal preferences (a maximum
// travel time, avoiding rush hour). The cost is then computed from those, while `stats` and
// `fairness` still describe the real travel times that people will experience.

export const FAIRNESS_WEIGHT = 2;

export function travelStats(times) {
  if (times.length === 0) throw new Error('travelStats needs at least one travel time');

  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;

  return {
    mean,
    stddev: Math.sqrt(variance),
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

export function fairnessScore({ mean, stddev }) {
  // Everyone is already there (all zeros): perfectly fair.
  if (mean === 0) return 1;
  return 1 - Math.min(stddev / mean, 1);
}

export function cost({ mean, stddev }, alpha) {
  return mean + FAIRNESS_WEIGHT * clamp01(alpha) * stddev;
}

// candidates: [{ id, times: number[] , ...anything else }]
// Returns new objects sorted best-first, each with { stats, fairness, cost } added.
export function rankCandidates(candidates, alpha) {
  return candidates
    .map((candidate) => {
      const stats = travelStats(candidate.times);
      const costStats = candidate.costTimes ? travelStats(candidate.costTimes) : stats;
      return { ...candidate, stats, fairness: fairnessScore(stats), cost: cost(costStats, alpha) };
    })
    .sort(compareRanked);
}

// Lowest cost first. On a tie: shortest worst-case trip, then lowest mean, then id (stable order).
function compareRanked(a, b) {
  return (
    a.cost - b.cost ||
    a.stats.max - b.stats.max ||
    a.stats.mean - b.stats.mean ||
    String(a.id).localeCompare(String(b.id))
  );
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
