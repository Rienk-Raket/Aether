// The demo business account of this device (localStorage). In a real product this would be a
// server database; the shape is the same so only this file and business-api.js would change.

import { buildDemoState, newBusinessState } from './seed.js';

const KEY = 'aether.business';
let memory = null;

export function getState() {
  if (memory) return memory;
  try {
    memory = JSON.parse(localStorage.getItem(KEY));
  } catch {
    memory = null;
  }
  return memory;
}

export function saveState(state) {
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked: the change lasts until the page is closed
  }
  document.dispatchEvent(new CustomEvent('aether:business'));
  return state;
}

export const hasBusiness = () => Boolean(getState());

// mode 'trial': a fresh sign-up with 30 days Groei. mode 'demo': a ready-made account with history.
export function createBusiness(venue, mode, owner = { name: 'Sanne Bakker', email: 'sanne@example.test' }) {
  return saveState(mode === 'demo' ? buildDemoState(venue) : newBusinessState(venue, owner));
}

export function resetBusiness() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(`${KEY}.venue`);
  } catch {
    // nothing to clean
  }
  document.dispatchEvent(new CustomEvent('aether:business'));
}

export function update(change) {
  const state = structuredClone(getState());
  change(state);
  return saveState(state);
}

export const currentUser = (state = getState()) => state.users.find((u) => u.id === state.current_user) ?? state.users[0];

// Edits made in "Mijn zaak": merged into the venue list that "Ontdek plekken" shows.
export function getVenueOverrides() {
  try {
    return JSON.parse(localStorage.getItem(`${KEY}.venue`)) ?? null;
  } catch {
    return null;
  }
}

export function saveVenueOverrides(venueId, fields) {
  try {
    localStorage.setItem(`${KEY}.venue`, JSON.stringify({ venue_id: venueId, fields }));
  } catch {
    // not remembered
  }
}

// Applies the saved edits to one venue / a venue list (used by the Plekwijzer mock, so that
// "Ontdek plekken" shows what the owner changed).
export function applyOverrides(venue) {
  const saved = getVenueOverrides();
  return saved && saved.venue_id === venue.id ? { ...venue, ...saved.fields } : venue;
}

export const applyOverridesToList = (venues) => venues.map(applyOverrides);
