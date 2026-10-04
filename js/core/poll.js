// A vote on the meeting place. The group votes on a shortlist of areas (the top of the ranking).
// In demo mode the other members are simulated: each "votes" for the option that suits their own
// trip best, a little blurred, and their vote arrives a few seconds after the vote started.
//
// poll = { id, created_at, options: [{ id, name, lat, lng, fairness, mean }], votes: { [personId]:
//   { option_id, at, simulated } }, closed_at: null|ISO, winner_id: null|string }

import { hashKey } from './hash.js';

export const SHORTLIST_SIZE = 3;

// Options are ranked candidates { id, name, lat, lng, fairness, stats: { mean } }.
export function shortlist(ranked) {
  return ranked.slice(0, SHORTLIST_SIZE).map((c) => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    fairness: Number(c.fairness.toFixed(2)),
    mean: Math.round(c.stats.mean),
  }));
}

// Stable "noise" between 0 and 1 for a (person, option) pair — no random numbers, so reloading
// the page never changes anybody's vote.
const noise = (personId, optionId) => (parseInt(hashKey(`${personId}:${optionId}`), 36) % 1000) / 1000;

// People vote for what is shortest for themselves, ±20% blurred.
export function simulatedChoice(personId, timesPerOption) {
  let best = null;
  for (const [optionId, minutes] of Object.entries(timesPerOption)) {
    const score = minutes * (0.9 + 0.2 * noise(personId, optionId));
    if (!best || score < best.score) best = { optionId, score };
  }
  return best.optionId;
}

// participants: [{ id, name }]; times: { [personId]: { [optionId]: minutes } }
// selfId votes for itself later; every other participant gets a simulated vote that arrives
// 4–14 seconds (stable per person) after `createdAt` (a Date).
export function createPoll({ id, options, participants, selfId, times, createdAt }) {
  const votes = {};
  for (const p of participants) {
    if (p.id === selfId) continue;
    const delayMs = 4000 + (parseInt(hashKey(`delay:${p.id}`), 36) % 10) * 1000;
    votes[p.id] = {
      option_id: simulatedChoice(p.id, times[p.id]),
      at: new Date(createdAt.getTime() + delayMs).toISOString(),
      simulated: true,
    };
  }
  return { id, created_at: createdAt.toISOString(), options, votes, closed_at: null, winner_id: null };
}

// Votes that have arrived by `now`.
export function arrivedVotes(poll, now = new Date()) {
  return Object.fromEntries(Object.entries(poll.votes).filter(([, v]) => new Date(v.at) <= now));
}

// { [optionId]: [personId, ...] } for every option, also those without votes.
export function tally(poll, now = new Date()) {
  const result = Object.fromEntries(poll.options.map((o) => [o.id, []]));
  for (const [personId, vote] of Object.entries(arrivedVotes(poll, now))) result[vote.option_id]?.push(personId);
  return result;
}

// Option with the most votes; ties go to the fairest option, then to the shortest average trip.
export function leader(poll, now = new Date()) {
  const counts = tally(poll, now);
  return [...poll.options].sort(
    (a, b) => counts[b.id].length - counts[a.id].length || b.fairness - a.fairness || a.mean - b.mean,
  )[0];
}

export function castVote(poll, personId, optionId, now = new Date()) {
  if (poll.closed_at) return poll;
  if (!poll.options.some((o) => o.id === optionId)) throw new Error('Unknown option');
  return { ...poll, votes: { ...poll.votes, [personId]: { option_id: optionId, at: now.toISOString(), simulated: false } } };
}

// How many of `voterCount` participants have voted.
export function progress(poll, voterCount, now = new Date()) {
  return { voted: Object.keys(arrivedVotes(poll, now)).length, total: voterCount };
}

export function closePoll(poll, now = new Date()) {
  const winner = leader(poll, now);
  return { ...poll, closed_at: now.toISOString(), winner_id: winner.id };
}
