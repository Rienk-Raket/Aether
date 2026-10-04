// Month calendar with neon grid. Past days are disabled; the selected day glows.

import { monthGrid, isPastDay, dayKey, parseDayKey } from '../core/dates.js';
import { icon } from './icons.js';
import { t } from '../i18n/nl.js';

// onChange(dayKey) is called when the user picks a day.
export function createDatePicker(container, { value, onChange }) {
  let selected = value;
  const start = parseDayKey(value ?? dayKey(new Date()));
  let year = start.getFullYear();
  let month = start.getMonth();

  function render() {
    const today = dayKey(new Date());
    const cells = monthGrid(year, month);
    const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

    container.innerHTML = `
      <div class="datepicker">
        <div class="datepicker-head">
          <button type="button" class="icon-btn" data-month-prev aria-label="${t.date.prevMonth}" ${isCurrentMonth ? 'disabled' : ''}>${icon('back')}</button>
          <strong>${t.date.months[month]} ${year}</strong>
          <button type="button" class="icon-btn" data-month-next aria-label="${t.date.nextMonth}">${icon('chevron')}</button>
        </div>
        <div class="datepicker-grid" role="grid">
          ${t.date.weekdaysShort.map((d) => `<span class="datepicker-dow">${d}</span>`).join('')}
          ${cells
            .map(({ key, day, inMonth }) => {
              const past = isPastDay(key);
              const classes = ['day', inMonth ? '' : 'other-month', key === today ? 'today' : '', key === selected ? 'selected' : '']
                .filter(Boolean)
                .join(' ');
              return `<button type="button" class="${classes}" data-day="${key}" ${past ? 'disabled' : ''}
                aria-pressed="${key === selected}" aria-label="${key}">${day}</button>`;
            })
            .join('')}
        </div>
      </div>`;

    container.querySelector('[data-month-prev]').addEventListener('click', () => shiftMonth(-1));
    container.querySelector('[data-month-next]').addEventListener('click', () => shiftMonth(1));
    container.querySelectorAll('[data-day]').forEach((btn) =>
      btn.addEventListener('click', () => {
        selected = btn.dataset.day;
        render();
        onChange(selected);
      }),
    );
  }

  function shiftMonth(delta) {
    const d = new Date(year, month + delta, 1);
    year = d.getFullYear();
    month = d.getMonth();
    render();
  }

  render();

  return {
    // Jump to a day from outside (e.g. a suggestion chip).
    set(key) {
      selected = key;
      const d = parseDayKey(key);
      year = d.getFullYear();
      month = d.getMonth();
      render();
    },
  };
}
