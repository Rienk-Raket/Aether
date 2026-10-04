// Dashboard: upcoming appointments (soonest first), or an empty state.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { actionSheet, confirmDialog } from '../ui/modal.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { formatTime, formatDuration, addMinutes } from '../core/dates.js';
import { listAppointments, deleteAppointment } from '../data/appointments.js';
import { listGroups } from '../data/groups.js';

export async function renderAppointments(container) {
  const [appointments, groups] = await Promise.all([listAppointments(), listGroups()]);
  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const upcoming = appointments.filter((a) => new Date(a.datetime) >= startOfToday());

  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.appointments.title}</h1>
      </header>
      ${upcoming.length ? upcoming.map((a) => appointmentCard(a, groupsById.get(a.group_id), true)).join('') : emptyState(groups.length > 0)}
      <a class="fab" href="#/nieuw">${icon('plus')}<span>${t.appointments.fab}</span></a>
    </section>`;

  wireDemoButtons(container, () => renderAppointments(container));

  container.querySelectorAll('[data-appointment-menu]').forEach((btn) =>
    btn.addEventListener('click', async () => {
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

  return `
    <article class="card appointment-card">
      <div class="card-row">
        <div>
          <div class="appointment-date">${esc(date)}</div>
          <div class="appointment-time mono">${formatTime(start)} – ${formatTime(end)} · ${formatDuration(appointment.duration_minutes)}</div>
          <div class="muted small">${esc(group?.name ?? t.appointments.unknownGroup)} · ${t.groups.memberCount(appointment.participants.length)}</div>
          <div class="muted small">${appointment.selected_poi ? esc(appointment.selected_poi.name) : t.appointments.noPlaceYet}</div>
        </div>
        <div class="card-side">
          <span class="badge ${appointment.status === 'draft' ? 'badge-demo' : ''}">${t.appointments.status[appointment.status]}</span>
          ${withMenu ? `<button type="button" class="icon-btn" data-appointment-menu="${appointment.id}" aria-label="${t.common.more}">${icon('more')}</button>` : ''}
        </div>
      </div>
    </article>`;
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
