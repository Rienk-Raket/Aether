// Group detail: members with their start address, add/edit/remove members, plan an appointment.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { actionSheet, confirmDialog } from '../ui/modal.js';
import { openGroupForm } from '../ui/group-form.js';
import { openLocationForm } from '../ui/location-form.js';
import { transportIcon, transportLabel } from '../ui/transport.js';
import { showToast } from '../ui/toast.js';
import { navigate } from '../router.js';
import { getGroup, saveGroup, deleteGroup, addMember, removeMember } from '../data/groups.js';
import { getPerson, savePerson, newPerson, addLocation, defaultLocation } from '../data/people.js';
import { listAppointmentsForGroup } from '../data/appointments.js';
import { appointmentCard } from '../ui/appointment-card.js';
import { logActivity } from '../data/activity.js';

export async function renderGroupDetail(container, { id }) {
  const group = await getGroup(id);
  if (!group) {
    container.innerHTML = `<section class="screen"><p>${t.common.notFound}</p><a href="#/groepen">${t.common.back}</a></section>`;
    return;
  }
  const members = (await Promise.all(group.members.map((m) => getPerson(m.user_id)))).filter(Boolean);
  const recent = (await listAppointmentsForGroup(id)).slice(0, 3);
  const rerender = () => renderGroupDetail(container, { id });

  container.innerHTML = `
    <section class="screen">
      <a class="back-link" href="#/groepen">${icon('back')} ${t.groups.title}</a>
      <div class="screen-header">
        <div>
          <h1>${esc(group.name)}</h1>
          ${group.description ? `<p class="sub">${esc(group.description)}</p>` : ''}
        </div>
        <div class="top-actions">
          <button class="btn btn-primary" type="button" data-plan ${members.length < 2 ? 'disabled' : ''}>${icon('calendar')} ${t.groupDetail.plan}</button>
          <button type="button" class="icon-btn" data-menu aria-label="${t.common.more}">${icon('more')}</button>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h2 class="section-title">${t.groupDetail.members(members.length)}</h2>
          <button type="button" class="btn btn-small btn-primary" data-add>${icon('plus')} ${t.groupDetail.addMember}</button>
        </div>
        <div class="card list-card">${members.map(memberRow).join('')}</div>
        ${members.length < 2 ? `<p class="field-hint">${t.groupDetail.minMembers}</p>` : ''}
      </div>

      <div class="section">
        <div class="card">
          <div class="row">
            <span>${t.groupDetail.notifications}</span>
            <label class="toggle"><input type="checkbox" data-notify ${group.notification_enabled ? 'checked' : ''} aria-label="${t.groupDetail.notifications}" /><span class="toggle-track"></span></label>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">${t.groupDetail.recent}</h2>
        ${recent.length ? recent.map((a) => appointmentCard(a, group)).join('') : `<p class="muted">${t.groupDetail.noAppointments}</p>`}
      </div>
    </section>`;

  container.querySelector('[data-add]').addEventListener('click', async () => {
    const values = await openLocationForm({ title: t.groupDetail.addMember, name: '' });
    if (!values) return;
    const person = newPerson({ name: values.name });
    addLocation(person, { label: t.form.defaultLabel, place: values.place, transport: values.transport });
    await savePerson(person);
    addMember(group, person.id);
    await saveGroup(group);
    await logActivity('member', t.activity.memberAdded(values.name), group.name, `#/groepen/${group.id}`);
    showToast(t.groupDetail.added(values.name));
    rerender();
  });

  container.querySelectorAll('[data-member]').forEach((btn) =>
    btn.addEventListener('click', () => memberMenu(group, members.find((p) => p.id === btn.dataset.member), rerender)),
  );

  container.querySelector('[data-notify]').addEventListener('change', async (event) => {
    group.notification_enabled = event.target.checked;
    await saveGroup(group);
  });

  container.querySelector('[data-plan]').addEventListener('click', () => navigate(`/nieuw?groep=${group.id}`));
  container.querySelector('[data-menu]').addEventListener('click', () => groupMenu(group, rerender));
}

function memberRow(person) {
  const location = defaultLocation(person);
  return `
    <div class="list-row">
      ${avatar(person)}
      <div class="grow">
        <div>${esc(person.name)}${person.is_self ? ` <span class="badge">${t.common.you}</span>` : ''}</div>
        <div class="muted small">${location ? esc(location.address) : `<span class="text-error">${t.groupDetail.noLocation}</span>`}</div>
      </div>
      ${location ? `<span class="transport-icon" title="${transportLabel(location.transport_mode)}">${transportIcon(location.transport_mode)}</span>` : ''}
      <button type="button" class="icon-btn ghost" data-member="${person.id}" aria-label="${t.common.more}">${icon('more')}</button>
    </div>`;
}

async function memberMenu(group, person, rerender) {
  if (person.is_self) {
    navigate('/instellingen');
    return;
  }
  const choice = await actionSheet(person.name, [
    { label: t.common.edit, value: 'edit' },
    { label: t.groupDetail.removeMember, value: 'remove', danger: true, icon: 'trash' },
  ]);

  if (choice === 'edit') {
    const location = defaultLocation(person);
    const values = await openLocationForm({
      title: t.common.edit,
      name: person.name,
      place: location,
      transport: location?.transport_mode,
    });
    if (!values) return;
    person.name = values.name;
    if (location) Object.assign(location, { address: values.place.address, lat: values.place.lat, lng: values.place.lng, transport_mode: values.transport });
    else addLocation(person, { label: t.form.defaultLabel, place: values.place, transport: values.transport });
    await savePerson(person);
    rerender();
  }

  if (choice === 'remove' && (await confirmDialog(t.groupDetail.confirmRemove(person.name), { confirmLabel: t.common.remove, danger: true }))) {
    removeMember(group, person.id);
    await saveGroup(group);
    rerender();
  }
}

async function groupMenu(group, rerender) {
  const choice = await actionSheet(group.name, [
    { label: t.common.edit, value: 'edit' },
    { label: t.groupDetail.deleteGroup, value: 'delete', danger: true, icon: 'trash' },
  ]);

  if (choice === 'edit') {
    const values = await openGroupForm({ title: t.common.edit, name: group.name, description: group.description });
    if (!values) return;
    Object.assign(group, values);
    await saveGroup(group);
    rerender();
  }

  if (choice === 'delete' && (await confirmDialog(t.groupDetail.confirmDelete(group.name), { confirmLabel: t.common.delete, danger: true }))) {
    await deleteGroup(group.id);
    showToast(t.groupDetail.deleted);
    navigate('/groepen');
  }
}
