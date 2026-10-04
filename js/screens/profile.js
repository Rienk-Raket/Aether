// Profile / settings: name, locations, preferences, data, app info.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { openSheet, confirmDialog } from '../ui/modal.js';
import { showToast } from '../ui/toast.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { APP_VERSION } from '../version.js';
import { ensureSelf, savePerson, forgetSelf } from '../data/people.js';
import { deleteDatabase } from '../data/db.js';
import { hasDemoData } from '../data/demo-seed.js';
import { locationsSection, wireLocations } from './profile-locations.js';
import { preferencesSection, wirePreferences } from './profile-preferences.js';

export async function renderProfile(container) {
  const self = await ensureSelf();
  const demoLoaded = await hasDemoData();
  const offlineReady = Boolean(navigator.serviceWorker?.controller);
  const rerender = () => renderProfile(container);

  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.profile.title}</h1>
      </header>

      <div class="card card-row">
        <div class="list-row">
          ${avatar(self, 56)}
          <div class="card-title">${esc(self.name)}</div>
        </div>
        <button type="button" class="icon-btn" data-edit-name aria-label="${t.profile.editName}">${icon('edit')}</button>
      </div>

      ${locationsSection(self)}
      ${preferencesSection(self.preferences)}

      <div class="section">
        <h2 class="section-title">${t.profile.sectionData}</h2>
        <div class="card">
          <div class="row"><span>${t.profile.offlineReady}</span><span class="badge">${offlineReady ? t.common.yes : t.profile.notYet}</span></div>
          <div class="row"><span>${t.profile.storage}</span><span class="mono muted" data-storage>…</span></div>
          ${demoLoaded ? '' : `<div class="row"><span>${t.demo.explain}</span>${demoButtonHtml()}</div>`}
          <div class="row"><span>${t.profile.wipe}</span><button type="button" class="btn btn-danger btn-small" data-wipe>${t.profile.wipeButton}</button></div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.profile.sectionAbout}</h2>
        <div class="card">
          <div class="row"><span>${t.profile.version}</span><span class="mono">${APP_VERSION}</span></div>
          <div class="row"><span class="muted">${t.profile.demoNote}</span><span class="badge badge-demo">DEMO</span></div>
          <div class="row"><span>${t.profile.license}</span></div>
        </div>
      </div>
    </section>`;

  wireLocations(container, self, rerender);
  wirePreferences(container, self);
  wireDemoButtons(container, rerender);
  showStorageUse(container.querySelector('[data-storage]'));

  container.querySelector('[data-edit-name]').addEventListener('click', async () => {
    const name = await askName(self.name);
    if (!name) return;
    self.name = name;
    await savePerson(self);
    rerender();
  });

  container.querySelector('[data-wipe]').addEventListener('click', async () => {
    if (!(await confirmDialog(t.profile.wipeConfirm, { confirmLabel: t.profile.wipeButton, danger: true }))) return;
    await deleteDatabase();
    forgetSelf();
    sessionStorage.clear();
    showToast(t.profile.wiped);
    rerender();
  });
}

function askName(current) {
  return openSheet({
    title: t.profile.editName,
    body: `
      <form class="form">
        <label class="field">
          <span class="field-label">${t.form.name}</span>
          <input name="name" value="${esc(current)}" maxlength="40" required autocomplete="off" />
        </label>
        <div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">${t.common.save}</button></div>
      </form>`,
    setup(el, close) {
      const form = el.querySelector('form');
      form.elements.name.select();
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        close(form.elements.name.value.trim() || null);
      });
    },
  });
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
