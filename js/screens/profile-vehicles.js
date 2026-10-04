// Profile → "Voertuigen": the vehicles this person can use. Add, remove, and "no car".

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { openSheet } from '../ui/modal.js';
import { toggleRow, why } from '../ui/form-bits.js';
import { VEHICLE_KINDS, isCarKind } from '../core/profile-model.js';
import { newId } from '../data/db.js';
import { savePerson } from '../data/people.js';

const vehicleIcon = (kind) => icon(kind === 'bike' ? 'bike' : kind === 'transit_pass' ? 'transit' : 'car');

export function vehiclesSection(prefs) {
  const rows = prefs.vehicles
    .map((v) => {
      const kind = t.profile.vehicles.kinds[v.kind];
      return `
      <div class="list-row">
        <span class="pin-icon">${vehicleIcon(v.kind)}</span>
        <div class="grow">
          <div>${esc(v.label || kind)}</div>
          ${v.label ? `<div class="muted small">${kind}</div>` : ''}
        </div>
        <button type="button" class="icon-btn ghost" data-remove-vehicle="${v.id}" aria-label="${t.profile.vehicles.remove}: ${esc(v.label || kind)}">${icon('trash')}</button>
      </div>`;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">${t.profile.vehicles.title}</h2>
      <div class="card form">
        ${why(t.profile.vehicles.why)}
        ${rows || `<p class="muted">${t.profile.vehicles.empty}</p>`}
        <button type="button" class="btn btn-block" data-add-vehicle>${icon('plus')} ${t.profile.vehicles.add}</button>
        ${toggleRow('no_car', t.profile.vehicles.noCar, prefs.no_car)}
      </div>
    </div>`;
}

export function wireVehicles(container, self, rerender) {
  container.querySelector('[data-add-vehicle]').addEventListener('click', async () => {
    const vehicle = await askVehicle();
    if (!vehicle) return;
    self.preferences.vehicles.push(vehicle);
    // Adding a car means the person does have one.
    if (isCarKind(vehicle.kind)) self.preferences.no_car = false;
    await savePerson(self);
    rerender();
  });

  container.querySelectorAll('[data-remove-vehicle]').forEach((button) =>
    button.addEventListener('click', async () => {
      self.preferences.vehicles = self.preferences.vehicles.filter((v) => v.id !== button.dataset.removeVehicle);
      await savePerson(self);
      rerender();
    }),
  );
}

function askVehicle() {
  return openSheet({
    title: t.profile.vehicles.addTitle,
    body: `
      <form class="form">
        <label class="field">
          <span class="field-label">${t.profile.vehicles.kindLabel}</span>
          <select name="kind">${VEHICLE_KINDS.map((k) => `<option value="${k}">${t.profile.vehicles.kinds[k]}</option>`).join('')}</select>
        </label>
        <label class="field">
          <span class="field-label">${t.profile.vehicles.nameLabel}</span>
          <input name="label" maxlength="30" placeholder="${t.profile.vehicles.namePlaceholder}" autocomplete="off" />
        </label>
        <div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">${t.common.save}</button></div>
      </form>`,
    setup(el, close) {
      const form = el.querySelector('form');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        close({ id: newId(), kind: form.elements.kind.value, label: form.elements.label.value.trim() });
      });
    },
  });
}
