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
