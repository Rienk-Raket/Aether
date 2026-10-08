// Geometry for the opening screen: six wedges around the logo, a grid of city streets in some of
// them, and a planner that finds routes along those streets. Pure functions (no DOM), so they are tested.

export const SCENE = { W: 390, H: 844, CX: 195, CY: 422, RING: 112, GAP: 5 };
const { CX, CY, GAP } = SCENE;
const rad = (degrees) => (degrees * Math.PI) / 180;

// Wedge i points to angle -90 + 60 * i (0 = up, then clockwise). GAP pushes each one slightly outward.
export const WEDGES = Array.from({ length: 6 }, (_, i) => {
  const angle = -90 + 60 * i;
  const u = [Math.cos(rad(angle)), Math.sin(rad(angle))];
  return {
    ax: CX + u[0] * GAP,
    ay: CY + u[1] * GAP,
    u,
    dlo: [Math.cos(rad(angle - 30)), Math.sin(rad(angle - 30))],
    dhi: [Math.cos(rad(angle + 30)), Math.sin(rad(angle + 30))],
  };
});

// Is the point inside wedge i, at least `margin` away from both edges? (A negative margin is looser.)
export function insideWedge(i, x, y, margin) {
  const w = WEDGES[i];
  const dx = x - w.ax;
  const dy = y - w.ay;
  const fromLow = w.dlo[0] * dy - w.dlo[1] * dx;
  const fromHigh = dx * w.dhi[1] - dy * w.dhi[0];
  return fromLow >= margin && fromHigh >= margin && dx * w.u[0] + dy * w.u[1] > 0;
}

export function outsideView([x, y]) {
  return x < -12 || x > SCENE.W + 12 || y < -12 || y > SCENE.H + 12;
}

// A city is a grid of house blocks, turned by `rot` degrees. Streets run between the blocks:
// street u (or v) lies half a cell after block u. `abs` turns grid coordinates into screen coordinates.
export function makeCity(i, cfg) {
  const cos = Math.cos(rad(cfg.rot));
  const sin = Math.sin(rad(cfg.rot));
  const turn = (x, y) => [cfg.cx + x * cos - y * sin, cfg.cy + x * sin + y * cos];
  return {
    i,
    cfg,
    abs: (u, v) => turn((u + 0.5) * cfg.cell, (v + 0.5) * cfg.cell),
    cell: (a, b) => turn(a * cfg.cell, b * cfg.cell),
    // Back from screen to grid coordinates (used by the tests).
    local: (x, y) => {
      const dx = x - cfg.cx;
      const dy = y - cfg.cy;
      return [(dx * cos + dy * sin) / cfg.cell, (dy * cos - dx * sin) / cfg.cell];
    },
  };
}

// Street crossings that lie inside the city's wedge, away from its edges and from the logo ring.
export function buildGraph(city) {
  const n = city.cfg.n;
  const nodes = new Map();
  for (let u = -n - 1; u <= n; u++) {
    for (let v = -n - 1; v <= n; v++) {
      const p = city.abs(u, v);
      if (insideWedge(city.i, p[0], p[1], 14) && Math.hypot(p[0] - CX, p[1] - CY) >= 40) nodes.set(`${u},${v}`, { u, v, p });
    }
  }
  return nodes;
}

