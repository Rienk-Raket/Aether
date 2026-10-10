// The fictional map of the Netherlands: outline, lakes, city names and one pin per location.
// Zoom with the buttons or the wheel, drag to move. Pins that lie close together are shown as
// one numbered circle (see core/map-cluster.js); zooming in separates them.

import { t } from '../i18n/nl.js';
import { esc } from './dom.js';
import { icon } from './icons.js';
import { MAP_WIDTH, MAP_HEIGHT, MAINLAND, LAKES, ISLANDS, LABELLED, project, toPolygon } from '../core/nl-outline.js';
import { clusterPoints, boundsOf } from '../core/map-cluster.js';

const MIN_ZOOM = 1;
const MAX_ZOOM = 40;
const CLUSTER_PX = 26; // pins closer than this (on screen) are grouped
const PIN = 'M0 0C-2.5-6-8-9.5-8-15a8 8 0 1 1 16 0C8-9.5 2.5-6 0 0Z';

// places: [{ id, name, lat, lng }] for the city names
export function createNlMap(container, { places, onSelect }) {
  container.innerHTML = `
    <svg class="nl-map" role="group" aria-label="${t.landmap.mapLabel}" tabindex="-1"></svg>
    <div class="nl-map-tools">
      <button type="button" class="icon-btn" data-zoom="in" aria-label="${t.landmap.zoomIn}">${icon('plus')}</button>
      <button type="button" class="icon-btn" data-zoom="out" aria-label="${t.landmap.zoomOut}"><span aria-hidden="true">−</span></button>
      <button type="button" class="icon-btn" data-zoom="reset" aria-label="${t.landmap.zoomReset}">${icon('locate')}</button>
    </div>`;
  const svg = container.querySelector('svg');
  const labels = LABELLED.map((id) => places.find((p) => p.id === id)).filter(Boolean).map((p) => ({ name: p.name, ...project(p) }));

  let points = []; // [{ id, type, name, x, y }]
  let selectedId = null;
  let view = { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT };
  let frame = 0;

  const size = () => {
    const rect = svg.getBoundingClientRect();
    return { width: rect.width || 600, height: rect.height || 660 };
  };
  const zoomLevel = () => MAP_WIDTH / view.w;
  const apply = () => svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);

  // Show the whole country in the current shape of the screen.
  function fit() {
    const { width, height } = size();
    const ratio = width / height;
    view.w = Math.max(MAP_WIDTH, MAP_HEIGHT * ratio);
    view.h = view.w / ratio;
    view.x = (MAP_WIDTH - view.w) / 2;
    view.y = (MAP_HEIGHT - view.h) / 2;
    apply();
  }

  function clamp() {
    view.x = Math.min(Math.max(view.x, -view.w * 0.15), MAP_WIDTH - view.w * 0.85);
    view.y = Math.min(Math.max(view.y, -view.h * 0.15), MAP_HEIGHT - view.h * 0.85);
  }

  function zoomAt(factor, cx = view.x + view.w / 2, cy = view.y + view.h / 2) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel() * factor));
    const w = MAP_WIDTH / next;
    const scale = w / view.w;
    view.x = cx - (cx - view.x) * scale;
    view.y = cy - (cy - view.y) * scale;
    view.h *= scale;
    view.w = w;
    if (next === MIN_ZOOM) fit();
    clamp();
    apply();
    schedule();
  }

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  };

  function draw() {
    const unit = view.w / size().width; // map units per screen pixel
    const visible = points.filter((p) => p.x > view.x - 40 * unit && p.x < view.x + view.w + 40 * unit && p.y > view.y - 40 * unit && p.y < view.y + view.h + 40 * unit);
    const groups = clusterPoints(visible, CLUSTER_PX * unit);
    const few = groups.length <= 70;

    const land = `<polygon class="nl-land" points="${toPolygon(MAINLAND)}"/>${ISLANDS.map((i) => `<polygon class="nl-land" points="${toPolygon(i)}"/>`).join('')}${LAKES.map((l) => `<polygon class="nl-lake" points="${toPolygon(l)}"/>`).join('')}`;
    const names = labels.map((l) => `<text class="nl-label" x="${l.x + 7 * unit}" y="${l.y + 3 * unit}" style="font-size:${11 * unit}px">${esc(l.name)}</text>`).join('');
    const pins = groups
      .map((g) => {
        if (g.items.length > 1) {
          const r = (13 + Math.min(8, Math.log2(g.items.length) * 2)) * unit;
          return `<g class="nl-cluster" data-cluster="${g.items.map((i) => i.id).join(',')}" role="button" tabindex="${few ? 0 : -1}" aria-label="${t.landmap.cluster(g.items.length)}">
            <circle cx="${g.x}" cy="${g.y}" r="${r}"/><text x="${g.x}" y="${g.y + 4 * unit}" style="font-size:${12 * unit}px">${g.items.length}</text></g>`;
        }
        const p = g.items[0];
        const on = p.id === selectedId;
        return `<g class="nl-pin ${p.type} ${on ? 'selected' : ''}" data-id="${esc(p.id)}" role="button" tabindex="${few ? 0 : -1}" aria-label="${esc(t.landmap.pin(p.name, t.placeTypes[p.type]))}" transform="translate(${p.x} ${p.y}) scale(${(on ? 1.35 : 1) * unit})">
          ${on ? '<circle class="halo" cx="0" cy="-15" r="14"/>' : ''}<path d="${PIN}"/><circle class="hole" cx="0" cy="-15" r="3"/></g>`;
      })
      .join('');
    svg.innerHTML = `<rect class="nl-sea" x="${view.x - view.w}" y="${view.y - view.h}" width="${view.w * 3}" height="${view.h * 3}"/>${land}${names}${pins}`;
  }

  // ---- Pointer: drag to move, tap to select ----
  let drag = null;
  svg.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY, moved: 0 };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const unit = view.w / size().width;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    view.x -= dx * unit;
    view.y -= dy * unit;
    clamp();
    apply();
  });
  svg.addEventListener('pointercancel', () => (drag = null));
  svg.addEventListener('pointerup', (event) => {
    const tapped = drag && drag.moved < 6;
    drag = null;
    if (!tapped) return schedule();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-id], [data-cluster]');
    if (target) activate(target);
  });
  svg.addEventListener('keydown', (event) => {
    const target = event.target.closest?.('[data-id], [data-cluster]');
    if (target && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      activate(target);
    }
  });

  function activate(target) {
    if (target.dataset.id) return onSelect(target.dataset.id);
    const ids = new Set(target.dataset.cluster.split(','));
    const box = boundsOf(points.filter((p) => ids.has(p.id)), 14);
    const ratio = size().width / size().height;
    const w = Math.max(box.width, box.height * ratio, MAP_WIDTH / MAX_ZOOM);
    view = { w, h: w / ratio, x: box.x + box.width / 2 - w / 2, y: box.y + box.height / 2 - w / ratio / 2 };
    clamp();
    apply();
    schedule();
  }

  // The page must not scroll while the visitor moves around in the map: the wheel zooms.
  svg.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = view.x + ((event.clientX - rect.left) / rect.width) * view.w;
      const cy = view.y + ((event.clientY - rect.top) / rect.height) * view.h;
      zoomAt(event.deltaY < 0 ? 1.25 : 0.8, cx, cy);
    },
    { passive: false },
  );
  container.querySelectorAll('[data-zoom]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (btn.dataset.zoom === 'reset') {
        fit();
        schedule();
      } else zoomAt(btn.dataset.zoom === 'in' ? 1.6 : 0.625);
    }),
  );

  const observer = new ResizeObserver(() => {
    if (zoomLevel() <= MIN_ZOOM + 0.001) fit();
    schedule();
  });
  observer.observe(svg);
  fit();

  return {
    // Zoom in on one venue (used by the search results).
    focus(venue, zoom = 14) {
      const p = project(venue);
      const w = MAP_WIDTH / zoom;
      const ratio = size().width / size().height;
      view = { w, h: w / ratio, x: p.x - w / 2, y: p.y - w / ratio / 2 };
      clamp();
      apply();
      schedule();
    },
    // venues: venues to show; selected: id or null
    update(venues, selected = null) {
      selectedId = selected;
      points = venues.map((v) => ({ id: v.id, type: v.type, name: v.name, ...project(v) }));
      schedule();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
  };
}
