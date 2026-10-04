// Appointments. Dates are stored as UTC ISO strings and shown in local time.

import { getDB, newId, now } from './db.js';

export async function getAppointment(id) {
  return (await getDB()).get('appointments', id);
}

// Soonest first.
export async function listAppointments() {
  const all = await (await getDB()).getAll('appointments');
  return all.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export async function listAppointmentsForGroup(groupId) {
  const list = await (await getDB()).getAllFromIndex('appointments', 'group_id', groupId);
  return list.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

export async function saveAppointment(appointment) {
  await (await getDB()).put('appointments', appointment);
  return appointment;
}

export async function deleteAppointment(id) {
  await (await getDB()).delete('appointments', id);
}

// participants: [{ user_id, location_id, transport_mode }]
export function newAppointment({ groupId, createdBy, datetime, durationMinutes, notes, participants, preferences = null }) {
  return {
    id: newId(),
    group_id: groupId,
    created_by: createdBy,
    created_at: now(),
    datetime,
    duration_minutes: durationMinutes,
    status: 'draft',
    participants,
    selected_poi: null,
    // Filled in by the results screen when a place is chosen.
    selected_area: null, // { id, name, lat, lng }
    fairness_priority: null, // slider position used (0 = efficient, 1 = fair)
    fairness_score: null,
    average_travel_time: null,
    travel_time_stddev: null,
    notes,
    // How the participants' preferences count (see core/requirements.js). null on older appointments.
    preferences,
    reminder_enabled: true,
  };
}
