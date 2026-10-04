// Nieuwe afspraak — Stap 2: date, time, duration, optional notes.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { createDatePicker } from '../../ui/datepicker.js';
import { navigate } from '../../router.js';
import { combine, dayKey, suggestions, addMinutes, formatTime, formatDuration } from '../../core/dates.js';
import { attachSlotHints } from '../../ui/slot-hints.js';
import { getDraft, updateDraft, stepHeader } from './flow.js';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07–23
const MINUTES = [0, 15, 30, 45];
const pad = (n) => String(n).padStart(2, '0');

export function renderStepWhen(container) {
  let draft = getDraft();
  if (!draft?.groupId) {
    location.replace('#/nieuw');
    return;
  }

  const chips = suggestions();

  container.innerHTML = `
    <section class="screen wizard">
      ${stepHeader(2, t.newAppointment.stepWhen)}

      <div class="card section-gap" data-best></div>

      <div class="chips section-gap" aria-label="${t.newAppointment.suggestions}">
        ${chips.map((d, i) => `<button type="button" class="chip-btn" data-suggestion="${i}">${esc(suggestionLabel(d))}</button>`).join('')}
      </div>

      <div class="card section-gap" data-calendar></div>

      <div class="card section-gap">
        <span class="field-label">${t.newAppointment.time}</span>
        <div class="chip-scroll" data-hours>
          ${HOURS.map((h) => `<button type="button" class="chip-btn" data-hour="${h}">${pad(h)}</button>`).join('')}
        </div>
        <div class="chips" data-minutes>
          ${MINUTES.map((m) => `<button type="button" class="chip-btn" data-minute="${m}">:${pad(m)}</button>`).join('')}
        </div>

        <label class="field section-gap">
          <span class="field-label">${t.newAppointment.duration} <output class="mono" data-duration-out></output></span>
          <input type="range" min="30" max="180" step="15" value="${draft.duration}" data-duration />
        </label>
      </div>

      <details class="card accordion section-gap" ${draft.notes ? 'open' : ''}>
        <summary>${t.common.optional}</summary>
        <label class="field">
          <span class="field-label">${t.newAppointment.notes}</span>
          <textarea rows="3" maxlength="300" data-notes placeholder="${t.newAppointment.notesPlaceholder}">${esc(draft.notes)}</textarea>
        </label>
      </details>

      <div class="section-gap" data-slot-hint aria-live="polite"></div>
      <p class="form-error" role="alert" data-error></p>
      <div class="flow-actions">
        <button type="button" class="btn btn-primary btn-large" data-next>${t.common.next}</button>
      </div>
    </section>`;

  const calendar = createDatePicker(container.querySelector('[data-calendar]'), {
    value: draft.date,
    onChange: (date) => save({ date }),
  });

  function save(patch) {
    draft = updateDraft(patch);
    refresh();
  }

  // Updates the selected chips and the "until 20:30" preview without re-rendering everything.
  let hints = { update() {} };
  function refresh() {
    hints.update();
    container.querySelectorAll('[data-hour]').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.hour) === draft.hour));
    container.querySelectorAll('[data-minute]').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.minute) === draft.minute));
    const start = combine(draft.date ?? dayKey(new Date()), draft.hour, draft.minute);
    container.querySelector('[data-duration-out]').textContent =
      `${formatDuration(draft.duration)} · ${t.newAppointment.until(formatTime(addMinutes(start, draft.duration)))}`;
    container.querySelector('[data-error]').textContent = '';
  }

  container.querySelectorAll('[data-hour]').forEach((b) => b.addEventListener('click', () => save({ hour: Number(b.dataset.hour) })));
  container.querySelectorAll('[data-minute]').forEach((b) => b.addEventListener('click', () => save({ minute: Number(b.dataset.minute) })));
  container.querySelector('[data-duration]').addEventListener('input', (e) => save({ duration: Number(e.target.value) }));
  container.querySelector('[data-notes]').addEventListener('change', (e) => save({ notes: e.target.value.trim() }));

  container.querySelectorAll('[data-suggestion]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = chips[Number(b.dataset.suggestion)];
      save({ date: dayKey(d), hour: d.getHours(), minute: d.getMinutes() });
      calendar.set(dayKey(d));
      centerHourChip(container, d.getHours());
    }),
  );

  container.querySelector('[data-next]').addEventListener('click', () => {
    const error = validate(draft);
    if (error) {
      container.querySelector('[data-error]').textContent = error;
      return;
    }
    navigate('/nieuw/voorkeuren');
  });

  refresh();
  centerHourChip(container, draft.hour);

  // Needs the group's people, so it arrives a moment later.
  const bestEl = container.querySelector('[data-best]');
  bestEl.hidden = true;
  attachSlotHints(
    { best: bestEl, hint: container.querySelector('[data-slot-hint]') },
    { draft: getDraft, onPick: (d) => { save({ date: dayKey(d), hour: d.getHours(), minute: d.getMinutes() }); calendar.set(dayKey(d)); centerHourChip(container, d.getHours()); } },
  ).then((attached) => {
    hints = attached;
    bestEl.hidden = !bestEl.innerHTML.trim();
    hints.update();
  });
}

// Scrolls the hour row sideways so the chosen hour is in the middle (without scrolling the page).
function centerHourChip(container, hour) {
  const row = container.querySelector('[data-hours]');
  const chip = row.querySelector(`[data-hour="${hour}"]`);
  if (chip) row.scrollLeft = chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2;
}

function validate(draft) {
  if (!draft.date) return t.newAppointment.chooseDate;
  if (combine(draft.date, draft.hour, draft.minute) <= new Date()) return t.newAppointment.dateInPast;
  return null;
}

// "Vrijdag 17:00"
function suggestionLabel(date) {
  const weekday = date.toLocaleDateString('nl-NL', { weekday: 'long' });
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${formatTime(date)}`;
}
