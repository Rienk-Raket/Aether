// Profile: name, vehicles, start locations, travel conditions, food & drink wishes.
// Everything is saved to IndexedDB as soon as a value changes. Works offline.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { confirmDialog } from '../ui/modal.js';
import { askName } from '../ui/name-form.js';
import { showToast } from '../ui/toast.js';
import { why } from '../ui/form-bits.js';
import { navigate } from '../router.js';
import { normalizePreferences } from '../core/profile-model.js';
import { ensureSelf, savePerson } from '../data/people.js';
import { removeProfile, profileKind } from '../data/profiles.js';
import { locationsSection, wireLocations } from './profile-locations.js';
import { vehiclesSection, wireVehicles } from './profile-vehicles.js';
import { travelSection, showTravelLabels, readTravel } from './profile-travel.js';
import { diningSection, showDiningLabels, readDining } from './profile-dining.js';

export async function renderProfile(container) {
  const self = await ensureSelf();
  self.preferences = normalizePreferences(self.preferences);
  const prefs = self.preferences;
  const rerender = () => renderProfile(container);

  container.innerHTML = `
    <section class="screen">
      <a class="back-link" href="#/start">${icon('back')} ${t.profile.backToStart}</a>
      <div class="eyebrow">${t.profile.eyebrow}</div>
      <h1 class="section-gap">${t.profile.title}</h1>
      ${why(t.profile.intro)}

      <div class="card section-gap card-row">
        <div class="list-row">
          ${avatar(self, 56)}
          <div>
            <div class="card-title">${esc(self.name)}</div>
            <div class="muted small" role="status" data-saved>${t.settings.localProfile} · ${t.deck.kindBadge[profileKind(self)]}</div>
          </div>
        </div>
        <button type="button" class="icon-btn" data-edit-name aria-label="${t.profile.editName}">${icon('edit')}</button>
      </div>
      <div class="card card-row section-gap">
        <span class="muted small">${profileKind(self) === 'business' ? t.deck.kinds.business.text : t.deck.kinds.personal.text}</span>
        <span class="row">
          ${profileKind(self) === 'business' ? `<a class="btn btn-small" href="#/zakelijk">${icon('restaurant')} ${t.business.toBusiness}</a>` : ''}
          <a class="btn btn-small" href="#/profiel/nieuw?opnieuw=1">${icon('sliders')} ${t.deck.redo}</a>
        </span>
      </div>

      <form data-profile-form novalidate>
        ${vehiclesSection(prefs)}
        ${locationsSection(self)}
        ${travelSection(prefs)}
        ${diningSection(prefs)}
        <div class="section">
          <h2 class="section-title">${t.profile.fairness.title}</h2>
          <div class="card form">
            <label class="field">
              <span class="field-label">${t.settings.fairness} <output class="mono" data-fair-out>${Math.round(prefs.fairness_priority * 100)}%</output></span>
              <input type="range" name="fairness" min="0" max="100" step="5" value="${Math.round(prefs.fairness_priority * 100)}" />
              <span class="range-labels muted small"><span>${t.fairness.efficient}</span><span>${t.fairness.fair}</span></span>
              ${why(t.profile.fairness.why)}
            </label>
          </div>
        </div>
      </form>

      <div class="section">
        <button type="button" class="btn btn-danger" data-delete>${icon('trash')} ${t.profile.delete}</button>
      </div>
    </section>`;

  const form = container.querySelector('[data-profile-form]');
  const status = container.querySelector('[data-saved]');
  form.addEventListener('submit', (event) => event.preventDefault());

  wireLocations(container, self, rerender);
  wireVehicles(container, self, rerender);

  // "input" fires while dragging a slider: update the labels right away.
  form.addEventListener('input', () => {
    showTravelLabels(form);
    showDiningLabels(form);
    container.querySelector('[data-fair-out]').textContent = `${form.elements.fairness.value}%`;
  });

  // "change" fires when the user lets go: save.
  form.addEventListener('change', async () => {
    Object.assign(prefs, readTravel(form, prefs), readDining(form), {
      no_car: form.elements.no_car.checked,
      fairness_priority: Number(form.elements.fairness.value) / 100,
    });
    await savePerson(self);
    status.textContent = t.profile.saved;
  });

  container.querySelector('[data-edit-name]').addEventListener('click', async () => {
    const name = await askName(self.name);
    if (!name) return;
    self.name = name;
    await savePerson(self);
    document.dispatchEvent(new CustomEvent('aether:profile'));
    rerender();
  });

  container.querySelector('[data-delete]').addEventListener('click', async () => {
    if (!(await confirmDialog(t.profile.deleteConfirm(self.name), { confirmLabel: t.profile.delete, danger: true }))) return;
    if (!(await removeProfile(self.id))) {
      showToast(t.profile.deleteLast);
      return;
    }
    navigate('/start');
  });
}
