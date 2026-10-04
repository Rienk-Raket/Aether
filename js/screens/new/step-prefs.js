// Nieuwe afspraak — Stap 3: preferences. Should the participants' profile preferences count? And what
// does the organizer require for everyone? The conflict rule decides what happens when they disagree.

import { t } from '../../i18n/nl.js';
import { esc, avatar } from '../../ui/dom.js';
import { chipGroup, checkedValues, toggleRow, selectField, fieldset, why } from '../../ui/form-bits.js';
import { requirementsSummary } from '../../ui/requirements-summary.js';
import { navigate } from '../../router.js';
import { PLACE_TYPES, CUISINES, DIETS, ALLERGIES, ACCESSIBILITY, LATEST_RETURN_HOURS } from '../../core/profile-model.js';
import { CONFLICT_RULES, WISH_KEYS, normalizeAppointmentPrefs, resolveRequirements } from '../../core/requirements.js';
import { getGroup } from '../../data/groups.js';
import { getPerson } from '../../data/people.js';
import { getDraft, updateDraft, stepHeader } from './flow.js';

const WISH_LABEL_KEYS = { terrace: 'terrace', kid_friendly: 'kidFriendly', dog_friendly: 'dogFriendly', quiet: 'quiet' };
const options = (values, labelOf) => values.map((value) => ({ value, label: labelOf(value) }));

export async function renderStepPrefs(container) {
  const draft = getDraft();
  const group = draft?.groupId && (await getGroup(draft.groupId));
  if (!group || !draft.date) {
    location.replace(group ? '#/nieuw/wanneer' : '#/nieuw');
    return;
  }
  const people = (await Promise.all(group.members.map((m) => getPerson(m.user_id)))).filter(Boolean);
  const prefs = normalizeAppointmentPrefs(draft.preferences);

  container.innerHTML = `
    <section class="screen wizard">
      ${stepHeader(3, t.newAppointment.stepPrefs)}
      <form class="form" data-form novalidate>
        <div class="card form">
          ${toggleRow('include', t.apptPrefs.includeLabel, prefs.include_participants, t.apptPrefs.includeWhy)}
          <div class="req-people">${people.map(personChip).join('')}</div>
        </div>

        <div class="card form" data-rule-card>
          ${fieldset(t.apptPrefs.ruleTitle, ruleOptions(prefs.conflict_rule), t.apptPrefs.allergyNote)}
        </div>

        <details class="card form" ${organizerOpen(prefs) ? 'open' : ''}>
          <summary class="card-title">${t.apptPrefs.organizerTitle}</summary>
          ${why(t.apptPrefs.organizerHint)}
          ${organizerFields(prefs.organizer)}
        </details>

        <div class="card form" aria-live="polite">
          <h2 class="card-title">${t.apptPrefs.summaryTitle}</h2>
          <div data-summary></div>
        </div>
      </form>

      <div class="flow-actions">
        <button type="button" class="btn btn-primary btn-large" data-next>${t.apptPrefs.next}</button>
      </div>
    </section>`;

  const form = container.querySelector('[data-form]');
  form.addEventListener('submit', (event) => event.preventDefault());

  const refresh = () => {
    const current = readPrefs(form, group.owner_id);
    updateDraft({ preferences: current });
    form.closest('section').querySelector('[data-rule-card]').hidden = !current.include_participants;
    container.querySelector('[data-summary]').innerHTML = requirementsSummary(resolveRequirements(people, current));
    container.querySelector('[data-max-out]').textContent = minutesLabel(current.organizer.max_minutes);
  };
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh();

  container.querySelector('[data-next]').addEventListener('click', () => navigate('/nieuw/waar'));
}

const minutesLabel = (n) => (n ? t.profile.travel.minutes(n) : t.apptPrefs.noLimit);

function personChip(person) {
  const has = Boolean(person.preferences);
  return `
    <span class="req-person ${has ? '' : 'muted'}">
      ${avatar(person, 28)}
      <span>${esc(person.name)} <small>· ${has ? t.apptPrefs.hasPrefs : t.apptPrefs.noPrefs}</small></span>
    </span>`;
}

function ruleOptions(selected) {
  return `
    <div class="rule-list" role="radiogroup">
      ${CONFLICT_RULES.map(
        (rule) => `
        <label class="rule-option">
          <input type="radio" name="rule" value="${rule}" ${rule === selected ? 'checked' : ''} />
          <span><strong>${t.apptPrefs.rules[rule].title}</strong><small>${t.apptPrefs.rules[rule].hint}</small></span>
        </label>`,
      ).join('')}
    </div>`;
}

const organizerOpen = (prefs) => JSON.stringify(prefs.organizer) !== JSON.stringify(normalizeAppointmentPrefs({}).organizer);

function organizerFields(o) {
  const text = t.profile.dining;
  const unset = { value: '', label: t.apptPrefs.unset };
  const wishOptions = [unset, { value: 'prefer', label: text.wish.prefer }, { value: 'must', label: text.wish.must }];
  const priceOptions = [unset, ...[1, 2, 3, 4].map((n) => ({ value: n, label: '€'.repeat(n) }))];
  const returnOptions = LATEST_RETURN_HOURS.map((h) => ({ value: h, label: h ? t.profile.travel.returnOptions[h] : t.apptPrefs.noLimit }));

  return `
    ${fieldset(text.placeTypes, chipGroup('o_types', options(PLACE_TYPES, (p) => t.placeTypes[p]), o.types))}
    ${fieldset(text.cuisines, chipGroup('o_cuisines', options(CUISINES, (c) => c), o.cuisines))}
    ${fieldset(text.diets, chipGroup('o_diets', options(DIETS, (d) => text.dietOptions[d]), o.diets))}
    ${fieldset(text.allergies, chipGroup('o_allergies', options(ALLERGIES, (a) => text.allergyOptions[a]), o.allergies))}
    ${fieldset(t.profile.travel.accessibility, chipGroup('o_access', options(ACCESSIBILITY, (a) => t.profile.travel.accessibilityOptions[a]), o.accessibility))}
    ${selectField('o_price', text.price, priceOptions, o.max_price ?? '')}
    ${WISH_KEYS.map((key) => selectField(`o_${key}`, text[WISH_LABEL_KEYS[key]], wishOptions, o.wishes[key] ?? '')).join('')}
    <label class="field">
      <span class="field-label">${t.apptPrefs.maxMinutes} <output class="mono" data-max-out>${minutesLabel(o.max_minutes)}</output></span>
      <input type="range" name="o_max_minutes" min="0" max="180" step="15" value="${o.max_minutes}" />
    </label>
    ${selectField('o_return', t.apptPrefs.latestReturn, returnOptions, o.latest_return_hour)}`;
}

function readPrefs(form, organizerId) {
  const price = Number(form.elements.o_price.value);
  return normalizeAppointmentPrefs({
    include_participants: form.elements.include.checked,
    conflict_rule: form.elements.rule.value,
    set_by: organizerId,
    organizer: {
      types: checkedValues(form, 'o_types'),
      cuisines: checkedValues(form, 'o_cuisines'),
      diets: checkedValues(form, 'o_diets'),
      allergies: checkedValues(form, 'o_allergies'),
      accessibility: checkedValues(form, 'o_access'),
      max_price: price || null,
      wishes: Object.fromEntries(WISH_KEYS.filter((k) => form.elements[`o_${k}`].value).map((k) => [k, form.elements[`o_${k}`].value])),
      max_minutes: Number(form.elements.o_max_minutes.value),
      latest_return_hour: Number(form.elements.o_return.value),
    },
  });
}
