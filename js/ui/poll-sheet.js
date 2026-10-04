// The voting sheet: start a vote on the top 3 areas, see the votes arrive, vote yourself and
// finish with a winner. In this demo the other members are simulated (see services/simulation.js).

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc, initials, hueFor } from './dom.js';
import { openSheet } from './modal.js';
import { showToast } from './toast.js';
import { getAppointment } from '../data/appointments.js';
import { startPoll, voteFor, finishPoll, resetPoll } from '../data/polls.js';
import { tally, leader, progress, shortlist } from '../core/poll.js';
import { rankCandidates } from '../core/fairness.js';
import { fairnessLevel } from '../core/levels.js';

// data: result of loadResults(). Resolves when the sheet is closed.
export function openPollSheet(data, { alpha, selfId }) {
  const appointment = data.appointment;
  const people = new Map(data.participants.map((p) => [p.id, p]));
  const selfCanVote = people.has(selfId);
  let timer;
  let onData;

  const sheet = openSheet({
    title: t.poll.title,
    body: '<div class="poll" data-poll aria-live="polite"></div>',
    setup(el, close) {
      const root = el.querySelector('[data-poll]');
      let lastKey = '';

      // Draws the sheet, but only when something changed, so a click is never lost to a redraw.
      const render = (force = false) => {
        const key = JSON.stringify([appointment.poll ? tally(appointment.poll) : null, appointment.poll?.closed_at]);
        if (!force && key === lastKey) return;
        lastKey = key;
        root.innerHTML = appointment.poll ? pollView() : previewView();
      };

      const reload = async () => {
        const fresh = await getAppointment(appointment.id);
        Object.assign(appointment, fresh);
        if (!fresh.poll) delete appointment.poll;
        render(true);
      };

      onData = reload;
      document.addEventListener('aether:data', onData);
      timer = setInterval(() => render(), 1000); // votes "arrive" as time passes

      root.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.start !== undefined) await startPoll(appointment, data, alpha, selfId);
        if (button.dataset.vote) await voteFor(appointment, selfId, button.dataset.vote);
        if (button.dataset.reset !== undefined) await resetPoll(appointment);
        if (button.dataset.finish !== undefined) {
          const winner = await finishPoll(appointment, data, alpha);
          showToast(t.poll.won(winner.name));
        }
        if (button.dataset.done !== undefined) close(true);
        render(true);
      });

      render(true);
    },
  });

  sheet.then(() => {
    clearInterval(timer);
    document.removeEventListener('aether:data', onData);
  });
  return sheet;

  // ---------- views ----------

  function previewView() {
    const options = shortlist(rankCandidates(data.candidates, alpha));
    return `
      <p class="muted">${t.poll.intro}</p>
      <div class="place-list">${options.map((o, i) => optionPreview(o, i + 1)).join('')}</div>
      <p class="notice">${t.poll.demoNote}</p>
      ${selfCanVote ? '' : `<p class="notice">${t.poll.notParticipant}</p>`}
      <div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" data-start>${icon('check')} ${t.poll.start}</button></div>`;
  }

  function optionPreview(option, rank) {
    return `
      <div class="place">
        <div class="thumb">${rank}</div>
        <div><h3>${esc(option.name)}</h3><p>${t.results.avg} ${option.mean} min</p></div>
        <div class="score"><strong class="level-${fairnessLevel(option.fairness)}">${Math.round(option.fairness * 100)}</strong><small>${t.results.fairnessWord}</small></div>
      </div>`;
  }

  function pollView() {
    const poll = appointment.poll;
    const counts = tally(poll);
    const voterTotal = data.participants.length;
    const { voted } = progress(poll, voterTotal);
    const mine = poll.votes[selfId]?.option_id;
    const closed = Boolean(poll.closed_at);
    const best = leader(poll);
    const maxVotes = Math.max(1, ...Object.values(counts).map((ids) => ids.length));

    const rows = poll.options.map((o) => {
      const ids = counts[o.id];
      const isWinner = closed && poll.winner_id === o.id;
      return `
        <div class="vote-option ${mine === o.id ? 'mine' : ''} ${isWinner ? 'winner' : ''}">
          <div class="vote-head">
            <strong>${esc(o.name)} ${isWinner ? `<span class="badge">${t.poll.winner}</span>` : ''}</strong>
            <span class="muted small">${t.results.fairness} ${Math.round(o.fairness * 100)} · ${t.results.avg} ${o.mean} min</span>
          </div>
          <div class="vote-bar" role="presentation"><span style="width:${(ids.length / maxVotes) * 100}%"></span></div>
          <div class="vote-foot">
            <span class="voters">${ids.map(voterChip).join('')}<span class="muted small">${t.poll.votes(ids.length)}</span></span>
            ${closed || !selfCanVote ? '' : `<button type="button" class="btn btn-small ${mine === o.id ? 'btn-primary' : ''}" data-vote="${esc(o.id)}">${mine === o.id ? `${icon('check')} ${t.poll.yourVote}` : t.poll.vote}</button>`}
          </div>
        </div>`;
    });

    return `
      <p class="muted" role="status">${closed ? t.poll.closedInfo(voted, voterTotal) : t.poll.progress(voted, voterTotal)}</p>
      <div class="vote-list">${rows.join('')}</div>
      ${closed ? '' : `<p class="small">${voted > 0 ? t.poll.leading(esc(best.name)) : t.poll.waiting}</p>`}
      <p class="notice">${t.poll.demoNote}</p>
      <div class="sheet-actions">
        <button type="button" class="btn" data-reset>${t.poll.restart}</button>
        ${closed ? `<button type="button" class="btn btn-primary" data-done>${t.poll.done}</button>` : `<button type="button" class="btn btn-primary" data-finish ${voted === 0 ? 'disabled' : ''}>${icon('check')} ${t.poll.finish}</button>`}
      </div>`;
  }

  function voterChip(personId) {
    const person = people.get(personId);
    if (!person) return '';
    return `<span class="mini-avatar" style="--hue:${hueFor(person.id)}" title="${esc(person.name)}">${esc(initials(person.name))}</span>`;
  }
}
