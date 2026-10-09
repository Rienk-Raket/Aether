// A simplified, FICTIONAL outline of the Netherlands for the map screen, plus the projection
// that places lat/lng on it. Drawn by hand from a few dozen points: good enough to recognise,
// not meant to be exact. Points are [lng, lat].

export const MAP_WIDTH = 860;
export const MAP_HEIGHT = 960;
const SCALE = 330; // map units per degree of latitude
const COS = Math.cos((52.2 * Math.PI) / 180);

// lat/lng → x/y in map units (north is up).
export function project({ lat, lng }) {
  return { x: round((lng - 3.2) * COS * SCALE), y: round((53.6 - lat) * SCALE) };
}
const round = (n) => Math.round(n * 10) / 10;

export const MAINLAND = [
  [4.72, 52.97], [4.88, 52.93], [5.04, 52.945], [5.34, 53.075], [5.42, 53.18], [5.55, 53.27], [5.9, 53.39], [6.2, 53.41], [6.6, 53.44], [6.85, 53.45],
  [7.0, 53.33], [7.2, 53.24], [7.18, 53.0], [7.06, 52.88], [7.05, 52.64], [6.95, 52.46], [7.07, 52.25], [7.0, 52.14], [6.85, 51.98], [6.7, 51.9],
  [6.08, 51.88], [5.98, 51.7], [6.17, 51.4], [6.08, 51.22], [5.98, 51.05], [6.08, 50.88], [6.02, 50.76], [5.69, 50.76], [5.76, 50.95], [5.8, 51.12],
  [5.55, 51.26], [5.3, 51.3], [5.0, 51.45], [4.45, 51.47], [4.25, 51.37], [3.8, 51.25], [3.37, 51.37], [3.5, 51.46], [3.45, 51.55], [3.62, 51.66],
  [3.85, 51.8], [4.1, 51.98], [4.27, 52.1], [4.4, 52.2], [4.53, 52.37], [4.6, 52.5], [4.65, 52.78],
];

// Inland water drawn over the land: IJsselmeer and Markermeer.
export const LAKES = [
  [[5.06, 52.93], [5.33, 53.06], [5.43, 52.97], [5.38, 52.85], [5.7, 52.83], [5.62, 52.66], [5.45, 52.62], [5.28, 52.69], [5.05, 52.78]],
  [[5.28, 52.7], [5.45, 52.55], [5.3, 52.4], [5.12, 52.33], [5.05, 52.45], [5.05, 52.62]],
];

// The Wadden islands, as simple shapes.
export const ISLANDS = [
  [[4.7, 53.0], [4.88, 53.0], [4.9, 53.1], [4.78, 53.18], [4.7, 53.08]],
  [[4.95, 53.24], [5.12, 53.3], [5.1, 53.31], [4.93, 53.26]],
  [[5.2, 53.36], [5.55, 53.42], [5.53, 53.43], [5.2, 53.38]],
  [[5.62, 53.44], [5.95, 53.47], [5.93, 53.48], [5.62, 53.455]],
  [[6.12, 53.48], [6.25, 53.5], [6.24, 53.51], [6.12, 53.495]],
];

export const toMapPoints = (list) => list.map(([lng, lat]) => project({ lat, lng }));
export const toPolygon = (list) => toMapPoints(list).map((p) => `${p.x},${p.y}`).join(' ');

// Cities that get a name on the map.
export const LABELLED = ['amsterdam', 'rotterdam', 'den-haag', 'utrecht', 'eindhoven', 'groningen', 'arnhem', 'zwolle', 'maastricht', 'leeuwarden', 'breda', 'enschede', 'alkmaar', 'middelburg', 'venlo', 'nijmegen', 'almere'];
