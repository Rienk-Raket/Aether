// Color levels (good / medium / bad) for travel times, as used for green / orange / red in the UI.

// One person's trip compared to the group's average for that place:
// up to 10% above average is fine, up to 30% is so-so, more is unfair.
export function personLevel(minutes, mean) {
  if (mean === 0 || minutes <= mean * 1.1) return 'good';
  if (minutes <= mean * 1.3) return 'medium';
  return 'bad';
}

// An average trip: up to 30 min is short, up to 60 min is okay, more is long.
export function durationLevel(minutes) {
  if (minutes <= 30) return 'good';
  if (minutes <= 60) return 'medium';
  return 'bad';
}

// Fairness score 0–1.
export function fairnessLevel(score) {
  if (score >= 0.8) return 'good';
  if (score >= 0.6) return 'medium';
  return 'bad';
}
