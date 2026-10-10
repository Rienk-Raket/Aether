// Profiles: several people can share one device. A profile is a person with is_self = true;
// the active one is remembered in localStorage (see people.js).

import { listPeople, getPerson, savePerson, deletePerson, newPerson, ensureSelf, getActiveId, setActiveId } from './people.js';

export async function listProfiles() {
  const people = await listPeople();
  return people.filter((p) => p.is_self).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function activeProfile() {
  return ensureSelf();
}

// Makes a profile the active one and tells the shell to refresh the name and avatar.
export async function switchProfile(id) {
  if (!(await getPerson(id))) return null;
  setActiveId(id);
  announceProfileChange();
  return getPerson(id);
}

// kind: 'personal' | 'business'. `preferences` and `business` come from the profile cards
// (core/profile-deck.js); `answers` are kept so the cards can be redone later.
export async function createProfile(name, { kind = 'personal', preferences = null, business = null, work = null, answers = {} } = {}) {
  const person = newPerson({ name, isSelf: true });
  person.kind = kind;
  if (preferences) person.preferences = preferences;
  if (business) person.business = business;
  if (work) person.work = work;
  person.deck_answers = answers;
  const profile = await savePerson(person);
  await switchProfile(profile.id);
  return profile;
}

// Redoing the cards of an existing profile.
export async function updateProfileFromDeck(id, { preferences, business, work, answers }) {
  const person = await getPerson(id);
  if (!person) return null;
  if (preferences) person.preferences = preferences;
  if (business) person.business = business;
  if (work) person.work = work;
  person.deck_answers = answers;
  await savePerson(person);
  announceProfileChange();
  return person;
}

export const profileKind = (person) => (['business', 'work'].includes(person?.kind) ? person.kind : 'personal');

// The last profile cannot be removed. Returns false when nothing was deleted.
export async function removeProfile(id) {
  const profiles = await listProfiles();
  if (profiles.length < 2) return false;
  const wasActive = getActiveId() === id;
  await deletePerson(id);
  if (wasActive) await switchProfile(profiles.find((p) => p.id !== id).id);
  announceProfileChange();
  return true;
}

function announceProfileChange() {
  document.dispatchEvent(new CustomEvent('aether:profile'));
}
