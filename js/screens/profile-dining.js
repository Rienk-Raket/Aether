// Profile → "Eten & drinken": the kind of place, kitchen, diet, allergies, price and wishes.

import { t } from '../i18n/nl.js';
import { chipGroup, checkedValues, selectField, fieldset, why } from '../ui/form-bits.js';
import { PLACE_TYPES, CUISINES, DIETS, ALLERGIES, WISH_LEVELS } from '../core/profile-model.js';

// [field name in profile, label key, explanation key]
const WISHES = [
  ['terrace', 'terrace', 'terraceWhy'],
  ['kid_friendly', 'kidFriendly', 'kidFriendlyWhy'],
  ['dog_friendly', 'dogFriendly', 'dogFriendlyWhy'],
  ['quiet', 'quiet', 'quietWhy'],
];

const options = (values, labelOf) => values.map((value) => ({ value, label: labelOf(value) }));

export function diningSection(prefs) {
  const d = prefs.dining;
  const text = t.profile.dining;
  const wishOptions = options(WISH_LEVELS, (level) => text.wish[level]);

  return `
    <div class="section">
      <h2 class="section-title">${text.title}</h2>
      <div class="card form">
        ${fieldset(text.placeTypes, chipGroup('types', options(PLACE_TYPES, (p) => t.placeTypes[p]), prefs.preferred_types), text.placeTypesWhy)}
        ${fieldset(text.cuisines, chipGroup('cuisines', options(CUISINES, (c) => c), d.cuisines), text.cuisinesWhy)}
        ${fieldset(text.diets, chipGroup('diets', options(DIETS, (x) => text.dietOptions[x]), d.diets), text.dietsWhy)}
        ${fieldset(text.allergies, chipGroup('allergies', options(ALLERGIES, (x) => text.allergyOptions[x]), d.allergies), text.allergiesWhy)}
        <label class="field">
          <span class="field-label">${text.price} <output class="mono" data-budget-out>${'€'.repeat(prefs.budget_level)}</output></span>
          <input type="range" name="budget" min="1" max="4" step="1" value="${prefs.budget_level}" />
          ${why(text.priceWhy)}
        </label>
        ${WISHES.map(([key, label, whyKey]) => selectField(key, text[label], wishOptions, d[key], text[whyKey])).join('')}
      </div>
    </div>`;
}

export function showDiningLabels(form) {
  form.querySelector('[data-budget-out]').textContent = '€'.repeat(Number(form.elements.budget.value));
}

export function readDining(form) {
  return {
    preferred_types: checkedValues(form, 'types'),
    budget_level: Number(form.elements.budget.value),
    dining: {
      cuisines: checkedValues(form, 'cuisines'),
      diets: checkedValues(form, 'diets'),
      allergies: checkedValues(form, 'allergies'),
      ...Object.fromEntries(WISHES.map(([key]) => [key, form.elements[key].value])),
    },
  };
}
