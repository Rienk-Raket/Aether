// Sheet to choose a start address: search, pick a city, or use the current GPS position.
// Resolves with { address, lat, lng } or null when cancelled.

import { openSheet } from './modal.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';
import { searchAddress, nearestAddress, listCities, PROVIDER_NAME } from '../services/geocode.js';

export function pickAddress() {
  return openSheet({
    title: t.address.title,
    body: `
      <label class="field">
        <span class="visually-hidden">${t.address.search}</span>
        <span class="input-icon">${icon('search')}
          <input type="search" name="q" placeholder="${t.address.placeholder}" autocomplete="off" />
        </span>
      </label>
      <button type="button" class="btn btn-block" data-gps>${icon('locate')} ${t.address.useGps}</button>
      <p class="field-hint" data-status></p>
      <div class="result-list" data-results></div>
      <p class="provider-note mono">${esc(PROVIDER_NAME)}</p>`,
    setup(el, close) {
      const input = el.querySelector('input[name=q]');
      const results = el.querySelector('[data-results]');
      const status = el.querySelector('[data-status]');
      let latestQuery = 0;

      const show = (places) => {
        results.innerHTML = places
          .map(
            (p, i) => `
            <button type="button" class="result-item" data-index="${i}">
              ${icon(p.kind === 'city' ? 'orb' : 'pin')}
              <span>${esc(p.address)}</span>
            </button>`,
          )
          .join('');
        results.querySelectorAll('[data-index]').forEach((btn) =>
          btn.addEventListener('click', () => {
            const p = places[Number(btn.dataset.index)];
            close({ address: p.address, lat: p.lat, lng: p.lng });
          }),
        );
      };

      const runSearch = async () => {
        const query = input.value.trim();
        const id = ++latestQuery;
        if (!query) {
          status.textContent = t.address.orPickCity;
          show(await listCities());
          return;
        }
        status.textContent = t.common.searching;
        results.classList.add('loading');
        const places = await searchAddress(query);
        if (id !== latestQuery) return; // a newer search already started
        results.classList.remove('loading');
        status.textContent = places.length ? '' : t.address.noResults(query);
        show(places);
      };

      let timer;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(runSearch, 250);
      });

      el.querySelector('[data-gps]').addEventListener('click', () => useGps(status, close));

      runSearch();
      input.focus();
    },
  });
}

function useGps(status, close) {
  if (!navigator.geolocation) {
    status.textContent = t.address.gpsDenied;
    return;
  }
  status.textContent = t.address.gpsLocating;
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const point = { lat: coords.latitude, lng: coords.longitude };
      const near = await nearestAddress(point);
      close({ address: t.address.nearby(near?.city ?? '?'), ...point });
    },
    () => {
      status.textContent = t.address.gpsDenied;
    },
    { timeout: 10000, maximumAge: 60000 },
  );
}
