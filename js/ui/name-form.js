// Small sheet that asks for a name. Resolves with the trimmed name, or null when cancelled.

import { openSheet } from './modal.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';

export function askName(current = '', title = t.settings.editName) {
  return openSheet({
    title,
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
