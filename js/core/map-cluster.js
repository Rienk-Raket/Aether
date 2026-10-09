// Groups map pins that lie close together, so a crowded city does not become a blob of pins.
// Points are { x, y } in map units; `cell` is the size of the grid square in map units.

// Returns [{ x, y, items }]: the centre of each group and what is in it. A group of one is a pin.
export function clusterPoints(points, cell) {
  const groups = new Map();
  for (const point of points) {
    const key = `${Math.floor(point.x / cell)}:${Math.floor(point.y / cell)}`;
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }
  return [...groups.values()].map((items) => ({
    x: items.reduce((s, p) => s + p.x, 0) / items.length,
    y: items.reduce((s, p) => s + p.y, 0) / items.length,
    items,
  }));
}

// The smallest box (x, y, width, height) that contains all points, with some room around it.
export function boundsOf(points, pad = 12) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, width: Math.max(...xs) - Math.min(...xs) + pad * 2, height: Math.max(...ys) - Math.min(...ys) + pad * 2 };
}
