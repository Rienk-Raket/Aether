// Profile → "Reizen": transport, maximum travel time and other travel conditions.

import { t } from '../i18n/nl.js';
import { transportPicker } from '../ui/transport.js';
import { chipGroup, checkedValues, toggleRow, selectField, fieldset, why } from '../ui/form-bits.js';
import { ACCESSIBILITY, LATEST_RETURN_HOURS, hasElectricCar } from '../core/profile-model.js';

const maxLabel = (minutes) => (minutes ? t.profile.travel.minutes(minutes) : t.profile.travel.noLimit);

export function travelSection(prefs) {
  const travel = prefs.travel;
  const accessibilityOptions = ACCESSIBILITY.map((a) => ({ value: a, label: t.profile.travel.accessibilityOptions[a] }));
  const returnOptions = LATEST_RETURN_HOURS.map((h) => ({ value: h, label: t.profile.travel.returnOptions[h] }));

  return `
    <div class="section">
      <h2 class="section-title">${t.profile.travel.title}</h2>
      <div class="card form">
        <div class="field">
          <span class="field-label">${t.profile.travel.transport}</span>
          ${transportPicker('transport', prefs.default_transport)}
          ${why(t.profile.travel.transportWhy)}
        </div>
        <label class="field">
          <span class="field-label">${t.profile.travel.maxMinutes} <output class="mono" data-max-out>${maxLabel(travel.max_minutes)}</output></span>
          <input type="range" name="max_minutes" min="0" max="180" step="15" value="${travel.max_minutes}" />
          ${why(t.profile.travel.maxMinutesWhy)}
        </label>
        ${hasElectricCar(prefs) ? toggleRow('needs_charger', t.profile.travel.needsCharger, travel.needs_charger, t.profile.travel.needsChargerWhy) : ''}
        ${toggleRow('needs_parking', t.profile.travel.needsParking, travel.needs_parking, t.profile.travel.needsParkingWhy)}
        ${toggleRow('avoid_rush_hour', t.profile.travel.avoidRush, travel.avoid_rush_hour, t.profile.travel.avoidRushWhy)}
        ${selectField('latest_return_hour', t.profile.travel.latestReturn, returnOptions, travel.latest_return_hour, t.profile.travel.latestReturnWhy)}
        ${fieldset(t.profile.travel.accessibility, chipGroup('accessibility', accessibilityOptions, prefs.accessibility), t.profile.travel.accessibilityWhy)}
      </div>
    </div>`;
}

// Updates the label next to the slider while it is being dragged.
export function showTravelLabels(form) {
  form.querySelector('[data-max-out]').textContent = maxLabel(Number(form.elements.max_minutes.value));
}

export function readTravel(form, current) {
  const checked = (name) => form.elements[name]?.checked ?? current.travel[name];
  return {
    default_transport: form.elements.transport.value,
    accessibility: checkedValues(form, 'accessibility'),
    travel: {
      max_minutes: Number(form.elements.max_minutes.value),
      needs_charger: checked('needs_charger'),
      needs_parking: checked('needs_parking'),
      avoid_rush_hour: checked('avoid_rush_hour'),
      latest_return_hour: Number(form.elements.latest_return_hour.value),
    },
  };
}
