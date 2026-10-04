// Dashboard: upcoming appointments with a sort option, or an empty state.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { actionSheet, confirmDialog } from '../ui/modal.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { formatTime, formatDuration, addMinutes } from '../core/dates.js';
import { durationLevel } from '../core/levels.js';
import { listAppointments, deleteAppointment } from '../data/appointments.js';
import { listGroups } from '../data/groups.js';

const SORT_KEY = 'aether.appointmentSort';

const SORTS = {
  date: () => 0, // listAppointments() is already soonest first
  travel: (a, b) => (a.average_travel_time ?? Infinity) - (b.average_travel_time ?? Infinity),
  group: (a, b, groupsById) => (groupsById.get(a.group_id)?.name ?? '').localeCompare(groupsById.get(b.group_id)?.name ?? '', 'nl'),
};

export async function renderAppointments(container) {
  const [appointments, groups] = await Promise.all([listAppointments(), listGroups()]);
  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const upcoming = appointments.filter((a) => new Date(a.datetime) >= startOfToday());
  const sort = localStorage.getItem(SORT_KEY) ?? 'date';
  upcoming.sort((a, b) => SORTS[sort](a, b, groupsById));

  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.appointments.title}</h1>
        ${
          upcoming.length > 1
            ? `<select data-sort aria-label="${t.groups.sortLabel}">
                ${Object.keys(SORTS).map((key) => `<option value="${key}" ${key === sort ? 'selected' : ''}>${t.appointments.sort[key]}</option>`).join('')}
              </select>`
            : ''
        }
      </header>
      ${upcoming.length ? upcoming.map((a) => appointmentCard(a, groupsById.get(a.group_id), true)).join('') : emptyState(groups.length > 0)}
      <a class="fab" href="#/nieuw">${icon('plus')}<span>${t.appointments.fab}</span></a>
    </section>`;

  wireDemoButtons(container, () => renderAppointments(container));

  container.querySelector('[data-sort]')?.addEventListener('change', (event) => {
    localStorage.setItem(SORT_KEY, event.target.value);
    renderAppointments(container);
  });

  container.querySelectorAll('[data-appointment-menu]').forEach((btn) =>
    btn.addEventListener('click', async (event) => {
      event.preventDefault(); // the button sits inside the card link
      const choice = await actionSheet(t.appointments.menuTitle, [{ label: t.common.delete, value: 'delete', danger: true }]);
      if (choice === 'delete' && (await confirmDialog(t.appointments.confirmDelete, { confirmLabel: t.common.delete, danger: true }))) {
        await deleteAppointment(btn.dataset.appointmentMenu);
        renderAppointments(container);
      }
    }),
  );
}

export function appointmentCard(appointment, group, withMenu = false) {
  const start = new Date(appointment.datetime);
  const end = addMinutes(start, appointment.duration_minutes);
  const longDate = start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = longDate[0].toUpperCase() + longDate.slice(1); // "Vrijdag 9 oktober"
  const place = appointment.selected_area?.name;
  const avg = appointment.average_travel_time;

  return `
    <a class="card card-link appointment-card" href="#/afspraak/${appointment.id}/resultaten">
      <div class="card-row">
        <div class="grow">
          <div class="appointment-date">${esc(date)}</div>
          <div class="appointment-time mono">${formatTime(start)} – ${formatTime(end)} · ${formatDuration(appointment.duration_minutes)}</div>
          <div class="appointment-place">${place ? `${icon('pin')} ${esc(place)}` : `<span class="muted">${t.appointments.noPlaceYet}</span>`}</div>
          <div class="muted small">${esc(group?.name ?? t.appointments.unknownGroup)} · ${t.groups.memberCount(appointment.participants.length)}</div>
        </div>
        <div class="card-side">
          <span class="badge ${appointment.status === 'draft' ? 'badge-demo' : ''}">${t.appointments.status[appointment.status]}</span>
          ${avg != null ? `<span class="mono small level-${durationLevel(avg)}" title="${t.appointments.avgTravel}">≈ ${avg} min</span>` : ''}
          ${withMenu ? `<button type="button" class="icon-btn" data-appointment-menu="${appointment.id}" aria-label="${t.common.more}">${icon('more')}</button>` : ''}
        </div>
      </div>
    </a>`;
}

function emptyState(hasGroups) {
  return `
    <div class="card empty-state">
      ${icon('calendar')}
      <h2>${t.appointments.empty}</h2>
      <p class="muted">${t.appointments.emptyHint}</p>
      ${hasGroups ? '' : demoButtonHtml()}
    </div>`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
