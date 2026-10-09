import { describe, it, expect } from 'vitest';
import { insideWedge, WEDGES, SCENE, buildGraph, planRoute, rounded } from '../js/ui/splash-plan.js';
import { makeCities } from '../js/ui/splash-city.js';
import { planRoutes } from '../js/ui/splash-routes.js';

describe('insideWedge', () => {
  it('accepts points on the bisector and rejects the opposite side', () => {
    WEDGES.forEach((w, i) => {
      const far = [SCENE.CX + w.u[0] * 200, SCENE.CY + w.u[1] * 200];
      const back = [SCENE.CX - w.u[0] * 200, SCENE.CY - w.u[1] * 200];
      expect(insideWedge(i, far[0], far[1], 10)).toBe(true);
      expect(insideWedge(i, back[0], back[1], 0)).toBe(false);
    });
  });
});

describe('rounded', () => {
  it('ends at the last point and rounds corners with a curve', () => {
    const d = rounded([[0, 0], [100, 0], [100, 100]], 9);
    expect(d).toContain('Q');
    expect(d.endsWith('L100.0 100.0')).toBe(true);
  });
});

describe('planRoute', () => {
  const cities = makeCities();

  it('only turns at street crossings (axis-aligned in grid coordinates)', () => {
    const city = cities[0];
    const points = planRoute(city, buildGraph(city), [[195, 322], [150, 150]]);
    for (const [x, y] of points) {
      const [u, v] = city.local(x, y);
      expect(Math.abs(u - 0.5 - Math.round(u - 0.5))).toBeLessThan(1e-6);
      expect(Math.abs(v - 0.5 - Math.round(v - 0.5))).toBeLessThan(1e-6);
    }
  });

  it('every route has legs and all end on the meeting point', () => {
    const { routes, meeting } = planRoutes(cities);
    expect(routes).toHaveLength(6);
    for (const route of routes) {
      const last = route.legs[route.legs.length - 1].d;
        const [x, y] = last.match(/(-?\d+\.\d) (-?\d+\.\d)$/).slice(1).map(Number);
        expect(Math.hypot(x - meeting[0], y - meeting[1])).toBeLessThan(0.2);

    }
  });

  it('never follows the canal row of the bottom city', () => {
    const city = cities[3];
    const nodes = buildGraph(city);
    const points = planRoute(city, nodes, [[240, 735], [128, 705]]);
    for (let k = 1; k < points.length; k++) {
      const [, v1] = city.local(...points[k - 1]);
      const [, v2] = city.local(...points[k]);
      const along = Math.abs(v1 - v2) < 1e-6;
      if (along) expect(Math.round(v1 - 0.5)).not.toBe(city.cfg.vc);
    }
  });
});
