// State of the "Nieuwe afspraak" flow while the user goes through the steps.
// Kept in sessionStorage so a page reload in the middle of the flow loses nothing.

import { t } from '../../i18n/nl.js';
import { defaultAppointmentPrefs } from '../../core/requirements.js';

const KEY = 'aether.draft';

export function getDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function startDraft(groupId) {
  const draft = {
    groupId,
    date: null, // "YYYY-MM-DD"
    hour: 19,
    minute: 0,
    duration: 90,
    notes: '',
    preferences: defaultAppointmentPrefs(),
    participants: {}, // personId → { location_id, transport_mode }
  };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  return draft;
}

export function updateDraft(patch) {
  const draft = { ...getDraft(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  return draft;
}

export function clearDraft() {
  sessionStorage.removeItem(KEY);
}

export function stepHeader(step, title) {
  return `
    <div class="screen-header step-header">
      <div>
        <div class="eyebrow">${t.newAppointment.step(step, title)}</div>
        <h1 class="section-gap">${t.newAppointment.title}</h1>
      </div>
    </div>`;
}
