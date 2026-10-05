// The map of the fairness panel: the flat 2D map, or (on the full results screen) the 3D orb.
// The orb is loaded only when it is wanted, and the 2D map is the fallback when WebGL is missing
// or fails. The choice is remembered on this device.

import { t } from '../i18n/nl.js';
import { renderMap2d } from './map2d.js';

const KEY = 'aether.view3d';

const wants3d = () => {
  try {
    return localStorage.getItem(KEY) !== '0'; // on by default
  } catch {
    return true;
  }
};

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');

// participants: [{ id, name, location }]; candidates: ALL candidates with `times` (fixes the orb layout)
// orbAllowed: false keeps the plain 2D map (used on the compact overview)
export function createMapView(container, { participants, candidates, orbAllowed }) {
  container.innerHTML = orbAllowed
    ? `<div class="map-tools"><button type="button" class="chip-btn" data-toggle3d aria-pressed="false">${t.orb.toggle}</button></div>
       <div data-view2d></div>
       <div class="orb-wrap" data-view3d hidden></div>
       <p class="muted small" data-note></p>`
    : '<div data-view2d></div>';

  const el2d = container.querySelector('[data-view2d]');
  const el3d = container.querySelector('[data-view3d]');
  const toggle = container.querySelector('[data-toggle3d]');
  const note = container.querySelector('[data-note]');

  let want3d = orbAllowed && wants3d();
  let orb = null;
  let failed = false;
  let loading = false;
  let last = null;

  function show() {
    const useOrb = Boolean(orb) && want3d;
    el2d.hidden = useOrb;
    if (el3d) el3d.hidden = !useOrb;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(want3d && !failed));
      toggle.disabled = failed;
    }
    if (note) note.textContent = failed ? t.orb.fallback : useOrb ? t.orb.hint : '';
  }

  async function ensureOrb() {
    if (orb || failed || loading) return;
    loading = true;
    try {
      const { createOrb } = await import('../three/orb.js');
      orb = createOrb(el3d, { participants, candidates }, { reducedMotion: reducedMotion(), onSelect: (id) => last?.onSelect?.(id) });
    } catch (error) {
      console.warn('3D orb unavailable, using the 2D map', error);
      failed = true;
    }
    loading = false;
    show();
    if (last) render(last);
  }

  function render(args) {
    last = args;
    if (orb && want3d) {
      const selected = args.candidates.find((c) => c.id === args.selectedId) ?? args.candidates[0];
      orb.update({
        candidates: args.candidates,
        selectedId: selected?.id,
        label: selected ? t.orb.caption(selected.name, Math.round(selected.stats.mean), Math.round(selected.fairness * 100)) : '',
        description: selected ? t.orb.alt(selected.name) : '',
      });
    }
    // The flat map is always kept up to date: it is the fallback and the quick switch.
    renderMap2d(el2d, { participants, ...args });
  }

  toggle?.addEventListener('click', () => {
    want3d = !want3d;
    try {
      localStorage.setItem(KEY, want3d ? '1' : '0');
    } catch {
      // not remembered, that is fine
    }
    if (want3d) ensureOrb();
    show();
    if (last) render(last);
  });

  if (want3d) ensureOrb();
  show();

  return { render };
}
