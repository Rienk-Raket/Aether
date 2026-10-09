// Kaart van Nederland: a fictional map with a pin for every location in the demo data, and
// filters where each condition can be required ("Wel"), excluded ("Niet") or ignored.

import { t } from '../i18n/nl.js';
import { esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { loadingFor } from '../ui/loading.js';
import { sourceBadge } from '../ui/source-badge.js';
import { createNlMap } from '../ui/nl-map.js';
import { mountImport } from './landmap-import.js';
import { findAllVenues, OfflineError, PROVIDER_NAME } from '../services/places.js';
import { loadBundledJson } from '../services/mock/network.js';
import { VENUE_TYPES, openLabel, formatPriceRange } from '../core/venues.js';
import { CONDITIONS, SERVICES, applyFilters, activeCount, emptyFilters, normalizeFilters } from '../core/map-filters.js';

const KEY = 'aether.landmap.filters';
const RATINGS = [0, 4, 4.3, 4.5, 4.7];

function loadFilters() {
  try {
    return normalizeFilters(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return emptyFilters();
  }
}
const saveFilters = (filters) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(filters));
  } catch {
    // not remembered
  }
};

export async function renderLandmap(container, _params, _query, message = '') {
  const stop = loadingFor(container, t.landmap.loading);
  let result;
  let places;
  try {
    [result, places] = await Promise.all([findAllVenues(), loadBundledJson('data/nl-places.json').then((d) => d.places)]);
  } catch (error) {
    stop();
    if (!(error instanceof OfflineError)) throw error;
    container.innerHTML = `<section class="screen"><div class="eyebrow">${t.landmap.eyebrow}</div><h1 class="section-gap">${t.landmap.title}</h1><div class="card empty-state"><h2>${t.landmap.offlineTitle}</h2><p class="muted">${t.offline.notice}</p></div></section>`;
    return;
  }
  stop();

  const { venues, source } = result;
  const cityOf = new Map(places.map((p) => [p.id, p.name]));
  const byId = new Map(venues.map((v) => [v.id, v]));
  let filters = loadFilters();
  let selected = null;

  container.innerHTML = `
    <section class="screen landmap">
      <div class="eyebrow">${t.landmap.eyebrow}</div>
      <h1 class="section-gap">${t.landmap.title}</h1>
      <p class="sub">${t.landmap.sub}</p>
      <div class="section-gap" data-import></div>
      <div class="landmap-layout section-gap">
        <div class="card landmap-filters" data-filters></div>
        <div class="landmap-stage">
          <div class="landmap-bar"><strong data-count aria-live="polite"></strong>${sourceBadge(source, PROVIDER_NAME)}</div>
          <div class="landmap-map" data-map></div>
          <div data-card></div>
          <p class="muted small">${t.landmap.source}</p>
        </div>
      </div>
    </section>`;

  const filterEl = container.querySelector('[data-filters]');
  const countEl = container.querySelector('[data-count]');
  const cardEl = container.querySelector('[data-card]');
  const map = createNlMap(container.querySelector('[data-map]'), { places, onSelect: select });
  mountImport(container.querySelector('[data-import]'), {
    places,
    message,
    onChange: (text) => {
      map.destroy();
      return renderLandmap(container, null, null, text); // reload the venues, keep the filters
    },
  }).then(() => {
    const status = container.querySelector('[data-import-status]');
    if (status && message) {
      status.hidden = false;
      status.textContent = message;
    }
  });

  function drawFilters() {
    const active = activeCount(filters);
    filterEl.innerHTML = `
      <div class="card-row"><h2>${t.landmap.filtersTitle}</h2>${active ? `<button type="button" class="link-btn" data-clear>${t.landmap.clear}</button>` : ''}</div>
      ${active ? `<p class="muted small">${t.landmap.activeFilters(active)}</p>` : ''}
      <label class="field"><span class="field-label">${t.landmap.search}</span><input type="search" data-search value="${esc(filters.search)}" placeholder="${t.landmap.searchPlaceholder}" autocomplete="off" /></label>
      <div class="search-results" data-results></div>
      <fieldset class="field"><legend class="field-label">${t.landmap.typesTitle}</legend>
        <div class="chips">${VENUE_TYPES.map((type) => `<button type="button" class="chip type-chip ${type}" data-type="${type}" aria-pressed="${filters.types.includes(type)}">${icon(type)} ${t.placeTypes[type]}</button>`).join('')}</div></fieldset>
      <fieldset class="field"><legend class="field-label">${t.landmap.servicesTitle}</legend>
        <div class="chips">${SERVICES.map((svc) => `<button type="button" class="chip" data-service="${svc}" aria-pressed="${filters.services.includes(svc)}">${t.serviceNames[svc]}</button>`).join('')}</div>
        <p class="field-hint">${t.landmap.servicesHint}</p></fieldset>
      <label class="field"><span class="field-label">${t.landmap.ratingTitle}</span>
        <select data-rating>${RATINGS.map((n) => `<option value="${n}" ${n === filters.minRating ? 'selected' : ''}>${n ? t.landmap.ratingOption(n) : t.landmap.ratingAny}</option>`).join('')}</select></label>
      <fieldset class="field"><legend class="field-label">${t.landmap.conditionsTitle}</legend><p class="field-hint">${t.landmap.conditionsHint}</p>
        <div class="tri-list">${Object.keys(CONDITIONS).map(conditionRow).join('')}</div></fieldset>`;
  }

  function conditionRow(key) {
    const value = filters.conditions[key] ?? 'any';
    const option = (v, label) => `<button type="button" role="radio" aria-checked="${value === v}" data-cond="${key}" data-value="${v}">${label}</button>`;
    return `<div class="tri-row"><span id="tri-${key}">${t.landmap.conditions[key]}</span>
      <div class="tri" role="radiogroup" aria-labelledby="tri-${key}">${option('yes', t.landmap.yes)}${option('any', t.landmap.any)}${option('no', t.landmap.no)}</div></div>`;
  }

  function refresh() {
    const shown = applyFilters(venues, filters, new Date(), (v) => cityOf.get(v.area_id) ?? '');
    if (selected && !shown.some((v) => v.id === selected)) selected = null;
    countEl.textContent = t.landmap.count(shown.length, venues.length);
    map.update(shown, selected);
    drawCard();
    drawResults(shown);
    if (!shown.length) cardEl.innerHTML = `<p class="notice" role="status">${t.landmap.none}</p>`;
  }

  // While searching: the best matches as a list; a tap zooms the map to that place.
  function drawResults(shown) {
    const box = filterEl.querySelector('[data-results]');
    if (!box) return;
    const q = filters.search.trim();
    if (!q) {
      box.innerHTML = '';
      return;
    }
    const top = shown.slice(0, 6);
    box.innerHTML = top.length
      ? `<ul class="result-list" aria-label="${t.landmap.searchResults(shown.length)}">${top.map((v) => `<li><button type="button" data-pick="${esc(v.id)}" aria-label="${esc(t.landmap.searchPick(v.name))}"><span class="dot ${v.type}"></span><span><strong>${esc(v.name)}</strong><small>${esc(t.placeTypes[v.type])} · ${esc(cityOf.get(v.area_id) ?? '')}</small></span></button></li>`).join('')}</ul>${shown.length > top.length ? `<p class="muted small">${t.landmap.searchMore(shown.length - top.length)}</p>` : ''}`
      : `<p class="muted small">${t.landmap.searchNone}</p>`;
  }

  function select(id) {
    selected = id === selected ? null : id;
    refresh();
  }

  function drawCard() {
    const v = selected && byId.get(selected);
    if (!v) {
      cardEl.innerHTML = '';
      return;
    }
    const status = openLabel(v, new Date());
    cardEl.innerHTML = `
      <article class="card landmap-card">
        <div class="card-row"><div><div class="eyebrow">${t.placeTypes[v.type]} · ${esc(v.cuisine ?? '')}</div><h2>${esc(v.name)}</h2>
          <p class="muted small">${esc(v.address)}</p></div>
          <button type="button" class="icon-btn" data-card-close aria-label="${t.landmap.cardClose}">${icon('close')}</button></div>
        <div class="chips">
          <span class="chip active">★ ${v.rating.toFixed(1).replace('.', ',')} · ${t.landmap.cardReviews(v.review_count)}</span>
          <span class="chip">${formatPriceRange(v)}</span>
          <span class="chip level-${status.open ? 'good' : 'bad'}">${esc(status.text)}</span>
          ${Object.keys(CONDITIONS).filter((k) => !['open_now', 'open_24h', 'business', 'private'].includes(k) && CONDITIONS[k](v)).map((k) => `<span class="chip feature">${t.landmap.conditions[k]}</span>`).join('')}
        </div>
        ${(v.highlights ?? []).length ? `<p class="small muted">${v.highlights.map(esc).join(' · ')}</p>` : ''}
        ${v.use_business ? `<p class="small"><strong>${t.landmap.cardBusiness}:</strong> ${esc(v.use_business)}</p>` : ''}
        ${v.use_private ? `<p class="small"><strong>${t.landmap.cardPrivate}:</strong> ${esc(v.use_private)}</p>` : ''}
        <a class="btn btn-primary" href="#/plek/${encodeURIComponent(v.id)}">${t.landmap.cardMore} ${icon('chevron')}</a>
      </article>`;
    cardEl.querySelector('[data-card-close]').addEventListener('click', () => select(v.id));
  }

  const change = (next) => {
    filters = next;
    saveFilters(filters);
    drawFilters();
    refresh();
  };

  filterEl.addEventListener('click', (event) => {
    const type = event.target.closest('[data-type]')?.dataset.type;
    if (type) return change({ ...filters, types: filters.types.includes(type) ? filters.types.filter((x) => x !== type) : VENUE_TYPES.filter((x) => x === type || filters.types.includes(x)) });
    const service = event.target.closest('[data-service]')?.dataset.service;
    if (service) return change({ ...filters, services: filters.services.includes(service) ? filters.services.filter((x) => x !== service) : SERVICES.filter((x) => x === service || filters.services.includes(x)) });
    const pick = event.target.closest('[data-pick]')?.dataset.pick;
    if (pick) {
      selected = pick;
      map.focus(byId.get(pick));
      return refresh();
    }
    const cond = event.target.closest('[data-cond]');
    if (cond) {
      const conditions = { ...filters.conditions };
      if (cond.dataset.value === 'any') delete conditions[cond.dataset.cond];
      else conditions[cond.dataset.cond] = cond.dataset.value;
      return change({ ...filters, conditions });
    }
    if (event.target.closest('[data-clear]')) change(emptyFilters());
  });
  filterEl.addEventListener('change', (event) => {
    if (event.target.matches('[data-rating]')) change({ ...filters, minRating: Number(event.target.value) });
  });
  filterEl.addEventListener('input', (event) => {
    if (!event.target.matches('[data-search]')) return;
    filters = { ...filters, search: event.target.value };
    saveFilters(filters);
    refresh(); // keep the typing focus: the filter panel is not redrawn
  });

  drawFilters();
  refresh();
}
