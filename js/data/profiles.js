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

export async function createProfile(name) {
  const profile = await savePerson(newPerson({ name, isSelf: true }));
  await switchProfile(profile.id);
  return profile;
}

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
