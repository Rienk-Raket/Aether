// Geometry of the opening screen: four routes run from outside the four corners to the centre
// and divide the screen into four triangles (top, right, bottom, left). Pure functions, so they
// can be tested without a browser.

// Bends of a route: [position along the line (0–1), sideways offset as a share of its length].
const BENDS = [[0.26, 0.05], [0.5, -0.06], [0.74, 0.04]];

// width, height: size of the screen. Returns 4 routes, clockwise from the top left;
// each is a list of [x, y] points from outside the corner to the centre.
export function buildRoutes(width, height) {
  const margin = Math.max(width, height) * 0.06;
  const centre = [width / 2, height / 2];
  const corners = [[-margin, -margin], [width + margin, -margin], [width + margin, height + margin], [-margin, height + margin]];

  return corners.map(([x, y], index) => {
    const dx = centre[0] - x;
    const dy = centre[1] - y;
    const length = Math.hypot(dx, dy);
    const side = index % 2 ? -1 : 1; // neighbouring routes bend the other way
    const bends = BENDS.map(([t, offset]) => [
      round(x + dx * t - (dy / length) * length * offset * side),
      round(y + dy * t + (dx / length) * length * offset * side),
    ]);
    return [[round(x), round(y)], ...bends, centre];
  });
}

// The triangle between route i and the next route follows both routes exactly, so the map
// pieces meet the lines without gaps. Index 0 = top, 1 = right, 2 = bottom, 3 = left.
export function buildTriangles(routes) {
  return routes.map((route, i) => {
    const next = routes[(i + 1) % routes.length];
    return [...route, ...[...next].reverse().slice(1)];
  });
}

export function boundingBox(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export const toPoints = (points) => points.map((p) => p.join(',')).join(' ');
export const toPath = (points) => `M${points.map((p) => p.join(' ')).join(' L')}`;

const round = (n) => Math.round(n * 10) / 10;
