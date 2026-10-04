// Turns lat/lng into x/y pixels for a flat 2D map that fits all points in a box.
// Longitude degrees are narrower than latitude degrees in NL, so we scale them by cos(latitude).

export function createProjection(points, { width, height, padding = 24 }) {
  const middleLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lngScale = Math.cos((middleLat * Math.PI) / 180);

  const xs = points.map((p) => p.lng * lngScale);
  const ys = points.map((p) => p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Same scale on both axes (no stretching); a single point gets a small area around it.
  const spanX = Math.max(maxX - minX, 0.01);
  const spanY = Math.max(maxY - minY, 0.01);
  const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  return (point) => ({
    x: offsetX + (point.lng * lngScale - minX) * scale,
    y: height - (offsetY + (point.lat - minY) * scale), // north is up
  });
}

// Nudges points apart that lie closer together than `minDistance`, so map markers do not hide
// each other. Same input → same output. Returns new points in the same order.
export function spreadPoints(points, minDistance, { width = Infinity, height = Infinity, margin = 0, iterations = 40 } = {}) {
  const spread = points.map((p) => ({ x: p.x, y: p.y }));

  for (let round = 0; round < iterations; round++) {
    let moved = false;
    for (let i = 0; i < spread.length; i++) {
      for (let j = i + 1; j < spread.length; j++) {
        const dx = spread[j].x - spread[i].x;
        const dy = spread[j].y - spread[i].y;
        const distance = Math.hypot(dx, dy);
        if (distance >= minDistance) continue;

        // Identical points: separate along a direction that depends on their position in the list.
        const angle = distance === 0 ? (j * 2.399963) : Math.atan2(dy, dx);
        const push = (minDistance - distance) / 2;
        spread[i].x -= Math.cos(angle) * push;
        spread[i].y -= Math.sin(angle) * push;
        spread[j].x += Math.cos(angle) * push;
        spread[j].y += Math.sin(angle) * push;
        moved = true;
      }
    }
    for (const p of spread) {
      p.x = Math.min(width - margin, Math.max(margin, p.x));
      p.y = Math.min(height - margin, Math.max(margin, p.y));
    }
    if (!moved) break;
  }
  return spread;
}
