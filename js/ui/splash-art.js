// Own artwork for the opening screen: four abstract "map-like" backdrops (contour lines, city
// blocks, rings and flowing lanes). Drawn from a fixed seed, so it is always the same, works
// offline and is not a real map: no names, no pins, no real streets.

const PALETTE = { mint: '#9df0cf', blue: '#88b9ff', orange: '#ffbd72' };

// Backdrops in the order top, right, bottom, left. `from` and `to` colour the base gradient.
export const PIECES = [
  { kind: 'contours', from: '#0e3644', to: '#0a2230', seed: 11 },
  { kind: 'blocks', from: '#16254a', to: '#0c1a31', seed: 23 },
  { kind: 'rings', from: '#0c3434', to: '#0a2128', seed: 37 },
  { kind: 'lanes', from: '#112c52', to: '#0b1c34', seed: 41 },
];

// Small seeded random generator (mulberry32): same seed, same picture.
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

// Smooth closed curve through points (quadratic curves between the midpoints).
export function smoothClosed(points) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = points.length;
  let d = `M${f(mid(points[n - 1], points[0])[0])} ${f(mid(points[n - 1], points[0])[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(points[i], points[(i + 1) % n]);
    d += ` Q${f(points[i][0])} ${f(points[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d}Z`;
}

function contours(w, h, rnd) {
  const size = Math.max(w, h);
  let out = '';
  for (let c = 0; c < 2; c++) {
    const cx = w * (0.25 + rnd() * 0.5);
    const cy = h * (0.25 + rnd() * 0.5);
    const phase = [rnd() * 6, rnd() * 6, rnd() * 6];
    for (let k = 12; k >= 1; k--) {
      const r = k * size * 0.04;
      const ring = Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        const wobble = 1 + 0.16 * Math.sin(3 * a + phase[0] + k * 0.13) + 0.09 * Math.sin(5 * a + phase[1]) + 0.04 * Math.sin(7 * a + phase[2]);
        return [cx + Math.cos(a) * r * wobble, cy + Math.sin(a) * r * wobble];
      });
      const fill = k === 12 ? `fill="${PALETTE.mint}" fill-opacity="0.05"` : k % 4 === 0 ? `fill="${PALETTE.blue}" fill-opacity="0.04"` : 'fill="none"';
      out += `<path d="${smoothClosed(ring)}" ${fill} stroke="${PALETTE.mint}" stroke-opacity="${f(0.55 - k * 0.03)}" stroke-width="${k % 4 === 0 ? 1.8 : 0.9}"/>`;
    }
  }
  return out;
}

function blocks(w, h, rnd) {
  const cell = Math.max(w, h) / 11;
  const tints = ['#1a3a63', '#173257', '#1e4670', '#12294a', '#204d63'];
  let out = '';
  for (let y = -1; y < h / cell + 1; y++) {
    for (let x = -1; x < w / cell + 1; x++) {
      if (rnd() < 0.14) continue; // gaps = squares and parks
      const j = () => (rnd() - 0.5) * cell * 0.22;
      const g = cell * 0.07;
      const p = [[x * cell + g + j(), y * cell + g + j()], [(x + 1) * cell - g + j(), y * cell + g + j()], [(x + 1) * cell - g + j(), (y + 1) * cell - g + j()], [x * cell + g + j(), (y + 1) * cell - g + j()]];
      const fill = tints[Math.floor(rnd() * tints.length)];
      out += `<path d="M${p.map((q) => `${f(q[0])} ${f(q[1])}`).join(' L')}Z" fill="${fill}" stroke="${fill}" stroke-width="${f(cell * 0.12)}" stroke-linejoin="round"/>`;
    }
  }
  const avenue = `M${f(-cell)} ${f(h * (0.2 + rnd() * 0.2))} C${f(w * 0.3)} ${f(h * 0.9)} ${f(w * 0.6)} ${f(-h * 0.1)} ${f(w + cell)} ${f(h * (0.6 + rnd() * 0.3))}`;
  return `${out}<path d="${avenue}" fill="none" stroke="#2c6f8c" stroke-opacity="0.55" stroke-width="${f(cell * 0.14)}" stroke-linecap="round"/><path d="${avenue}" fill="none" stroke="${PALETTE.mint}" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="10 12"/>`;
}

function rings(w, h, rnd) {
  const size = Math.max(w, h);
  const cx = w * (0.3 + rnd() * 0.4);
  const cy = h * 1.12;
  let out = '';
  for (let k = 1; k <= 16; k++) {
    const r = k * size * 0.055;
    const dash = k % 3 === 0 ? ' stroke-dasharray="3 9"' : '';
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${PALETTE.blue}" stroke-opacity="${f(0.5 - k * 0.02)}" stroke-width="${k % 4 === 0 ? 2.2 : 1}"${dash}/>`;
  }
  for (let s = 0; s < 22; s++) {
    const a = Math.PI + (s / 21) * Math.PI;
    out += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx + Math.cos(a) * size * 1.4)}" y2="${f(cy + Math.sin(a) * size * 1.4)}" stroke="${PALETTE.mint}" stroke-opacity="0.16" stroke-width="1"/>`;
  }
  return `${out}<circle cx="${f(cx)}" cy="${f(cy - size * 0.33)}" r="${f(size * 0.05)}" fill="${PALETTE.orange}" fill-opacity="0.12"/>`;
}

function lanes(w, h, rnd) {
  const amp = h * 0.07;
  let out = '';
  for (let i = 0; i < 11; i++) {
    const y = (i / 10) * h * 1.2 - h * 0.1;
    const phase = rnd() * 3 + i * 0.35;
    const pts = Array.from({ length: 14 }, (_, k) => `${f((k / 13) * (w + 80) - 40)} ${f(y + Math.sin(k * 0.9 + phase) * amp)}`);
    const d = `M${pts[0]} ${pts.slice(1).map((p) => `T${p}`).join(' ')}`;
    out += `<path d="${d}" fill="none" stroke="#1d4a73" stroke-opacity="0.8" stroke-width="${i % 3 === 0 ? 16 : 7}" stroke-linecap="round"/>`;
    out += `<path d="${d}" fill="none" stroke="${i % 5 === 2 ? PALETTE.orange : PALETTE.mint}" stroke-opacity="${i % 5 === 2 ? 0.4 : 0.32}" stroke-width="1.2" stroke-dasharray="${i % 2 ? '2 10' : '14 9'}"/>`;
  }
  return out;
}

const DRAW = { contours, blocks, rings, lanes };

// One backdrop covering a whole w × h screen (the triangle clips what is visible).
export function drawPiece(piece, index, w, h) {
  const rnd = random(piece.seed);
  return `
    <defs><linearGradient id="splash-grad-${index}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${piece.from}"/><stop offset="1" stop-color="${piece.to}"/></linearGradient></defs>
    <rect x="-100" y="-100" width="${w + 200}" height="${h + 200}" fill="url(#splash-grad-${index})"/>
    ${DRAW[piece.kind](w, h, rnd)}`;
}
