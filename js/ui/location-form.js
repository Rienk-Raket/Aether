// Form sheet for a contact (name + address + transport) or one of your own locations
// (label + address + transport). Resolves with { name, label, place, transport } or null.

import { openSheet } from './modal.js';
import { pickAddress } from './address-picker.js';
import { transportPicker } from './transport.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';

// Options: title, name (string|undefined → field hidden), label (string|undefined → field hidden),
// place ({ address, lat, lng }|null), transport (string)
export function openLocationForm({ title, name, label, place = null, transport = 'transit' }) {
  const showName = name !== undefined;
  const showLabel = label !== undefined;

  return openSheet({
    title,
    body: `
      <form class="form" novalidate>
        ${showName ? textField('name', t.form.name, name, t.form.namePlaceholder) : ''}
        ${showLabel ? textField('label', t.form.label, label, t.form.labelPlaceholder) : ''}
        <div class="field">
          <span class="field-label">${t.form.startAddress}</span>
          <button type="button" class="address-btn" data-address>${icon('pin')}<span data-address-text></span></button>
        </div>
        <div class="field">
          <span class="field-label">${t.transport.label}</span>
          ${transportPicker('transport', transport)}
        </div>
        <p class="form-error" role="alert" data-error></p>
        <div class="sheet-actions">
          <button type="submit" class="btn btn-primary btn-block">${t.common.save}</button>
        </div>
      </form>`,
    setup(el, close) {
      const form = el.querySelector('form');
      const addressText = el.querySelector('[data-address-text]');
      const error = el.querySelector('[data-error]');
      let chosen = place;

      const renderAddress = () => {
        addressText.textContent = chosen?.address ?? t.form.chooseAddress;
        addressText.classList.toggle('muted', !chosen);
      };
      renderAddress();
      form.querySelector('input:not([type=radio])')?.focus();
      form.addEventListener('input', () => (error.textContent = ''));

      el.querySelector('[data-address]').addEventListener('click', async () => {
        const picked = await pickAddress();
        if (picked) {
          chosen = picked;
          error.textContent = '';
        }
        renderAddress();
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const values = {
          name: showName ? form.elements.name.value.trim() : undefined,
          label: showLabel ? form.elements.label.value.trim() : undefined,
          place: chosen,
          transport: form.elements.transport.value,
        };
        if (showName && !values.name) return (error.textContent = t.form.nameRequired);
        if (showLabel && !values.label) return (error.textContent = t.form.labelRequired);
        if (!values.place) return (error.textContent = t.form.addressRequired);
        close(values);
      });
    },
  });
}

function textField(name, labelText, value, placeholder) {
  return `
    <label class="field">
      <span class="field-label">${labelText}</span>
      <input name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="40" autocomplete="off" />
    </label>`;
}
