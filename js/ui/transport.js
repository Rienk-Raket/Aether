// Transport modes: labels, icons and a segmented picker.

import { icon } from './icons.js';
import { t } from '../i18n/nl.js';

export const TRANSPORT_OPTIONS = ['transit', 'bike', 'car', 'walk'];

export const transportLabel = (mode) => t.transport[mode] ?? mode;

export const transportIcon = (mode) => icon(mode);

// Returns HTML for a row of radio buttons styled as segments. Read the value with
// form.elements[name].value.
export function transportPicker(name, selected) {
  return `
    <div class="segmented" role="radiogroup" aria-label="${t.transport.label}">
      ${TRANSPORT_OPTIONS.map(
        (mode) => `
        <label class="segment">
          <input type="radio" name="${name}" value="${mode}" ${mode === selected ? 'checked' : ''} />
          <span>${icon(mode)}<small>${transportLabel(mode)}</small></span>
        </label>`,
      ).join('')}
    </div>`;
}
