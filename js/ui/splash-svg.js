// Small helpers for the opening screen: SVG elements, seeded random numbers, the six icons and colors.

const NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}

// Seeded random numbers: the map looks the same on every start.
export function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gradient(defs, tag, id, attrs, stops) {
  const node = el(tag, { id, ...attrs }, defs);
  for (const [offset, color, opacity = 1] of stops) el('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, node);
}

// Line icons on a 24 x 24 grid. Drawn with `glyph`, colored by the stroke of the <use> element.
const GLYPHS = {
  train:
    '<path d="M8 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M6 10h12"/><circle cx="9.5" cy="13" r=".6"/><circle cx="14.5" cy="13" r=".6"/><path d="M8.5 16l-2 4M15.5 16l2 4"/>',
  bus: '<path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v11.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M4.5 11h15"/><path d="M4.5 7.5h15"/><circle cx="8" cy="14.2" r=".6"/><circle cx="16" cy="14.2" r=".6"/><path d="M7 17.5v2.5M17 17.5v2.5"/>',
  car: '<path d="M4.5 16.5H4a1 1 0 0 1-1-1V13l2.2-5a1.5 1.5 0 0 1 1.4-1h10.8a1.5 1.5 0 0 1 1.4 1L21 13v2.5a1 1 0 0 1-1 1h-.5"/><path d="M3 13h18"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M9.5 16.5h5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M13 8.2l-1.6 5.8"/><path d="M11.4 14l3.1 3 .5 4"/><path d="M11.4 14l-2.6 3.6-1.8 2.6"/><path d="M13 9.4l3.2 2.4"/><path d="M13 9.4l-3.4 1.6"/>',
  restaurant: '<path d="M7 3v6a2 2 0 0 0 4 0V3"/><path d="M9 3v18"/><path d="M17 21V3c-2.2 1.2-3.2 4-3.2 8H17"/>',
  bar: '<path d="M5 4h14l-7 8.5z"/><path d="M12 12.5V20"/><path d="M8.5 20h7"/><path d="M7.6 6.8h8.8"/>',
};

export function addGlyphDefs(defs) {
  const markup = Object.entries(GLYPHS)
    .map(([name, body]) => `<g id="splash-g-${name}">${body}</g>`)
    .join('');
  defs.insertAdjacentHTML('beforeend', markup);
}

export function glyph(parent, name, x, y, scale, color, strokeWidth) {
  return el(
    'use',
    {
      href: `#splash-g-${name}`,
      fill: 'none',
      stroke: color,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      transform: `translate(${x} ${y}) scale(${scale})`,
    },
    parent,
  );
}

// All colors come from css/tokens.css.
export function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(`--${name}`).trim();
  const list = (prefix, count, from = 0) => Array.from({ length: count }, (_, i) => get(`${prefix}-${i + from}`));
  return {
    mint: get('mint'),
    blue: get('blue'),
    amber: get('orange'),
    dark: get('bg'),
    outline: get('map-outline'),
    park: get('map-park'),
    water: get('map-water'),
    shore: get('map-shore'),
    bridge: get('map-bridge'),
    road: get('map-road'),
    roadEdge: get('map-road-edge'),
    streetBlue: get('map-street-blue'),
    streetTeal: get('map-street-teal'),
    wedge: list('map-wedge', 6),
    blockBlue: list('map-blue', 4, 1),
    blockTeal: list('map-teal', 4, 1),
  };
}