export function nearest(nodes, x, y, outsideOnly = false) {
  let best = null;
  let bestDistance = Infinity;
  for (const node of nodes.values()) {
    if (outsideOnly && !outsideView(node.p)) continue;
    const distance = Math.hypot(node.p[0] - x, node.p[1] - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  }
  return best;
}

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

// Shortest way over the streets from one crossing to another. Every step costs 1, a turn costs `turnCost`
// extra, so routes prefer long straight streets. A canal row (cfg.vc) can only be crossed, not followed.
export function dijkstra(city, nodes, from, to, turnCost = 1.5) {
  const canal = city.cfg.vc;
  const key = (u, v, d) => `${u},${v},${d}`;
  const cost = new Map([[key(from.u, from.v, -1), 0]]);
  const previous = new Map();
  const open = [{ u: from.u, v: from.v, d: -1, c: 0 }];
  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].c < open[best].c) best = k;
    const cur = open.splice(best, 1)[0];
    const curKey = key(cur.u, cur.v, cur.d);
    if (cur.c > cost.get(curKey)) continue;
    if (cur.u === to.u && cur.v === to.v) {
      const path = [];
      for (let k = curKey; k !== undefined; k = previous.get(k)) {
        const [u, v] = k.split(',');
        path.push(nodes.get(`${u},${v}`));
      }
      return path.reverse();
    }
    DIRECTIONS.forEach(([du, dv], d) => {
      const u = cur.u + du;
      const v = cur.v + dv;
      if (!nodes.has(`${u},${v}`)) return;
      if (canal !== undefined && v === canal && cur.v === canal) return;
      const next = cur.c + 1 + (cur.d >= 0 && cur.d !== d ? turnCost : 0);
      const nextKey = key(u, v, d);
      if (!cost.has(nextKey) || next < cost.get(nextKey)) {
        cost.set(nextKey, next);
        previous.set(nextKey, curKey);
        open.push({ u, v, d, c: next });
      }
    });
  }
  return null;
}

// Waypoints: [x, y] = nearest crossing, { out: [x, y] } = nearest crossing outside the screen,
// { node: [u, v] } = a fixed crossing. Returns the corner points of the route in screen coordinates.
export function planRoute(city, nodes, waypoints) {
  const stops = waypoints
    .map((wp) => {
      if (wp.node) return nodes.get(`${wp.node[0]},${wp.node[1]}`);
      if (wp.out) return nearest(nodes, wp.out[0], wp.out[1], true);
      return nearest(nodes, wp[0], wp[1]);
    })
    .filter(Boolean);
  let list = [];
  for (let k = 0; k < stops.length - 1; k++) {
    let part = dijkstra(city, nodes, stops[k], stops[k + 1]) || [stops[k], stops[k + 1]];
    if (list.length) part = part.slice(1);
    list = list.concat(part);
  }
  const corners = [list[0].p];
  for (let q = 1; q < list.length - 1; q++) {
    const [a, b, c] = [list[q - 1], list[q], list[q + 1]];
    if (b.u - a.u !== c.u - b.u || b.v - a.v !== c.v - b.v) corners.push(b.p);
  }
  corners.push(list[list.length - 1].p);
  return corners;
}

const fixed = (n) => n.toFixed(1);

// Straight pieces with rounded corners: the icon follows the street and turns smoothly.
export function rounded(points, radius) {
  let d = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [p0, p1, p2] = [points[i - 1], points[i], points[i + 1]];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const a = [p1[0] + ((p0[0] - p1[0]) * r) / l1, p1[1] + ((p0[1] - p1[1]) * r) / l1];
    const b = [p1[0] + ((p2[0] - p1[0]) * r) / l2, p1[1] + ((p2[1] - p1[1]) * r) / l2];
    d += `L${fixed(a[0])} ${fixed(a[1])}Q${fixed(p1[0])} ${fixed(p1[1])} ${fixed(b[0])} ${fixed(b[1])}`;
  }
  const end = points[points.length - 1];
  return `${d}L${fixed(end[0])} ${fixed(end[1])}`;
}

// A smooth curve through all points (used for winding roads).
export function smooth(points) {
  let d = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fixed(c1[0])} ${fixed(c1[1])},${fixed(c2[0])} ${fixed(c2[1])},${fixed(p2[0])} ${fixed(p2[1])}`;
  }
  return d;
}

// The winding roads in the lower-left wedge: horizontal-ish, ending at the left edge of the screen.
export const ROAD_Y = [455, 515, 575, 640];
export function roadPoints(y, index) {
  const points = [];
  for (let x = 200; x >= -24; x -= 16) points.push([x, y + 12 * Math.sin(x / 42 + index)]);
  return points;
}
