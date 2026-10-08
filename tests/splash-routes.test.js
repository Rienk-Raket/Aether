import { describe, it, expect } from 'vitest';
import { buildRoutes, buildTriangles, boundingBox, toPath, toPoints } from '../js/ui/splash-routes.js';

describe('splash routes', () => {
  const W = 1360;
  const H = 900;
  const routes = buildRoutes(W, H);

  it('has four routes that start outside the screen and all end in the centre', () => {
    expect(routes).toHaveLength(4);
    for (const route of routes) {
      const [x, y] = route[0];
      expect(x < 0 || x > W).toBe(true);
      expect(y < 0 || y > H).toBe(true);
      expect(route.at(-1)).toEqual([W / 2, H / 2]);
    }
  });

  it('starts at four different corners (top left, top right, bottom right, bottom left)', () => {
    expect(routes.map((r) => [Math.sign(r[0][0] - W / 2), Math.sign(r[0][1] - H / 2)])).toEqual([[-1, -1], [1, -1], [1, 1], [-1, 1]]);
  });

  it('bends the routes so they are not straight lines', () => {
    for (const route of routes) {
      const [start, , , , end] = [route[0], ...route.slice(1, 4), route.at(-1)];
      const mid = route[2];
      const cross = (mid[0] - start[0]) * (end[1] - start[1]) - (mid[1] - start[1]) * (end[0] - start[0]);
      expect(Math.abs(cross)).toBeGreaterThan(1000);
    }
  });

  it('builds four triangles that follow the routes', () => {
    const triangles = buildTriangles(routes);
    expect(triangles).toHaveLength(4);
    triangles.forEach((triangle, i) => {
      expect(triangle[0]).toEqual(routes[i][0]);
      expect(triangle).toContainEqual(routes[(i + 1) % 4][0]);
      expect(triangle.filter((p) => p[0] === W / 2 && p[1] === H / 2)).toHaveLength(1);
    });
    // top triangle lies above the centre, bottom triangle below it
    expect(boundingBox(triangles[0]).y).toBeLessThan(0);
    expect(boundingBox(triangles[2]).y + boundingBox(triangles[2]).height).toBeGreaterThan(H);
  });

  it('turns points into text for SVG', () => {
    expect(toPoints([[1, 2], [3, 4]])).toBe('1,2 3,4');
    expect(toPath([[1, 2], [3, 4]])).toBe('M1 2 L3 4');
  });

  it('works on a phone in portrait', () => {
    expect(buildRoutes(390, 844).every((r) => r.at(-1)[0] === 195 && r.at(-1)[1] === 422)).toBe(true);
  });
});
