// Profiel → "Voorkeuren": transport, budget, place types and default fairness. Saved on every change.

import { t } from '../i18n/nl.js';
import { transportPicker } from '../ui/transport.js';
import { savePerson } from '../data/people.js';

const PLACE_TYPES = ['restaurant', 'cafe', 'bar', 'meeting_room'];

export function preferencesSection(prefs) {
  return `
    <div class="section">
      <h2 class="section-title">${t.settings.sectionPreferences}</h2>
      <form class="card form" data-prefs>
        <div class="field">
          <span class="field-label">${t.transport.label}</span>
          ${transportPicker('transport', prefs.default_transport)}
        </div>
        <label class="field">
          <span class="field-label">${t.settings.budget} <output class="mono" data-budget-out>${'€'.repeat(prefs.budget_level)}</output></span>
          <input type="range" name="budget" min="1" max="4" step="1" value="${prefs.budget_level}" />
        </label>
        <fieldset class="field">
          <legend class="field-label">${t.settings.types}</legend>
          <div class="chips">
            ${PLACE_TYPES.map(
              (type) => `
              <label class="chip-label">
                <input type="checkbox" name="types" value="${type}" ${prefs.preferred_types.includes(type) ? 'checked' : ''} />
                <span>${t.placeTypes[type]}</span>
              </label>`,
            ).join('')}
          </div>
        </fieldset>
        <label class="field">
          <span class="field-label">${t.settings.fairness} <output class="mono" data-fair-out>${Math.round(prefs.fairness_priority * 100)}%</output></span>
          <input type="range" name="fairness" min="0" max="100" step="5" value="${Math.round(prefs.fairness_priority * 100)}" />
          <span class="range-labels muted small"><span>${t.fairness.efficient}</span><span>${t.fairness.fair}</span></span>
        </label>
      </form>
    </div>`;
}

export function wirePreferences(container, self) {
  const form = container.querySelector('[data-prefs]');

  // "input" fires while dragging a slider: update the label right away.
  form.addEventListener('input', () => {
    form.querySelector('[data-budget-out]').textContent = '€'.repeat(Number(form.elements.budget.value));
    form.querySelector('[data-fair-out]').textContent = `${form.elements.fairness.value}%`;
  });

  // "change" fires when the user lets go: save.
  form.addEventListener('change', async () => {
    Object.assign(self.preferences, {
      default_transport: form.elements.transport.value,
      budget_level: Number(form.elements.budget.value),
      preferred_types: [...form.querySelectorAll('input[name=types]:checked')].map((el) => el.value),
      fairness_priority: Number(form.elements.fairness.value) / 100,
    });
    await savePerson(self);
  });
}
