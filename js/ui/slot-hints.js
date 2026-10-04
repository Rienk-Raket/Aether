// "When can everyone?" in the date step: the best moments for the group, and a hint about the
// moment that is currently selected.

import { t } from '../i18n/nl.js';
import { esc } from './dom.js';
import { scoreSlot, bestSlots } from '../core/slots.js';
import { combine, formatTime } from '../core/dates.js';
import { getGroup } from '../data/groups.js';
import { draftParticipants, toTravelers } from '../data/slot-travelers.js';

export const reasonText = (reason) => {
  const text = t.slots.reasons[reason.code];
  return typeof text === 'function' ? text(esc(reason.name)) : text;
};

const dayLabel = (date) => date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });

export const hintHtml = (result) => `
  <p class="slot-level level-${result.level}"><strong>${t.slots.levels[result.level]}</strong></p>
  ${result.reasons.map((r) => `<p class="pref-note">${reasonText(r)}</p>`).join('')}`;

// slots: { best, hint } — elements to fill. draft(): current draft. onPick(date): a best moment was chosen.
// Returns { update() } to call when the draft changes; does nothing when nobody has a start location.
export async function attachSlotHints(slots, { draft, onPick }) {
  const current = draft();
  const group = await getGroup(current.groupId);
  if (!group) return { update() {} };
  const travelers = toTravelers(await draftParticipants(group, current.participants), current.preferences);
  if (!travelers.length) {
    slots.hint.innerHTML = `<p class="muted small">${t.slots.noLocations}</p>`;
    return { update() {} };
  }

  const top = bestSlots({ from: new Date(), durationMinutes: current.duration, travelers, count: 3 });
  slots.best.innerHTML = `
    <span class="field-label">${t.slots.bestTitle}</span>
    <div class="chips">${top
      .map((s, i) => `<button type="button" class="chip-btn" data-best="${i}" title="${esc(s.reasons.map(reasonText).join(', '))}"><span class="dot level-${s.level}"></span> ${esc(dayLabel(s.start))} ${formatTime(s.start)}</button>`)
      .join('')}</div>
    <p class="muted small">${t.slots.estimateNote}</p>`;
  slots.best.querySelectorAll('[data-best]').forEach((b) => b.addEventListener('click', () => onPick(top[Number(b.dataset.best)].start)));

  return {
    update() {
      const d = draft();
      if (!d.date) {
        slots.hint.innerHTML = '';
        return;
      }
      const result = scoreSlot({ start: combine(d.date, d.hour, d.minute), durationMinutes: d.duration, travelers });
      slots.hint.innerHTML = hintHtml(result);
    },
  };
}
