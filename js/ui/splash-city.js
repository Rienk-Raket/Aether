// The map behind the opening screen: one city (or a set of winding roads) in each of the six wedges.

import { el, rng } from './splash-svg.js';
import { SCENE, WEDGES, insideWedge, makeCity, ROAD_Y, roadPoints, smooth } from './splash-plan.js';

const BIG = 720; // wedges are drawn far past the screen edge and clipped by the frame

// One entry per wedge (0 = top, then clockwise). pal: 'b' blue or 't' teal blocks. vc: row of a canal.
const CITY_CFG = [
  { cx: 195, cy: 170, rot: 7, cell: 48, n: 7, seed: 101, skip: 0.12, pal: 't' },
  { cx: 300, cy: 250, rot: -9, cell: 46, n: 7, seed: 11, skip: 0.14, pal: 'b' },
  { cx: 300, cy: 620, rot: 15, cell: 44, n: 7, seed: 22, skip: 0.12, pal: 't' },
  { cx: 195, cy: 690, rot: 12, cell: 50, n: 7, seed: 33, skip: 0.1, pal: 'b', vc: 0 },
  { cx: 60, cy: 620, rot: 18, cell: 38, n: 6, seed: 44, skip: 0.25, pal: 'b', streets: false },
  { cx: 80, cy: 250, rot: -22, cell: 42, n: 7, seed: 55, skip: 0.15, pal: 'b' },
];

export function makeCities() {
  return CITY_CFG.map((cfg, i) => makeCity(i, cfg));
}

function drawBlocks(group, city, colors, random) {
  const { cfg } = city;
  const palette = cfg.pal === 't' ? colors.blockTeal : colors.blockBlue;
  const street = cfg.pal === 't' ? colors.streetTeal : colors.streetBlue;
  for (let i = -cfg.n; i <= cfg.n; i++) {
    for (let j = -cfg.n; j <= cfg.n; j++) {
      const [sx, sy] = city.cell(i, j);
      if (!insideWedge(city.i, sx, sy, -70) || sx < -50 || sx > 440 || sy < -50 || sy > 894) continue;
      const x = cfg.cx + i * cfg.cell;
      const y = cfg.cy + j * cfg.cell;
      if (random() < cfg.skip) {
        if (random() < 0.55) {
          const side = cfg.cell - 10;
          el('rect', { x: x - side / 2, y: y - side / 2, width: side, height: side, rx: 7, fill: colors.park, 'fill-opacity': 0.8 }, group);
        }
        continue;
      }
      const w = cfg.cell - 11 - random() * 6;
      const h = cfg.cell - 11 - random() * 6;
      const block = el(
        'rect',
        {
          x: (x - w / 2 + (random() - 0.5) * 2).toFixed(1),
          y: (y - h / 2 + (random() - 0.5) * 2).toFixed(1),
          width: w.toFixed(1),
          height: h.toFixed(1),
          rx: 3.5,
          fill: palette[Math.floor(random() * palette.length)],
          'fill-opacity': (0.74 + random() * 0.26).toFixed(2),
        },
        group,
      );
      if (random() < 0.16) {
        block.setAttribute('stroke', street);
        block.setAttribute('stroke-opacity', 0.45);
      }
    }
  }
}

// A canal runs along one street row, with a bridge at every crossing.
function drawCanal(group, city, colors) {
  const { cfg } = city;
  const y = cfg.cy + (cfg.vc + 0.5) * cfg.cell;
  const reach = (cfg.n + 1) * cfg.cell;
  const line = { x1: cfg.cx - reach, y1: y, x2: cfg.cx + reach, y2: y };
  el('line', { ...line, stroke: colors.shore, 'stroke-width': 20 }, group);
  el('line', { ...line, stroke: colors.water, 'stroke-width': 14 }, group);
  el('line', { ...line, stroke: colors.blue, 'stroke-opacity': 0.35, 'stroke-width': 1.2, 'stroke-dasharray': '2 8' }, group);
  for (let u = -cfg.n - 1; u <= cfg.n; u++) {
    el('rect', { x: cfg.cx + (u + 0.5) * cfg.cell - 5, y: y - 12, width: 10, height: 24, rx: 2, fill: colors.bridge }, group);
  }
}

function drawCity(parent, city, colors) {
  const { cfg } = city;
  const group = el('g', { transform: `rotate(${cfg.rot} ${cfg.cx} ${cfg.cy})` }, parent);
  if (cfg.streets !== false) {
    const street = cfg.pal === 't' ? colors.streetTeal : colors.streetBlue;
    const reach = (cfg.n + 1) * cfg.cell;
    for (let k = -cfg.n - 1; k <= cfg.n; k++) {
      const offset = (k + 0.5) * cfg.cell;
      const style = { stroke: street, 'stroke-opacity': 0.55, 'stroke-width': 3.4 };
      el('line', { x1: cfg.cx - reach, y1: cfg.cy + offset, x2: cfg.cx + reach, y2: cfg.cy + offset, ...style }, group);
      el('line', { x1: cfg.cx + offset, y1: cfg.cy - reach, x2: cfg.cx + offset, y2: cfg.cy + reach, ...style }, group);
    }
  }
  drawBlocks(group, city, colors, rng(cfg.seed));
  if (cfg.vc !== undefined) drawCanal(group, city, colors);
}

function drawRoads(parent, colors) {
  ROAD_Y.forEach((y, index) => {
    const d = smooth(roadPoints(y, index));
    el('path', { d, fill: 'none', stroke: colors.roadEdge, 'stroke-opacity': 0.5, 'stroke-width': 20, 'stroke-linecap': 'round' }, parent);
    el('path', { d, fill: 'none', stroke: colors.road, 'stroke-width': 16, 'stroke-linecap': 'round' }, parent);
    el('path', { d, fill: 'none', stroke: colors.blue, 'stroke-opacity': 0.55, 'stroke-width': 1.2, 'stroke-dasharray': '6 6' }, parent);
  });
}

// Draws the six wedges: map inside, a clipped frame, a mint outline on top.
export function drawWedges({ defs, wedgeLayer, outlineLayer }, cities, colors) {
  WEDGES.forEach((w, i) => {
    const low = [w.ax + BIG * w.dlo[0], w.ay + BIG * w.dlo[1]];
    const high = [w.ax + BIG * w.dhi[0], w.ay + BIG * w.dhi[1]];
    const points = [[w.ax, w.ay], low, high].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    el('polygon', { points }, el('clipPath', { id: `splash-wedge-${i}` }, defs));
    const group = el('g', { class: 'splash-wedge', 'clip-path': `url(#splash-wedge-${i})`, style: `--i:${i}` }, wedgeLayer);
    el('rect', { width: SCENE.W, height: SCENE.H, fill: colors.wedge[i] }, group);
    drawCity(group, cities[i], colors);
    if (i === 4) drawRoads(group, colors);
    el('polygon', { points, fill: 'none', stroke: colors.outline, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-opacity': 0.9 }, outlineLayer);
  });
}
