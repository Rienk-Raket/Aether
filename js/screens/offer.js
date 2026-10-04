// Aanbod & wensen: choose what Aether may propose. Wishes (what are you looking for, diets,
// price, kinds of businesses) and the allowed (fictional) booking sites and agencies.
// Every change is saved at once and applies to Ontdek, the map and the lists.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { getPrefs, savePrefs, resetPrefs, listProviders, allVenues } from '../data/offer.js';
import {
  SERVICES,
  DIETS,
  PRESETS,
  providerOn,
  filterByPrefs,
  reachableProviders,
  activePreset,
  applyPreset,
  wishCount,
} from '../core/offer.js';
import { VENUE_TYPES } from '../core/venues.js';

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export async function renderOffer(container) {
  const [venues, providers] = await Promise.all([allVenues(), listProviders()]);
  let prefs = getPrefs();

  container.innerHTML = `
    <section class="screen">
      <div class="eyebrow">${t.offer.eyebrow}</div>
      <h1 class="section-gap">${t.offer.title}</h1>
      <p class="sub">${t.offer.sub}</p>

      <div class="card section-gap" data-summary></div>

      <div class="dashboard section-gap">
        <div>
          <div class="card">
            <h2>${t.offer.lookingFor}</h2>
            <div class="chips section-gap" role="group" aria-label="${t.offer.lookingFor}">
              ${Object.keys(PRESETS).map((id) => `<button type="button" class="chip-btn" data-preset="${id}">${t.offer.presets[id]}</button>`).join('')}
            </div>
            <div class="section-title section-gap">${t.offer.servicesTitle}</div>
            <div class="chips">${SERVICES.map((s) => chipCheckbox('service', s, t.serviceNames[s])).join('')}</div>
            ${switchRow('matchAll', t.offer.matchAll, t.offer.matchAllHint)}
          </div>

          <div class="card">
            <h2>${t.offer.foodTitle}</h2>
            <div class="section-title section-gap">${t.offer.dietsTitle}</div>
            <div class="chips">${DIETS.map((d) => chipCheckbox('diet', d, t.dietNames[d])).join('')}</div>
            ${switchRow('accessible', t.offer.accessible)}
            ${switchRow('quiet', t.offer.quiet)}
            <label class="field section-gap">
              <span class="field-label">${t.offer.maxPrice} <output class="mono" data-price-out></output></span>
              <input type="range" min="1" max="4" step="1" data-price />
            </label>
          </div>
        </div>

        <div>
          <div class="card">
            <h2>${t.offer.typesTitle}</h2>
            <div class="section-gap">
              ${VENUE_TYPES.map((type) => typeRow(type, venues.filter((v) => v.type === type).length)).join('')}
            </div>
          </div>

          <div class="card">
            <h2>${t.offer.providersTitle}</h2>
            <p class="muted small">${t.offer.providersHint}</p>
            <div class="section-gap" data-providers></div>
          </div>
        </div>
      </div>

      <div class="flow-actions">
        <button type="button" class="btn" data-reset>${icon('refresh')} ${t.offer.reset}</button>
      </div>
      <p class="muted small center section-gap">${t.offer.fictional}</p>
    </section>`;

  // Brings every control and number in line with `prefs`.
  function sync() {
    const preset = activePreset(prefs);
    container.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.preset === preset));
    container.querySelectorAll('[data-service]').forEach((i) => (i.checked = prefs.needs.includes(i.dataset.service)));
    container.querySelectorAll('[data-diet]').forEach((i) => (i.checked = prefs.diets.includes(i.dataset.diet)));
    container.querySelectorAll('[data-type-on]').forEach((i) => (i.checked = prefs.types.includes(i.dataset.typeOn)));
    for (const name of ['matchAll', 'accessible', 'quiet']) container.querySelector(`[data-switch="${name}"]`).checked = prefs[name];
    container.querySelector('[data-price]').value = prefs.maxPriceLevel;
    container.querySelector('[data-price-out]').textContent = '€'.repeat(prefs.maxPriceLevel);

    const matching = filterByPrefs(venues, prefs);
    const routes = reachableProviders(venues, prefs);
    container.querySelector('[data-summary]').innerHTML = `
      <div class="eyebrow">${t.offer.fits}</div>
      <div class="stats">
        <div class="stat"><strong>${matching.length}</strong><span>${t.offer.statVenues(venues.length)}</span></div>
        <div class="stat"><strong>${routes.size}/${providers.length}</strong><span>${t.offer.statRoutes}</span></div>
        <div class="stat"><strong>${wishCount(prefs)}</strong><span>${t.offer.statWishes}</span></div>
      </div>
      ${matching.length === 0 ? `<p class="notice" role="status">${t.offer.none}</p>` : ''}`;

    container.querySelector('[data-providers]').innerHTML = providers.map((p) => providerRow(p)).join('');
  }

  function providerRow(provider) {
    const on = providerOn(prefs, provider.id);
    const reach = filterByPrefs(venues, { ...prefs, providers: { ...prefs.providers, [provider.id]: true } }).filter((v) => v.booking_partners.includes(provider.id)).length;
    return `
      <label class="toggle-row provider-row">
        <span class="grow">
          <strong>${esc(provider.name)}</strong> <span class="badge muted-badge">${t.offer.kinds[provider.kind]}</span><br />
          <span class="muted small">${esc(provider.description)}</span><br />
          <span class="muted small">${provider.services.map((s) => t.serviceNames[s]).join(' · ')} — ${t.offer.providerCount(reach)}</span>
        </span>
        <span class="toggle"><input type="checkbox" data-provider="${provider.id}" ${on ? 'checked' : ''} aria-label="${esc(provider.name)}" /><span class="toggle-track"></span></span>
      </label>`;
  }

  const save = (next) => {
    prefs = savePrefs(next);
    sync();
  };

  container.addEventListener('change', (event) => {
    const el = event.target;
    if (el.dataset.service) save({ ...prefs, needs: toggle(prefs.needs, el.dataset.service) });
    else if (el.dataset.diet) save({ ...prefs, diets: toggle(prefs.diets, el.dataset.diet) });
    else if (el.dataset.typeOn) save({ ...prefs, types: toggle(prefs.types, el.dataset.typeOn) });
    else if (el.dataset.switch) save({ ...prefs, [el.dataset.switch]: el.checked });
    else if ('price' in el.dataset) save({ ...prefs, maxPriceLevel: Number(el.value) });
    else if (el.dataset.provider) save({ ...prefs, providers: { ...prefs.providers, [el.dataset.provider]: el.checked ? true : false } });
  });

  // The price label follows the slider while dragging.
  container.querySelector('[data-price]').addEventListener('input', (event) => {
    container.querySelector('[data-price-out]').textContent = '€'.repeat(Number(event.target.value));
  });

  container.addEventListener('click', (event) => {
    const preset = event.target.closest('[data-preset]');
    if (preset) {
      // Clicking the active preset again clears the "what are you looking for" wish.
      const next = activePreset(prefs) === preset.dataset.preset ? { ...prefs, needs: [], matchAll: false } : applyPreset(prefs, preset.dataset.preset);
      save(next);
    }
    if (event.target.closest('[data-reset]')) {
      prefs = resetPrefs();
      sync();
      showToast(t.offer.resetDone);
    }
  });

  sync();
}

function chipCheckbox(kind, value, label) {
  return `<label class="chip-label"><input type="checkbox" data-${kind}="${value}" /><span>${label}</span></label>`;
}

function switchRow(name, label, hint = '') {
  return `
    <label class="toggle-row">
      <span>${label}${hint ? `<br /><span class="muted small">${hint}</span>` : ''}</span>
      <span class="toggle"><input type="checkbox" data-switch="${name}" /><span class="toggle-track"></span></span>
    </label>`;
}

function typeRow(type, count) {
  return `
    <label class="toggle-row">
      <span class="type-row">${icon(type)} <span>${t.placeTypes[type]}<br /><span class="muted small">${t.offer.typeCount(count)}</span></span></span>
      <span class="toggle"><input type="checkbox" data-type-on="${type}" aria-label="${t.placeTypes[type]}" /><span class="toggle-track"></span></span>
    </label>`;
}
