// Saving the vote on an appointment. The pure rules are in core/poll.js.

import { newId } from './db.js';
import { getAppointment, saveAppointment } from './appointments.js';
import { logActivity } from './activity.js';
import { createPoll, shortlist, castVote, closePoll, tally } from '../core/poll.js';
import { rankCandidates } from '../core/fairness.js';
import { areaSelection } from '../core/selection.js';
import { t } from '../i18n/nl.js';

const announce = () => document.dispatchEvent(new CustomEvent('aether:data'));

// The background simulation also saves appointments. So every change starts from the newest
// saved version, and the caller's copy is brought up to date afterwards.
async function update(appointment, change) {
  const fresh = (await getAppointment(appointment.id)) ?? appointment;
  const result = await change(fresh);
  await saveAppointment(fresh);
  Object.assign(appointment, fresh);
  if (!fresh.poll) delete appointment.poll;
  return result;
}

// data: result of loadResults(); alpha: slider position; selfId: the user's person id.
export async function startPoll(appointment, data, alpha, selfId) {
  const options = shortlist(rankCandidates(data.candidates, alpha));
  const times = {};
  data.participants.forEach((p, i) => {
    times[p.id] = {};
    for (const option of options) times[p.id][option.id] = data.candidates.find((c) => c.id === option.id).times[i];
  });

  await update(appointment, (fresh) => {
    fresh.poll = createPoll({ id: newId(), options, participants: data.participants, selfId, times, createdAt: new Date() });
  });
  await logActivity('vote', t.activity.pollStarted(data.group?.name ?? ''), options.map((o) => o.name).join(', '), `#/ontdek?afspraak=${appointment.id}`);
  announce();
}

export async function voteFor(appointment, selfId, optionId) {
  await update(appointment, (fresh) => {
    fresh.poll = castVote(fresh.poll, selfId, optionId);
  });
  const option = appointment.poll.options.find((o) => o.id === optionId);
  await logActivity('vote', t.activity.youVoted(option.name), '', `#/ontdek?afspraak=${appointment.id}`);
  announce();
}

// Ends the vote and stores the winning area in the appointment.
export async function finishPoll(appointment, data, alpha) {
  const winner = await update(appointment, (fresh) => {
    fresh.poll = closePoll(fresh.poll);
    const won = fresh.poll.options.find((o) => o.id === fresh.poll.winner_id);
    Object.assign(fresh, areaSelection(data.candidates.find((c) => c.id === won.id), alpha));
    return won;
  });

  const votes = tally(appointment.poll)[winner.id].length;
  const total = Object.keys(appointment.poll.votes).length;
  await logActivity('vote', t.activity.pollWon(winner.name), t.activity.pollVotes(votes, total), `#/ontdek?afspraak=${appointment.id}`);
  announce();
  return winner;
}

export async function resetPoll(appointment) {
  await update(appointment, (fresh) => {
    delete fresh.poll;
  });
  announce();
}
