// Builds the opening screen scene and plays it: six wedges of city map, five icons that run out of their
// own wedge and come back in the bottom wedge, one icon (the walker) that is already there, and one meeting point.
// Every icon leaves a dash behind on its route, so a dashed line grows as it travels.

import { el, glyph, addGlyphDefs, gradient, readColors } from './splash-svg.js';
import { SCENE } from './splash-plan.js';
import { makeCities, drawWedges } from './splash-city.js';
import { planRoutes, T_ARRIVE } from './splash-routes.js';
import { drawPin, pickPins, drawPins } from './splash-pins.js';

const DASH = 8; // length of one dash
const PERIOD = 17; // dash plus gap
const T_END = T_ARRIVE + 1.5; // last ripple of the meeting point has faded

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const smoothstep = (p) => p * p * (3 - 2 * p);
const easeOutBack = (t) => {
  const x = clamp(t, 0, 1) - 1;
  return 1 + 2.9 * x ** 3 + 1.9 * x ** 2;
};

function addCore(layer, colors) {
  const { CX, CY, RING } = SCENE;
  el('circle', { cx: CX, cy: CY, r: RING, fill: 'url(#splash-core)' }, layer);
  el('circle', { cx: CX, cy: CY, r: RING, fill: 'none', stroke: colors.outline, 'stroke-opacity': 0.5, 'stroke-width': 3 }, layer);
  el('circle', { cx: 120, cy: CY, r: 62, fill: 'url(#splash-glow)' }, layer);
  el('rect', { x: 96, y: CY - 24, width: 48, height: 48, rx: 12, fill: 'url(#splash-logo)' }, layer);
  el('text', { class: 'splash-mark-letter', x: 120, y: CY + 11 }, layer).textContent = 'A';
  el('text', { class: 'splash-word', x: 156, y: CY + 14 }, layer).textContent = 'Aether';
}

// One piece of a route: the path to measure along and the dashes it will leave behind.
function prepareLeg(leg, measure, dashLayer, colors) {
  const path = el('path', { d: leg.d, fill: 'none', stroke: 'none' }, measure);
  const length = path.getTotalLength();
  const dashes = [];
  for (let s = 0; s < length - 2; s += PERIOD) {
    const from = path.getPointAtLength(s);
    const to = path.getPointAtLength(Math.min(length, s + DASH));
    const line = el(
      'line',
      { x1: from.x.toFixed(1), y1: from.y.toFixed(1), x2: from.x.toFixed(1), y2: from.y.toFixed(1), stroke: colors.mint, 'stroke-width': 2.2, 'stroke-linecap': 'round', visibility: 'hidden' },
      dashLayer,
    );
    dashes.push({ s, end: to, line, shown: -1 });
  }
  return { ...leg, path, length, dashes };
}

