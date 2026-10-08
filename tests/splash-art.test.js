import { describe, it, expect } from 'vitest';
import { PIECES, drawPiece, random, smoothClosed } from '../js/ui/splash-art.js';

describe('splash artwork', () => {
  it('has four different backdrops', () => {
    expect(PIECES).toHaveLength(4);
    expect(new Set(PIECES.map((p) => p.kind)).size).toBe(4);
  });

  it('draws the same picture every time (fixed seed)', () => {
    PIECES.forEach((piece, i) => expect(drawPiece(piece, i, 800, 600)).toBe(drawPiece(piece, i, 800, 600)));
    expect(drawPiece(PIECES[0], 0, 800, 600)).not.toBe(drawPiece(PIECES[1], 0, 800, 600));
  });

  it('draws real shapes with finite numbers, without labels or images', () => {
    for (const [i, piece] of PIECES.entries()) {
      const svg = drawPiece(piece, i, 1360, 900);
      expect(svg).toMatch(/<(path|circle|line)/);
      expect(svg).not.toMatch(/NaN|Infinity|<text|<image/);
    }
  });

  it('gives repeatable random numbers between 0 and 1', () => {
    const a = random(5);
    const b = random(5);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('closes a smooth curve', () => {
    const d = smoothClosed([[0, 0], [10, 0], [10, 10]]);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});
