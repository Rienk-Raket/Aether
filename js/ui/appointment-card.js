// One appointment as a card; a click opens it in "Ontdek plekken".

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { formatTime, formatDuration, addMinutes } from '../core/dates.js';
import { durationLevel } from '../core/levels.js';

export function appointmentCard(appointment, group, withMenu = false) {
  const start = new Date(appointment.datetime);
  const end = addMinutes(start, appointment.duration_minutes);
  const longDate = start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = longDate[0].toUpperCase() + longDate.slice(1); // "Vrijdag 9 oktober"
  const place = appointment.selected_area?.name;
  const avg = appointment.average_travel_time;

  return `
    <a class="card card-link appointment-card" href="#/ontdek?afspraak=${appointment.id}">
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
          ${withMenu ? `<button type="button" class="icon-btn ghost" data-appointment-menu="${appointment.id}" aria-label="${t.common.more}">${icon('more')}</button>` : ''}
        </div>
      </div>
    </a>`;
}
