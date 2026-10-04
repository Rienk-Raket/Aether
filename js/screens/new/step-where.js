// Nieuwe afspraak — Stap 3: confirm everyone's start location and transport.
// Shows an estimated travel time to the middle of the group as a preview.

import { t } from '../../i18n/nl.js';
import { icon } from '../../ui/icons.js';
import { esc, avatar } from '../../ui/dom.js';
import { actionSheet } from '../../ui/modal.js';
import { openLocationForm } from '../../ui/location-form.js';
import { TRANSPORT_OPTIONS, transportIcon, transportLabel } from '../../ui/transport.js';
import { navigate } from '../../router.js';
import { centroid } from '../../core/geo.js';
import { estimateTravelMinutes } from '../../core/travel-estimate.js';
import { combine } from '../../core/dates.js';
import { groupWarnings, isBlocking } from '../../core/group-warnings.js';
import { getGroup, saveGroup } from '../../data/groups.js';
import { getPerson, savePerson, addLocation, defaultLocation } from '../../data/people.js';
import { newAppointment, saveAppointment } from '../../data/appointments.js';
import { now } from '../../data/db.js';
import { getDraft, updateDraft, clearDraft, stepHeader } from './flow.js';

export async function renderStepWhere(container) {
  const draft = getDraft();
  const group = draft?.groupId && (await getGroup(draft.groupId));
  if (!group || !draft.date) {
    location.replace(group ? '#/nieuw/wanneer' : '#/nieuw');
    return;
  }

  const people = (await Promise.all(group.members.map((m) => getPerson(m.user_id)))).filter(Boolean);
  const rerender = () => renderStepWhere(container);

  // Each participant: chosen location (or their default) and transport.
  const rows = people.map((person) => {
    const choice = draft.participants[person.id];
    const loc = person.locations.find((l) => l.id === choice?.location_id) ?? defaultLocation(person);
    return { person, loc, mode: choice?.transport_mode ?? loc?.transport_mode ?? 'transit' };
  });

  const warnings = groupWarnings(rows.map((r) => ({ name: r.person.name, location: r.loc })));
  const blocked = warnings.some(isBlocking);
  const located = rows.filter((r) => r.loc);
  const middle = located.length ? centroid(located.map((r) => r.loc)) : null;

  container.innerHTML = `
    <section class="screen">
      ${stepHeader(3, t.newAppointment.stepWhere)}
      <button type="button" class="btn btn-block" data-defaults>${t.newAppointment.useDefaults}</button>

      <div class="card list-card section-gap">
        ${rows.map((r) => participantRow(r, middle)).join('')}
      </div>

      ${warnings.filter((w) => !isBlocking(w)).map((w) => `<p class="notice">${t.warnings[w.code]}</p>`).join('')}
      <p class="field-hint">${t.newAppointment.estimateNote}</p>

      <div class="flow-actions">
        <button type="button" class="btn btn-primary btn-large" data-calculate ${blocked ? 'disabled' : ''}>${icon('orb')} ${t.newAppointment.calculate}</button>
      </div>
    </section>`;

  const setChoice = (personId, patch) => {
    const current = getDraft().participants;
    updateDraft({ participants: { ...current, [personId]: { ...current[personId], ...patch } } });
    rerender();
  };

  container.querySelector('[data-defaults]').addEventListener('click', () => {
    updateDraft({ participants: {} });
    rerender();
  });

  container.querySelectorAll('[data-pick-location]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const row = rows.find((r) => r.person.id === btn.dataset.pickLocation);
      const locationId = await chooseLocation(row.person, row.mode);
      if (locationId) setChoice(row.person.id, { location_id: locationId });
    }),
  );

  container.querySelectorAll('[data-pick-mode]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const mode = await actionSheet(t.transport.label, TRANSPORT_OPTIONS.map((m) => ({ label: transportLabel(m), value: m })));
      if (mode) setChoice(btn.dataset.pickMode, { transport_mode: mode });
    }),
  );

  container.querySelector('[data-calculate]').addEventListener('click', async () => {
    const appointment = newAppointment({
      groupId: group.id,
      createdBy: group.owner_id,
      datetime: combine(draft.date, draft.hour, draft.minute).toISOString(),
      durationMinutes: draft.duration,
      notes: draft.notes,
      participants: rows.map((r) => ({ user_id: r.person.id, location_id: r.loc.id, transport_mode: r.mode })),
    });
    await saveAppointment(appointment);
    group.last_used_at = now();
    await saveGroup(group);
    clearDraft();
    navigate(`/afspraak/${appointment.id}/resultaten`);
  });
}

function participantRow({ person, loc, mode }, middle) {
  if (!loc) {
    return `
      <div class="list-row">
        ${avatar(person)}
        <div class="grow">
          <div>${esc(person.name)}</div>
          <button type="button" class="link-btn text-error" data-pick-location="${person.id}">${icon('pin')} ${t.newAppointment.addLocationFor(esc(person.name))}</button>
        </div>
      </div>`;
  }
  const minutes = Math.round(estimateTravelMinutes(loc, middle, mode));
  return `
    <div class="list-row">
      ${avatar(person)}
      <div class="grow">
        <div>${esc(person.name)}</div>
        <button type="button" class="address-link" data-pick-location="${person.id}">${esc(loc.address)}</button>
        <div class="muted small mono">${t.newAppointment.estimate(minutes)}</div>
      </div>
      <button type="button" class="icon-btn transport-btn" data-pick-mode="${person.id}" aria-label="${t.transport.label}: ${transportLabel(mode)}" title="${transportLabel(mode)}">${transportIcon(mode)}</button>
    </div>`;
}

// Lets the user pick one of the person's saved locations, or add a new one. Returns a location id.
async function chooseLocation(person, mode) {
  if (person.locations.length) {
    const choice = await actionSheet(person.name, [
      ...person.locations.map((l) => ({ label: `${l.label} — ${l.address}`, value: l.id })),
      { label: t.newAppointment.otherAddress, value: 'new' },
    ]);
    if (choice !== 'new') return choice;
  }
  const values = await openLocationForm({
    title: t.newAppointment.addLocationFor(person.name),
    label: person.is_self ? '' : undefined,
    transport: mode,
  });
  if (!values) return null;
  const label = values.label ?? (person.locations.length ? t.form.otherLabel : t.form.defaultLabel);
  const loc = addLocation(person, { label, place: values.place, transport: values.transport });
  await savePerson(person);
  return loc.id;
}
