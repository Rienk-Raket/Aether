// Sheet to create or edit a group (name + optional description).
// Resolves with { name, description } or null.

import { openSheet } from './modal.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';

export function openGroupForm({ title, name = '', description = '' }) {
  return openSheet({
    title,
    body: `
      <form class="form" novalidate>
        <label class="field">
          <span class="field-label">${t.groupForm.name}</span>
          <input name="name" value="${esc(name)}" placeholder="${t.groupForm.namePlaceholder}" maxlength="40" autocomplete="off" />
        </label>
        <label class="field">
          <span class="field-label">${t.groupForm.description} <span class="muted">(${t.common.optional})</span></span>
          <input name="description" value="${esc(description)}" placeholder="${t.groupForm.descriptionPlaceholder}" maxlength="80" autocomplete="off" />
        </label>
        <p class="form-error" role="alert" data-error></p>
        <div class="sheet-actions">
          <button type="submit" class="btn btn-primary btn-block">${t.common.save}</button>
        </div>
      </form>`,
    setup(el, close) {
      const form = el.querySelector('form');
      form.elements.name.focus();
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const values = { name: form.elements.name.value.trim(), description: form.elements.description.value.trim() };
        if (!values.name) {
          el.querySelector('[data-error]').textContent = t.groupForm.nameRequired;
          return;
        }
        close(values);
      });
    },
  });
}
