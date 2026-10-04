// Small building blocks shared by the profile and appointment forms (HTML strings).

import { esc } from './dom.js';

// Short explanation under a field: why this preference counts.
export const why = (text) => `<p class="field-hint why">${esc(text)}</p>`;

// options: [{ value, label }] → a row of checkbox chips. Read with checkedValues(form, name).
export function chipGroup(name, options, selected = []) {
  return `
    <div class="chips">
      ${options
        .map(
          (o) => `
        <label class="chip-label">
          <input type="checkbox" name="${name}" value="${esc(o.value)}" ${selected.includes(o.value) ? 'checked' : ''} />
          <span>${esc(o.label)}</span>
        </label>`,
        )
        .join('')}
    </div>`;
}

export const checkedValues = (root, name) => [...root.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);

export function toggleRow(name, label, checked, whyText = '') {
  return `
    <div class="field">
      <label class="toggle-row">
        <span>${esc(label)}</span>
        <span class="toggle"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} /><span class="toggle-track"></span></span>
      </label>
      ${whyText ? why(whyText) : ''}
    </div>`;
}

// options: [{ value, label }]
export function selectField(name, label, options, value, whyText = '') {
  return `
    <label class="field">
      <span class="field-label">${esc(label)}</span>
      <select name="${name}">
        ${options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
      </select>
      ${whyText ? why(whyText) : ''}
    </label>`;
}

// A field group with a legend, used for chip groups.
export function fieldset(label, innerHtml, whyText = '') {
  return `
    <fieldset class="field">
      <legend class="field-label">${esc(label)}</legend>
      ${innerHtml}
      ${whyText ? why(whyText) : ''}
    </fieldset>`;
}
