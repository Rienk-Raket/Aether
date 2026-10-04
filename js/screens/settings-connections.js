// Instellingen → "Verbindingen": which (fictional) services Aether talks to, the demo switch
// "Simuleer offline", and clearing the cache.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { getSettings, setSetting } from '../data/settings.js';
import { cacheClear } from '../data/cache.js';
import { isOffline } from '../services/connectivity.js';

// status: 'service' = used now (follows the offline switch), 'soon' = comes in a later step
const SERVICES = [
  { name: 'Routara', role: t.connections.routara, status: 'service' },
  { name: 'Plekwijzer', role: t.connections.plekwijzer, status: 'service' },
  { name: 'Adreszoeker', role: t.connections.geocoder, status: 'bundled' },
  { name: 'Tafelaar', role: t.connections.tafelaar, status: 'soon' },
  { name: 'Overnachter', role: t.connections.overnachter, status: 'soon' },
  { name: t.connections.calendarName, role: t.connections.calendar, status: 'soon' },
];

function badge(status) {
  if (status === 'soon') return `<span class="badge muted-badge">${t.connections.soon}</span>`;
  if (status === 'bundled') return `<span class="badge">${t.connections.onDevice}</span>`;
  return isOffline() ? `<span class="badge badge-demo">${t.connections.offline}</span>` : `<span class="badge">${t.connections.connected}</span>`;
}

export function connectionsSection() {
  return `
    <div class="section">
      <h2 class="section-title">${t.connections.title}</h2>
      <div class="card">
        <p class="muted small">${t.connections.intro}</p>
        <div class="section-gap" data-services>${servicesHtml()}</div>
      </div>
      <div class="card">
        <label class="toggle-row">
          <span>${t.connections.simulateOffline}<br /><span class="muted small">${t.connections.simulateHint}</span></span>
          <span class="toggle"><input type="checkbox" data-setting-offline ${getSettings().simulateOffline ? 'checked' : ''} /><span class="toggle-track"></span></span>
        </label>
        <div class="row">
          <span>${t.connections.cache}<br /><span class="muted small">${t.connections.cacheHint}</span></span>
          <button type="button" class="btn btn-small" data-clear-cache>${icon('refresh')} ${t.connections.clearCache}</button>
        </div>
      </div>
    </div>`;
}

function servicesHtml() {
  return SERVICES.map(
    (s) => `
    <div class="row">
      <span><strong>${esc(s.name)}</strong><br /><span class="muted small">${esc(s.role)}</span></span>
      ${badge(s.status)}
    </div>`,
  ).join('');
}

export function wireConnections(container) {
  container.querySelector('[data-setting-offline]').addEventListener('change', (event) => {
    setSetting('simulateOffline', event.target.checked);
    container.querySelector('[data-services]').innerHTML = servicesHtml();
    showToast(event.target.checked ? t.connections.nowOffline : t.connections.nowOnline);
  });

  container.querySelector('[data-clear-cache]').addEventListener('click', async () => {
    await cacheClear();
    showToast(t.connections.cacheCleared);
  });
}
