// Agenda: all appointments. Upcoming first (sortable), earlier ones folded away.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { actionSheet, confirmDialog } from '../ui/modal.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { appointmentCard } from '../ui/appointment-card.js';
import { listAppointments, deleteAppointment } from '../data/appointments.js';
import { listGroups } from '../data/groups.js';
import { logActivity } from '../data/activity.js';

const SORT_KEY = 'aether.appointmentSort';

const SORTS = {
  date: () => 0, // listAppointments() is already soonest first
  travel: (a, b) => (a.average_travel_time ?? Infinity) - (b.average_travel_time ?? Infinity),
  group: (a, b, groupsById) => (groupsById.get(a.group_id)?.name ?? '').localeCompare(groupsById.get(b.group_id)?.name ?? '', 'nl'),
};

export async function renderAgenda(container) {
  const [appointments, groups] = await Promise.all([listAppointments(), listGroups()]);
  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments.filter((a) => new Date(a.datetime) >= today);
  const past = appointments.filter((a) => new Date(a.datetime) < today).reverse();
  const sort = SORTS[localStorage.getItem(SORT_KEY)] ? localStorage.getItem(SORT_KEY) : 'date';
  upcoming.sort((a, b) => SORTS[sort](a, b, groupsById));

  const card = (a) => appointmentCard(a, groupsById.get(a.group_id), true);

  container.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        <div>
          <div class="eyebrow">${t.nav.agenda}</div>
          <h1 class="section-gap">${t.agenda.title}</h1>
          <p class="sub">${t.agenda.sub}</p>
        </div>
        <a class="btn btn-primary" href="#/nieuw">${icon('plus')} ${t.shell.newAppointment}</a>
      </div>

      <div class="section-head">
        <h2 class="section-title">${t.appointments.title}</h2>
        ${
          upcoming.length > 1
            ? `<select data-sort aria-label="${t.groups.sortLabel}">
                ${Object.keys(SORTS).map((key) => `<option value="${key}" ${key === sort ? 'selected' : ''}>${t.appointments.sort[key]}</option>`).join('')}
              </select>`
            : ''
        }
      </div>
      ${upcoming.length ? upcoming.map(card).join('') : emptyState(groups.length > 0)}

      ${
        past.length
          ? `<details class="accordion section-gap"><summary>${t.agenda.earlier(past.length)}</summary>${past.map(card).join('')}</details>`
          : ''
      }
    </section>`;

  wireDemoButtons(container, () => renderAgenda(container));

  container.querySelector('[data-sort]')?.addEventListener('change', (event) => {
    localStorage.setItem(SORT_KEY, event.target.value);
    renderAgenda(container);
  });

  container.querySelectorAll('[data-appointment-menu]').forEach((btn) =>
    btn.addEventListener('click', async (event) => {
      event.preventDefault(); // the button sits inside the card link
      const choice = await actionSheet(t.appointments.menuTitle, [{ label: t.common.delete, value: 'delete', danger: true, icon: 'trash' }]);
      if (choice === 'delete' && (await confirmDialog(t.appointments.confirmDelete, { confirmLabel: t.common.delete, danger: true }))) {
        await deleteAppointment(btn.dataset.appointmentMenu);
        await logActivity('appointment', t.activity.appointmentDeleted);
        renderAgenda(container);
      }
    }),
  );
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
