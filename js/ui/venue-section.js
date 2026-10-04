// "Zaken in <gebied>": the venues around the selected area, on a map and in a list.
// Only venues that pass the user's wishes ("Aanbod & wensen") are shown; the kind-of-business
// chips here are just a temporary view filter. Everything is filtered on the device.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { loadingBlock } from './loading.js';
import { sourceBadge } from './source-badge.js';
import { renderVenueMap } from './venue-map.js';
import { openVenueCard } from './venue-card.js';
import { findVenues, OfflineError, PROVIDER_NAME } from '../services/places.js';
import { onConnectivityChange } from '../services/connectivity.js';
import { getPrefs } from '../data/offer.js';
import { filterByPrefs, wishCount } from '../core/offer.js';
import { filterVenues, sortVenues, openLabel, crowdLevel, formatPriceRange, VENUE_TYPES } from '../core/venues.js';

const TYPE_FILTER_KEY = 'aether.venueTypes';
const NORMAL_RADIUS_KM = 10;
const WIDE_RADIUS_KM = 25;

function loadTypes() {
  try {
    const saved = JSON.parse(localStorage.getItem(TYPE_FILTER_KEY));
    return Array.isArray(saved) ? saved.filter((type) => VENUE_TYPES.includes(type)) : [];
  } catch {
    return [];
  }
}

// appointment: the appointment object (to choose a venue for it). when: Date of the appointment.
// onCount(n): called with the number of venues shown. onChosen(): a venue was chosen.
// Returns { show(area) }.
export function createVenueSection(container, { appointment, when, onCount, onChosen }) {
  let types = loadTypes();
  let prefs = getPrefs();
  let area = null;
  let radius = NORMAL_RADIUS_KM;
  let state = { status: 'idle', venues: [], source: null };
  let selectedId = null;
  let requestId = 0;
  let timer = null;

  container.innerHTML = `
    <div class="section-head">
      <div><h2 data-title></h2><p class="muted small" data-source></p></div>
    </div>
    <p class="wishes-line" data-wishes></p>
    <div class="chips" data-types role="group" aria-label="${t.venues.typeFilter}"></div>
    <div data-body aria-live="polite"></div>`;

  const body = container.querySelector('[data-body]');

  // What passes the wishes, and then the temporary type filter.
  const allowed = () => filterByPrefs(state.venues, prefs);
  const shown = () => sortVenues(filterVenues(allowed(), { types }), when);

  function renderChrome() {
    container.querySelector('[data-title]').textContent = area ? t.venues.title(area.name) : '';
    container.querySelector('[data-source]').innerHTML = state.source ? sourceBadge(state.source, PROVIDER_NAME) : '';

    const wishes = container.querySelector('[data-wishes]');
    wishes.innerHTML =
      state.status === 'ready'
        ? `${icon('sliders')}<span>${t.offer.activeSummary(wishCount(prefs))} · ${t.offer.shown(allowed().length, state.venues.length)}</span><a class="link-btn" href="#/aanbod">${t.offer.adjust}</a>`
        : '';

    const noneSelected = types.length === 0;
    container.querySelector('[data-types]').innerHTML =
      `<button type="button" class="chip-btn" data-type="" aria-pressed="${noneSelected}">${t.venues.all}</button>` +
      prefs.types
        .map((type) => `<button type="button" class="chip-btn" data-type="${type}" aria-pressed="${types.includes(type)}">${t.placeTypes[type]}</button>`)
        .join('');
  }

  function renderBody() {
    renderChrome();

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

    const list = shown();
    onCount?.(list.length);

    if (!list.length) {
      body.innerHTML = `
        <div class="empty-state">${icon('search')}<h2>${t.venues.empty}</h2>
        <div class="hero-buttons">
          <a class="btn" href="#/aanbod">${t.offer.adjust}</a>
          ${types.length ? `<button type="button" class="btn" data-clear-types>${t.venues.adjustFilters}</button>` : ''}
          ${radius < WIDE_RADIUS_KM ? `<button type="button" class="btn btn-primary" data-wider>${t.venues.widerZone}</button>` : ''}
        </div></div>`;
      return;
    }

    body.innerHTML = `
      <div data-map></div>
      <p class="muted small section-gap">${t.venues.count(list.length, state.venues.length)}</p>
      <div class="venue-grid">${list.map(venueRow).join('')}</div>`;
    drawMap(list);
  }

  function drawMap(list) {
    renderVenueMap(body.querySelector('[data-map]'), {
      area,
      venues: list,
      selectedId,
      radiusKm: radius,
      onSelect: (id) => {
        selectedId = id;
        drawMap(list);
        const venue = list.find((v) => v.id === id);
        if (venue) openVenueCard(venue, { when, appointment, onChosen });
      },
    });
  }

  function venueRow(v) {
    const status = openLabel(v, when);
    const href = `#/plek/${encodeURIComponent(v.id)}${appointment ? `?afspraak=${appointment.id}` : ''}`;
    return `
      <a class="venue ${v.id === selectedId ? 'selected' : ''}" href="${href}">
        <span class="venue-photo" style="--h1:${v.photos[0]};--h2:${v.photos[1]}">${icon(v.type)}</span>
        <span class="grow">
          <span class="venue-name">${esc(v.name)}</span>
          <span class="muted small venue-line">${esc(v.cuisine)} · ★ ${v.rating.toFixed(1)} (${v.review_count}) · <span class="nowrap">${formatPriceRange(v)}</span></span>
          <span class="small venue-line level-${status.open ? 'good' : 'bad'}">${esc(status.open || status.text.includes('opent') ? status.text : t.venues.closedAt)}</span>
          <span class="muted small venue-line">${t.venues.crowd[crowdLevel(v, when)]} · ${v.distance_km} km</span>
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
      types = type === '' ? [] : types.includes(type) ? types.filter((x) => x !== type) : [...types, type];
      try {
        localStorage.setItem(TYPE_FILTER_KEY, JSON.stringify(types));
      } catch {
        // not remembered, that is fine
      }
      renderBody();
    }
    if (event.target.closest('[data-clear-types]')) {
      types = [];
      renderBody();
    }
    if (event.target.closest('[data-wider]')) {
      radius = WIDE_RADIUS_KM;
      load();
    }
    if (event.target.closest('[data-retry]')) load();
  });

  // Going back online (or switching "Simuleer offline" off) retries a failed search.
  const stopConnectivity = onConnectivityChange(() => {
    if (!container.isConnected) stopConnectivity(); // the screen is gone
    else if (area && state.status === 'offline') load();
  });

  // Changed wishes apply immediately.
  const onOffer = () => {
    if (!container.isConnected) {
      document.removeEventListener('aether:offer', onOffer);
      return;
    }
    prefs = getPrefs();
    renderBody();
  };
  document.addEventListener('aether:offer', onOffer);

  renderBody();

  return {
    // Called whenever another area is selected. Waits a moment so dragging the slider does not
    // trigger a search for every position.
    show(newArea) {
      if (area?.id === newArea.id) return;
      area = newArea;
      radius = NORMAL_RADIUS_KM;
      selectedId = null;
      clearTimeout(timer);
      state = { ...state, status: 'loading' };
      renderBody();
      timer = setTimeout(load, 350);
    },
  };
}