export function createScene(stage) {
  const colors = readColors();
  const { W, H } = SCENE;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' }, stage);
  const defs = el('defs', {}, svg);
  el('rect', { x: 0, y: 0, width: W, height: H }, el('clipPath', { id: 'splash-frame' }, defs));
  gradient(defs, 'linearGradient', 'splash-logo', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, colors.mint], [1, colors.blue]]);
  gradient(defs, 'radialGradient', 'splash-core', { cx: 0.5, cy: 0.5, r: 0.5 }, [[0, '#050d16', 0.9], [0.8, '#07131f', 0.78], [1, '#0a1a2a', 0.55]]);
  gradient(defs, 'radialGradient', 'splash-glow', { cx: 0.5, cy: 0.5, r: 0.5 }, [[0, colors.mint, 0.35], [1, colors.mint, 0]]);
  addGlyphDefs(defs);

  const root = el('g', { 'clip-path': 'url(#splash-frame)' }, svg);
  const layer = () => el('g', {}, root);
  const [wedgeLayer, outlineLayer, dashLayer, pinLayer, meetingLayer, badgeLayer, coreLayer, measure] = Array.from({ length: 8 }, layer);
  measure.setAttribute('visibility', 'hidden');

  const cities = makeCities();
  drawWedges({ defs, wedgeLayer, outlineLayer }, cities, colors);
  const { routes: plan, graphs, meeting } = planRoutes(cities);

  const routes = plan.map(({ icon, legs }) => {
    const badge = el('g', { visibility: 'hidden' }, badgeLayer);
    el('circle', { r: 15, fill: colors.mint, 'fill-opacity': 0.16 }, badge);
    el('circle', { r: 10.5, fill: 'url(#splash-logo)' }, badge);
    glyph(badge, icon, -6.24, -6.24, 0.52, colors.dark, 2.4);
    return { badge, legs: legs.map((leg) => prepareLeg(leg, measure, dashLayer, colors)) };
  });

  const samples = routes.flatMap((route) =>
    route.legs.flatMap((leg) => Array.from({ length: Math.floor(leg.length / 8) + 1 }, (_, k) => leg.path.getPointAtLength(k * 8)).map((p) => [p.x, p.y])),
  );
  drawPins(pinLayer, pickPins(graphs, samples, meeting), colors);

  const meetingPin = el('g', { transform: `translate(${meeting[0].toFixed(1)} ${meeting[1].toFixed(1)}) scale(0)` }, meetingLayer);
  drawPin(meetingPin, 'dot', colors);
  const ripples = [0, 1, 2].map(() =>
    el('circle', { cx: meeting[0], cy: meeting[1], r: 8, fill: 'none', stroke: colors.amber, 'stroke-width': 1.6, 'stroke-opacity': 0 }, meetingLayer),
  );

  addCore(coreLayer, colors);

  function renderLeg(leg, time) {
    const progress = clamp((time - leg.start) / leg.duration, 0, 1);
    const reached = (0.8 * progress + 0.2 * smoothstep(progress)) * leg.length;
    for (const dash of leg.dashes) {
      const shown = clamp(reached - dash.s, 0, DASH);
      if (shown === dash.shown) continue;
      dash.shown = shown;
      if (shown <= 0.01) {
        dash.line.setAttribute('visibility', 'hidden');
        continue;
      }
      const tip = shown >= DASH ? dash.end : leg.path.getPointAtLength(dash.s + shown);
      dash.line.setAttribute('x2', tip.x.toFixed(1));
      dash.line.setAttribute('y2', tip.y.toFixed(1));
      dash.line.setAttribute('visibility', 'visible');
    }
    return reached;
  }

  function render(time) {
    const since = time - T_ARRIVE;
    for (const route of routes) {
      let active = null;
      let reached = 0;
      for (const leg of route.legs) {
        const at = renderLeg(leg, time);
        if (time >= leg.start && time <= leg.start + leg.duration) {
          active = leg;
          reached = at;
        }
      }
      const first = route.legs[0];
      let scale = 0;
      if (active) {
        scale = active === first ? easeOutBack((time - first.start) / 0.3) : 1;
        scale = Math.min(scale, 1.2);
      } else if (since >= 0 && since < 0.35) {
        active = route.legs[route.legs.length - 1];
        reached = active.length;
        scale = 1 - since / 0.35;
      }
      if (active && scale > 0.01) {
        const p = active.path.getPointAtLength(reached);
        route.badge.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${scale.toFixed(3)})`);
        route.badge.setAttribute('visibility', 'visible');
      } else {
        route.badge.setAttribute('visibility', 'hidden');
      }
    }
    const pop = easeOutBack((since + 0.1) / 0.5) * 1.5;
    meetingPin.setAttribute('transform', `translate(${meeting[0].toFixed(1)} ${meeting[1].toFixed(1)}) scale(${Math.max(0, pop).toFixed(3)})`);
    ripples.forEach((ripple, k) => {
      const q = clamp((since - k * 0.22) / 0.9, 0, 1);
      ripple.setAttribute('r', (8 + 46 * q).toFixed(1));
      ripple.setAttribute('stroke-opacity', q > 0 && q < 1 ? ((1 - q) * 0.7).toFixed(2) : 0);
    });
  }

  let frame = 0;
  render(-1);
  return {
    play() {
      const start = performance.now();
      const tick = (now) => {
        const time = (now - start) / 1000;
        render(time);
        if (time < T_END) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    showFinal: () => render(T_END),
    stop: () => cancelAnimationFrame(frame),
  };
}
