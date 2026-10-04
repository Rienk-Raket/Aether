// Groups of people that meet up. Members point to people by id.

import { getDB, newId, now } from './db.js';

export async function getGroup(id) {
  return (await getDB()).get('groups', id);
}

// Most recently used (or created) first.
export async function listGroups() {
  const groups = await (await getDB()).getAll('groups');
  return groups.sort((a, b) => (b.last_used_at ?? b.created_at).localeCompare(a.last_used_at ?? a.created_at));
}

export async function saveGroup(group) {
  await (await getDB()).put('groups', group);
  return group;
}

export function newGroup({ name, description = '', owner }) {
  return {
    id: newId(),
    name,
    owner_id: owner.id,
    created_at: now(),
    last_used_at: null,
    description,
    members: [{ user_id: owner.id, joined_at: now(), invite_method: 'link' }],
    default_preferences: { transport: null, budget: 2, types: [] },
    notification_enabled: true,
  };
}

export function addMember(group, personId, inviteMethod = 'link') {
  if (group.members.some((m) => m.user_id === personId)) return;
  group.members.push({ user_id: personId, joined_at: now(), invite_method: inviteMethod });
}

export function removeMember(group, personId) {
  group.members = group.members.filter((m) => m.user_id !== personId);
}

// Deletes the group and its appointments in one transaction.
export async function deleteGroup(id) {
  const db = await getDB();
  const tx = db.transaction(['groups', 'appointments'], 'readwrite');
  const keys = await tx.objectStore('appointments').index('group_id').getAllKeys(id);
  await Promise.all([...keys.map((key) => tx.objectStore('appointments').delete(key)), tx.objectStore('groups').delete(id)]);
  await tx.done;
}
