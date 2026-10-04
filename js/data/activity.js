// Activity feed: a log of what happened in the app, newest first.
// The bell in the top bar shows a dot when there is something newer than the last visit to "Activiteit".

import { getDB, newId, now } from './db.js';

const SEEN_KEY = 'aether.activitySeen';
const MAX_ITEMS = 200;

// type: 'group' | 'member' | 'appointment' | 'place' | 'demo' | 'system'
// href is an optional in-app link ("#/groepen/abc").
export async function logActivity(type, title, detail = '', href = '') {
  const db = await getDB();
  await db.put('activity', { id: newId(), type, title, detail, href, at: now() });
  document.dispatchEvent(new CustomEvent('aether:activity'));
}

export async function listActivity() {
  const items = await (await getDB()).getAll('activity');
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS);
}

export function lastSeen() {
  return localStorage.getItem(SEEN_KEY) ?? '';
}

export function markActivitySeen() {
  localStorage.setItem(SEEN_KEY, now());
  document.dispatchEvent(new CustomEvent('aether:activity'));
}

export async function hasUnseenActivity() {
  const seen = lastSeen();
  const items = await listActivity();
  return items.length > 0 && items[0].at > seen;
}
