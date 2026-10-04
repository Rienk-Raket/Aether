// Profiel → "Standaard locaties": list, add, edit, make default, remove.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { actionSheet, confirmDialog } from '../ui/modal.js';
import { openLocationForm } from '../ui/location-form.js';
import { transportIcon } from '../ui/transport.js';
import { savePerson, addLocation, removeLocation } from '../data/people.js';

export function locationsSection(self) {
  const rows = self.locations
    .map(
      (loc) => `
      <div class="list-row">
        <span class="pin-icon">${icon('pin')}</span>
        <div class="grow">
          <div>${esc(loc.label)}${loc.is_default ? ` <span class="badge">${t.settings.default}</span>` : ''}</div>
          <div class="muted small">${esc(loc.address)}</div>
        </div>
        <span class="transport-icon">${transportIcon(loc.transport_mode)}</span>
        <button type="button" class="icon-btn ghost" data-location="${loc.id}" aria-label="${t.common.more}">${icon('more')}</button>
      </div>`,
    )
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">${t.settings.sectionLocations}</h2>
      ${
        self.locations.length
          ? `<div class="card list-card">${rows}</div>`
          : `<div class="card empty-state">${icon('pin')}<p>${t.settings.emptyLocations}</p></div>`
      }
      <button type="button" class="btn btn-primary btn-block section-gap" data-add-location>${icon('plus')} ${t.settings.addLocation}</button>
    </div>`;
}

export function wireLocations(container, self, rerender) {
  container.querySelector('[data-add-location]').addEventListener('click', async () => {
    const values = await openLocationForm({
      title: t.settings.addLocation,
      label: self.locations.length ? '' : t.form.defaultLabel,
      transport: self.preferences.default_transport,
    });
    if (!values) return;
    addLocation(self, { label: values.label, place: values.place, transport: values.transport });
    await savePerson(self);
    rerender();
  });

  container.querySelectorAll('[data-location]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const loc = self.locations.find((l) => l.id === btn.dataset.location);
      const choice = await actionSheet(loc.label, [
        { label: t.common.edit, value: 'edit' },
        ...(loc.is_default ? [] : [{ label: t.settings.makeDefault, value: 'default' }]),
        { label: t.common.delete, value: 'delete', danger: true, icon: 'trash' },
      ]);

      if (choice === 'edit') {
        const values = await openLocationForm({ title: t.common.edit, label: loc.label, place: loc, transport: loc.transport_mode });
        if (!values) return;
        Object.assign(loc, {
          label: values.label,
          address: values.place.address,
          lat: values.place.lat,
          lng: values.place.lng,
          transport_mode: values.transport,
        });
      } else if (choice === 'default') {
        self.locations.forEach((l) => (l.is_default = l.id === loc.id));
      } else if (choice === 'delete') {
        if (!(await confirmDialog(t.settings.confirmDeleteLocation(loc.label), { confirmLabel: t.common.delete, danger: true }))) return;
        removeLocation(self, loc.id);
      } else {
        return;
      }
      await savePerson(self);
      rerender();
    }),
  );
}
