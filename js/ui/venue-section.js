// "Zaken in <gebied>": venues around the selected area, with filters. Follows the area that is
// selected in the fairness panel. Filtering is done on the device, so changing a filter is instant.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { loadingBlock } from './loading.js';
import { sourceBadge } from './source-badge.js';
import { findVenues, OfflineError, PROVIDER_NAME } from '../services/places.js';
import { onConnectivityChange } from '../services/connectivity.js';
import { filterVenues, sortVenues, openLabel, crowdLevel, VENUE_TYPES } from '../core/venues.js';

const FILTER_KEY = 'aether.venueFilters';
const SWITCHES = ['accessible', 'quiet', 'vegetarian'];
const NORMAL_RADIUS_KM = 10;
const WIDE_RADIUS_KM = 25;

function loadFilters() {
  try {
    return { types: [], accessible: false, quiet: false, vegetarian: false, ...JSON.parse(localStorage.getItem(FILTER_KEY)) };
  } catch {
    return { types: [], accessible: false, quiet: false, vegetarian: false };
  }
}

// when: Date of the appointment. Returns { show(area) }.
export function createVenueSection(container, { appointmentId, when }) {
  const filters = loadFilters();
  let area = null;
  let radius = NORMAL_RADIUS_KM;
  let state = { status: 'idle', venues: [], source: null };
  let requestId = 0;
  let timer = null;

  container.innerHTML = `
    <div class="section-head">
      <div><h2 data-title></h2><p class="muted small" data-source></p></div>
    </div>
    <div class="chips" data-types role="group" aria-label="${t.venues.typeFilter}"></div>
    <div class="filter-grid" data-switches></div>
    <div data-body aria-live="polite"></div>`;

  const body = container.querySelector('[data-body]');

  function saveFilters() {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch {
      // not remembered, that is fine
    }
  }

  function renderFilters() {
    const noneSelected = filters.types.length === 0;
    container.querySelector('[data-types]').innerHTML =
      `<button type="button" class="chip-btn" data-type="" aria-pressed="${noneSelected}">${t.venues.all}</button>` +
      VENUE_TYPES.map((type) => `<button type="button" class="chip-btn" data-type="${type}" aria-pressed="${filters.types.includes(type)}">${t.placeTypes[type]}</button>`).join('');

    container.querySelector('[data-switches]').innerHTML = SWITCHES.map(
      (name) => `
      <label class="toggle-row">
        <span>${t.venues.switches[name]}</span>
        <span class="toggle"><input type="checkbox" data-switch="${name}" ${filters[name] ? 'checked' : ''} /><span class="toggle-track"></span></span>
      </label>`,
    ).join('');
  }

  function renderBody() {
    container.querySelector('[data-title]').textContent = area ? t.venues.title(area.name) : '';
    container.querySelector('[data-source]').innerHTML = state.source ? sourceBadge(state.source, PROVIDER_NAME) : '';

    if (state.status === 'loading') {
      body.innerHTML = loadingBlock(t.loading.venues);
      return;
    }
    if (state.status === 'offline') {
      body.innerHTML = `
        <div class="empty-state">${icon('refresh')}<h2>${t.offline.noVenuesTitle}</h2><p class="muted">${t.offline.noVenues}</p>
        <button type="button" class="btn" data-retry>${t.common.retry}</button></div>`;
      return;
    }
    if (state.status !== 'ready') {
      body.innerHTML = '';
      return;
    }

    const shown = sortVenues(filterVenues(state.venues, filters), when);
    if (!shown.length) {
      body.innerHTML = `
        <div class="empty-state">${icon('search')}<h2>${t.venues.empty}</h2>
        <div class="hero-buttons">
          <button type="button" class="btn" data-clear>${t.venues.adjustFilters}</button>
          ${radius < WIDE_RADIUS_KM ? `<button type="button" class="btn btn-primary" data-wider>${t.venues.widerZone}</button>` : ''}
        </div></div>`;
      return;
    }
    body.innerHTML = `<p class="muted small section-gap">${t.venues.count(shown.length, state.venues.length)}</p><div class="venue-grid">${shown.map(venueCard).join('')}</div>`;
  }

  function venueCard(v) {
    const status = openLabel(v, when);
    const crowd = crowdLevel(v, when);
    const href = `#/plek/${encodeURIComponent(v.id)}${appointmentId ? `?afspraak=${appointmentId}` : ''}`;
    return `
      <a class="venue" href="${href}">
        <span class="venue-photo" style="--h1:${v.photos[0]};--h2:${v.photos[1]}">${icon(v.type)}</span>
        <span class="grow">
          <span class="venue-name">${esc(v.name)}</span>
          <span class="muted small venue-line">${esc(v.cuisine)} · ${'€'.repeat(v.price_level)} · ★ ${v.rating.toFixed(1)} (${v.review_count})</span>
          <span class="small venue-line level-${status.open ? 'good' : 'bad'}">${esc(status.open || status.text.includes('opent') ? status.text : t.venues.closedAt)}</span>
          <span class="muted small venue-line">${t.venues.crowd[crowd]} · ${v.distance_km} km</span>
        </span>
        ${icon('chevron')}
      </a>`;
  }

  async function load() {
    const mine = ++requestId;
    state = { ...state, status: 'loading' };
    renderBody();
    try {
      const { venues, source } = await findVenues({ lat: area.lat, lng: area.lng, radiusKm: radius });
      if (mine !== requestId) return; // a newer search started
      state = { status: 'ready', venues, source };
    } catch (error) {
      if (mine !== requestId) return;
      if (!(error instanceof OfflineError)) console.error(error);
      state = { status: 'offline', venues: [], source: null };
    }
    renderBody();
  }

  container.addEventListener('click', (event) => {
    const typeButton = event.target.closest('[data-type]');
    if (typeButton) {
      const type = typeButton.dataset.type;
      filters.types = type === '' ? [] : filters.types.includes(type) ? filters.types.filter((x) => x !== type) : [...filters.types, type];
      saveFilters();
      renderFilters();
      renderBody();
    }
    if (event.target.closest('[data-clear]')) {
      Object.assign(filters, { types: [], accessible: false, quiet: false, vegetarian: false });
      saveFilters();
      renderFilters();
      renderBody();
    }
    if (event.target.closest('[data-wider]')) {
      radius = WIDE_RADIUS_KM;
      load();
    }
    if (event.target.closest('[data-retry]')) load();
  });

  container.addEventListener('change', (event) => {
    const input = event.target.closest('[data-switch]');
    if (!input) return;
    filters[input.dataset.switch] = input.checked;
    saveFilters();
    renderBody();
  });

  // Going back online (or switching "Simuleer offline" off) retries a failed search.
  const stopListening = onConnectivityChange(() => {
    if (!container.isConnected) stopListening(); // the screen is gone
    else if (area && state.status === 'offline') load();
  });

  renderFilters();
  renderBody();

  return {
    // Called whenever another area is selected. Waits a moment so dragging the slider does not
    // trigger a search for every position.
    show(newArea) {
      if (area?.id === newArea.id) return;
      area = newArea;
      radius = NORMAL_RADIUS_KM;
      clearTimeout(timer);
      state = { ...state, status: 'loading' };
      renderBody();
      timer = setTimeout(load, 350);
    },
  };
}
