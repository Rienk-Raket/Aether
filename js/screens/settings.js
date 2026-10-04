// Instellingen: your name, start locations, preferences, display options, data and about.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { confirmDialog } from '../ui/modal.js';
import { showToast } from '../ui/toast.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { APP_VERSION } from '../version.js';
import { ensureSelf, forgetSelf } from '../data/people.js';
import { deleteDatabase } from '../data/db.js';
import { hasDemoData } from '../data/demo-seed.js';
import { getSettings, setSetting } from '../data/settings.js';
import { logActivity } from '../data/activity.js';
import { connectionsSection, wireConnections } from './settings-connections.js';

export async function renderSettings(container) {
  const self = await ensureSelf();
  const demoLoaded = await hasDemoData();
  const offlineReady = Boolean(navigator.serviceWorker?.controller);
  const settings = getSettings();
  const rerender = () => renderSettings(container);

  container.innerHTML = `
    <section class="screen">
      <div class="eyebrow">${t.nav.settings}</div>
      <h1 class="section-gap">${t.settings.title}</h1>

      <a class="card card-link card-row section-gap" href="#/profiel">
        <div class="list-row">
          ${avatar(self, 56)}
          <div>
            <div class="card-title">${esc(self.name)}</div>
            <div class="muted small">${t.settings.profileLink}</div>
          </div>
        </div>
        ${icon('chevron')}
      </a>

      ${connectionsSection()}

      <div class="section">
        <h2 class="section-title">${t.settings.display}</h2>
        <div class="card">
          ${toggleRow('showCo2', t.settings.showCo2, settings.showCo2)}
          ${toggleRow('reduceMotion', t.settings.reduceMotion, settings.reduceMotion)}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.settings.sectionData}</h2>
        <div class="card">
          <div class="row"><span>${t.settings.offlineReady}</span><span class="badge">${offlineReady ? t.common.yes : t.settings.notYet}</span></div>
          <div class="row"><span>${t.settings.storage}</span><span class="mono muted" data-storage>…</span></div>
          ${demoLoaded ? '' : `<div class="row"><span>${t.demo.explain}</span>${demoButtonHtml()}</div>`}
          <div class="row"><span>${t.settings.wipe}</span><button type="button" class="btn btn-danger btn-small" data-wipe>${t.settings.wipeButton}</button></div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.settings.sectionAbout}</h2>
        <div class="card">
          <div class="row"><span>${t.settings.version}</span><span class="mono">${APP_VERSION}</span></div>
          <div class="row"><span class="muted">${t.settings.demoNote}</span><span class="badge badge-demo">DEMO</span></div>
          <div class="row"><span>${t.settings.license}</span></div>
        </div>
      </div>
    </section>`;

  wireConnections(container);
  wireDemoButtons(container, rerender);
  showStorageUse(container.querySelector('[data-storage]'));

  container.querySelectorAll('[data-setting]').forEach((input) =>
    input.addEventListener('change', () => setSetting(input.dataset.setting, input.checked)),
  );

  container.querySelector('[data-wipe]').addEventListener('click', async () => {
    if (!(await confirmDialog(t.settings.wipeConfirm, { confirmLabel: t.settings.wipeButton, danger: true }))) return;
    await deleteDatabase();
    forgetSelf();
    sessionStorage.clear();
    localStorage.removeItem('aether.activitySeen');
    await ensureSelf();
    await logActivity('system', t.activity.wiped);
    document.dispatchEvent(new CustomEvent('aether:profile'));
    showToast(t.settings.wiped);
    rerender();
  });
}

function toggleRow(name, label, checked) {
  return `
    <label class="toggle-row">
      <span>${label}</span>
      <span class="toggle"><input type="checkbox" data-setting="${name}" ${checked ? 'checked' : ''} /><span class="toggle-track"></span></span>
    </label>`;
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
