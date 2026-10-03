// Profile / settings. In M0: empty locations, offline status, storage use, about.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { APP_VERSION } from '../version.js';

export function renderProfile(container) {
  const offlineReady = Boolean(navigator.serviceWorker?.controller);

  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.profile.title}</h1>
      </header>

      <div class="section">
        <h2 class="section-title">${t.profile.sectionLocations}</h2>
        <div class="card empty-state">
          ${icon('pin')}
          <p>${t.profile.emptyLocations}</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.profile.sectionApp}</h2>
        <div class="card">
          <div class="row">
            <span>${t.profile.offlineReady}</span>
            <span class="badge">${offlineReady ? t.profile.offlineReadyYes : t.profile.offlineReadyNo}</span>
          </div>
          <div class="row">
            <span>${t.profile.storage}</span>
            <span class="mono muted" data-storage>…</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.profile.sectionAbout}</h2>
        <div class="card">
          <div class="row">
            <span>${t.profile.version}</span>
            <span class="mono">${APP_VERSION}</span>
          </div>
          <div class="row">
            <span class="muted">${t.profile.demoNote}</span>
            <span class="badge badge-demo">DEMO</span>
          </div>
          <div class="row">
            <span>${t.profile.license}</span>
          </div>
        </div>
      </div>
    </section>
  `;

  showStorageUse(container.querySelector('[data-storage]'));
}

// navigator.storage.estimate() tells how much this site stores on the device.
async function showStorageUse(el) {
  if (!navigator.storage?.estimate) {
    el.textContent = '—';
    return;
  }
  const { usage = 0 } = await navigator.storage.estimate();
  el.textContent = `${(usage / 1024 / 1024).toFixed(1)} MB`;
}
