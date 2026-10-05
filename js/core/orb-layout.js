// Layout of the abstract orb (no browser, no 3D library: just numbers).
//
// The participants sit evenly spread on the surface of a unit sphere. Every candidate place floats
// inside the orb, at the spot where its distance to each participant matches that person's travel
// time as well as possible. So the length of a line is a travel time, and a place with equal travel
// times for everyone floats in the middle of the orb: "fair" literally means "central".

// n unit vectors spread evenly over a sphere (Fibonacci spiral). One person sits at the front.
export function participantPoints(n) {
  if (n === 1) return [[0, 0, 1]];
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = i * golden;
    return [Math.cos(angle) * r, y, Math.sin(angle) * r];
  });
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const length = (v) => Math.hypot(v[0], v[1], v[2]);
export const MAX_RADIUS = 1.15; // candidates never leave the orb by much

// Where does a place go, given the minutes each person needs? scale: orb units per minute.
// Gradient descent on the sum of (distance − time·scale)². Deterministic: same input, same spot.
export function placeCandidate(points, times, scale) {
  const wanted = times.map((time) => time * scale);
  // Start between the people, nudged by the candidate's own times so equal starts do not overlap.
  let x = [0, 0, 0];
  points.forEach((p, i) => {
    const weight = 1 / (wanted[i] + 0.05);
    x = x.map((value, k) => value + p[k] * weight);
  });
  const norm = length(x) || 1;
  x = x.map((value) => (value / norm) * 0.3);

  for (let step = 0; step < 120; step++) {
    const gradient = [0, 0, 0];
    points.forEach((p, i) => {
      const d = dist(x, p) || 1e-6;
      const error = d - wanted[i];
      for (let k = 0; k < 3; k++) gradient[k] += (error * (x[k] - p[k])) / d;
    });
    x = x.map((value, k) => value - 0.15 * gradient[k]);
    const r = length(x);
    if (r > MAX_RADIUS) x = x.map((value) => (value / r) * MAX_RADIUS);
  }
  return x;
}

// candidates: [{ id, times }] → { points, scale, positions: Map id → [x, y, z] }
export function layoutOrb(participantCount, candidates) {
  const points = participantPoints(participantCount);
  const all = candidates.flatMap((c) => c.times);
  const mean = all.length ? all.reduce((sum, t) => sum + t, 0) / all.length : 1;
  const scale = mean > 0 ? 1 / mean : 1; // an average trip is about one orb radius long
  const positions = new Map(candidates.map((c) => [c.id, placeCandidate(points, c.times, scale)]));
  return { points, scale, positions };
}
