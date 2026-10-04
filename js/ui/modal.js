// Bottom sheets built on the native <dialog> element (handles focus and the Escape key for us).

import { icon } from './icons.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';

// Opens a sheet and returns a Promise that resolves with the value passed to close().
// setup(sheetElement, close) wires up the content after it is in the page.
export function openSheet({ title, body, setup }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'sheet';
    dialog.innerHTML = `
      <div class="sheet-header">
        <h2>${esc(title)}</h2>
        <button type="button" class="icon-btn" data-close aria-label="${t.common.close}">${icon('close')}</button>
      </div>
      <div class="sheet-body">${body}</div>`;

    let result = null;
    const close = (value = null) => {
      result = value;
      dialog.close();
    };

    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });
    // Clicking the dark backdrop (outside the sheet) closes it.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => close());

    document.body.append(dialog);
    dialog.showModal();
    setup?.(dialog, close);
  });
}

export function confirmDialog(message, { confirmLabel = t.common.confirm, danger = false } = {}) {
  return openSheet({
    title: t.common.areYouSure,
    body: `
      <p>${esc(message)}</p>
      <div class="sheet-actions">
        <button type="button" class="btn" data-no>${t.common.cancel}</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(confirmLabel)}</button>
      </div>`,
    setup(el, close) {
      el.querySelector('[data-no]').addEventListener('click', () => close(false));
      el.querySelector('[data-yes]').addEventListener('click', () => close(true));
    },
  }).then(Boolean);
}

// Overflow menu (⋮). actions: [{ label, value, danger }] → resolves with the chosen value or null.
export function actionSheet(title, actions) {
  return openSheet({
    title,
    body: `<div class="menu-list">${actions
      .map((a, i) => `<button type="button" class="menu-item ${a.danger ? 'danger' : ''}" data-index="${i}">${esc(a.label)}</button>`)
      .join('')}</div>`,
    setup(el, close) {
      el.querySelectorAll('[data-index]').forEach((btn) =>
        btn.addEventListener('click', () => close(actions[Number(btn.dataset.index)].value)),
      );
    },
  });
}
