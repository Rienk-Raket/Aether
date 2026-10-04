// Demo-receivers: pretends that other people react while you use the app.
//  - a person you "invited" adds their start point after a few seconds
//  - group members cast their vote a few seconds after a vote started
// Nothing here talks to a server; it only changes the data on this device and tells the screens.

import { listPeople, savePerson, addLocation } from '../data/people.js';
import { listGroups } from '../data/groups.js';
import { listAppointments, getAppointment, saveAppointment } from '../data/appointments.js';
import { logActivity } from '../data/activity.js';
import { arrivedVotes } from '../core/poll.js';
import { hashKey } from '../core/hash.js';
import { loadBundledJson } from './mock/network.js';
import { t } from '../i18n/nl.js';

const TICK_MS = 2500;
const MODES = ['transit', 'bike', 'car'];

export function startSimulation() {
  const run = () => tick().catch((error) => console.error(error));
  setInterval(run, TICK_MS);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && run());
  run();
}

export async function tick() {
  const changedInvites = await completeInvites();
  const changedVotes = await announceVotes();
  if (changedInvites || changedVotes) document.dispatchEvent(new CustomEvent('aether:data'));
}

// Invited people whose time has come choose a start address (stable per name).
async function completeInvites() {
  const waiting = (await listPeople()).filter((p) => p.pending_until && p.pending_until <= Date.now());
  if (!waiting.length) return false;

  const { entries } = await loadBundledJson('data/addresses.json');
  const addresses = entries.filter((e) => e.kind === 'address');
  const groups = await listGroups();

  for (const person of waiting) {
    const pick = addresses[parseInt(hashKey(`home:${person.id}`), 36) % addresses.length];
    addLocation(person, {
      label: t.form.defaultLabel,
      place: { address: pick.address, lat: pick.lat, lng: pick.lng },
      transport: MODES[parseInt(hashKey(`mode:${person.id}`), 36) % MODES.length],
    });
    delete person.pending_until;
    await savePerson(person);
    const group = groups.find((g) => g.members.some((m) => m.user_id === person.id));
    await logActivity('member', t.activity.locationAdded(person.name), group?.name ?? '', group ? `#/groepen/${group.id}` : '');
  }
  return true;
}

// Votes that arrived since the last tick get a line in the activity feed (once).
async function announceVotes() {
  let changed = false;
  const people = new Map((await listPeople()).map((p) => [p.id, p]));

  for (const appointment of await listAppointments()) {
    const poll = appointment.poll;
    if (!poll || poll.closed_at) continue;

    const news = Object.entries(arrivedVotes(poll)).filter(([, vote]) => vote.simulated && !vote.announced);
    if (!news.length) continue;

    // Mark first (on the newest saved version), so a vote is never announced twice.
    const fresh = (await getAppointment(appointment.id)) ?? appointment;
    for (const [personId] of news) if (fresh.poll?.votes[personId]) fresh.poll.votes[personId].announced = true;
    await saveAppointment(fresh);

    for (const [personId, vote] of news) {
      const option = poll.options.find((o) => o.id === vote.option_id);
      await logActivity('vote', t.activity.someoneVoted(people.get(personId)?.name ?? '?'), option?.name ?? '', `#/ontdek?afspraak=${appointment.id}`);
    }
    changed = true;
  }
  return changed;
}
