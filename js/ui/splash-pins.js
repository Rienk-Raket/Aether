// Meeting-place pins on the opening screen. Loose pins stand on street crossings and roads, away from the routes.

import { el, glyph, rng } from './splash-svg.js';
import { SCENE, ROAD_Y, insideWedge, roadPoints } from './splash-plan.js';

const PIN_PATH = 'M0 0C-3.5 -6 -10 -11.5 -10 -19a10 10 0 0 1 20 0C10 -11.5 3.5 -6 0 0z';
const ROAD_WEDGE = 4;

// Draws one pin with its tip at (0, 0) into `parent`. kind: 'dot', 'restaurant' or 'bar'.
export function drawPin(parent, kind, colors) {
  el('ellipse', { cx: 0, cy: 0, rx: 5, ry: 2, fill: '#000', 'fill-opacity': 0.35 }, parent);
  el('path', { d: PIN_PATH, fill: colors.amber }, parent);
  el('circle', { cx: 0, cy: -19, r: 7.2, fill: colors.dark }, parent);
  if (kind === 'dot') el('circle', { cx: 0, cy: -19, r: 3, fill: colors.amber }, parent);
  else glyph(parent, kind, -5.5, -24.5, 0.46, colors.amber, 2.6);
}

// Possible spots per wedge: street crossings of the cities, points on the winding roads.
function candidates(graphs) {
  const spots = graphs.map((nodes) => (nodes ? [...nodes.values()].map((node) => node.p) : []));
  ROAD_Y.forEach((y, index) => spots[ROAD_WEDGE].push(...roadPoints(y, index)));
  const { CX, CY, RING } = SCENE;
  return spots.map((list, wedge) =>
    list.filter(
      ([x, y]) => x > 28 && x < 362 && y > 84 && y < 796 && Math.hypot(x - CX, y - CY) > RING + 30 && insideWedge(wedge, x, y, 24),
    ),
  );
}

// samples: points along all routes. meeting: the shared end point. Returns [{ x, y, kind, delay }].
export function pickPins(graphs, samples, meeting) {
  const random = rng(7);
  const spots = candidates(graphs);
  const taken = [meeting];
  const pins = [];
  spots.forEach((list, wedge) => {
    const shuffled = [...list];
    for (let k = shuffled.length - 1; k > 0; k--) {
      const j = Math.floor(random() * (k + 1));
      [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]];
    }
    let left = wedge === 0 || wedge === 3 ? 6 : 4;
    for (const [x, y] of shuffled) {
      if (left === 0) break;
      const nearRoute = samples.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 26);
      const nearPin = taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 52);
      if (nearRoute || nearPin) continue;
      taken.push([x, y]);
      const roll = random();
      pins.push({ x, y, kind: roll < 0.4 ? 'dot' : roll < 0.7 ? 'restaurant' : 'bar', delay: 0.3 + wedge * 0.1 + random() * 0.5 });
      left--;
    }
  });
  return pins.sort((a, b) => a.y - b.y);
}

export function drawPins(layer, pins, colors) {
  for (const { x, y, kind, delay } of pins) {
    const spot = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, layer);
    const pin = el('g', { class: 'splash-pin', style: `animation-delay:${delay.toFixed(2)}s` }, spot);
    if (kind === 'dot') {
      const ring = { class: 'splash-ring', cx: 0, cy: 0, rx: 5, ry: 2, fill: 'none', stroke: colors.amber, 'stroke-width': 1 };
      el('ellipse', { ...ring, style: `animation-delay:${(delay + Math.random() * 2).toFixed(2)}s` }, pin);
    }
    drawPin(pin, kind, colors);
  }
}
