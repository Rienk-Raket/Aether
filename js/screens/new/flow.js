// State of the "Nieuwe afspraak" flow while the user goes through the steps.
// Kept in sessionStorage so a page reload in the middle of the flow loses nothing.

import { t } from '../../i18n/nl.js';

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
    <header class="screen-header step-header">
      <h1 class="gradient-text">${t.newAppointment.title}</h1>
      <span class="step-label mono">${t.newAppointment.step(step, title)}</span>
    </header>`;
}
