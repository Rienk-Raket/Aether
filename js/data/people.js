// People: you ("self") and your contacts. Each person has a list of start locations.

import { getDB, newId, now } from './db.js';

const SELF_KEY = 'aether.selfId';

export const DEFAULT_PREFERENCES = {
  default_transport: 'transit',
  budget_level: 2,
  preferred_types: ['cafe', 'restaurant'],
  accessibility: [],
  fairness_priority: 0.7,
  theme: 'dark',
  language: 'nl',
};

export async function getPerson(id) {
  return (await getDB()).get('people', id);
}

export async function listPeople() {
  return (await getDB()).getAll('people');
}

export async function savePerson(person) {
  await (await getDB()).put('people', person);
  return person;
}

export async function deletePerson(id) {
  await (await getDB()).delete('people', id);
}

export function newPerson({ name, isSelf = false }) {
  return {
    id: newId(),
    name,
    is_self: isSelf,
    created_at: now(),
    reputation_score: 0.5,
    preferences: isSelf ? { ...DEFAULT_PREFERENCES } : null,
    locations: [],
  };
}

// Creates "you" on first use. The id is kept in localStorage, as described in the spec.
// Several callers may ask at the same moment at startup: they share one pending request,
// otherwise each would create its own profile.
let pendingSelf = null;

export function ensureSelf() {
  pendingSelf ??= findOrCreateSelf().finally(() => (pendingSelf = null));
  return pendingSelf;
}

async function findOrCreateSelf() {
  const id = localStorage.getItem(SELF_KEY);
  const existing = id && (await getPerson(id));
  if (existing) return existing;

  const self = await savePerson(newPerson({ name: 'Jij', isSelf: true }));
  localStorage.setItem(SELF_KEY, self.id);
  return self;
}

export const getActiveId = () => localStorage.getItem(SELF_KEY);
export const setActiveId = (id) => localStorage.setItem(SELF_KEY, id);

export function forgetSelf() {
  localStorage.removeItem(SELF_KEY);
}

// place: { address, lat, lng }
export function addLocation(person, { label, place, transport }) {
  const location = {
    id: newId(),
    user_id: person.id,
    label,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    transport_mode: transport,
    is_default: person.locations.length === 0,
  };
  person.locations.push(location);
  return location;
}

export function removeLocation(person, locationId) {
  person.locations = person.locations.filter((l) => l.id !== locationId);
  if (person.locations.length && !person.locations.some((l) => l.is_default)) {
    person.locations[0].is_default = true;
  }
}

export function defaultLocation(person) {
  return person?.locations.find((l) => l.is_default) ?? person?.locations[0] ?? null;
}
