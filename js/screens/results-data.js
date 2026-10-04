// Loads everything the results screen needs and computes travel times to every candidate place.

import { loadBundledJson } from '../services/mock/network.js';
import { buildCandidates, withTravelTimes } from '../core/candidates.js';
import { groupWarnings } from '../core/group-warnings.js';
import { getAppointment } from '../data/appointments.js';
import { getGroup } from '../data/groups.js';
import { getPerson } from '../data/people.js';

export async function listAreas() {
  return (await loadBundledJson('data/nl-places.json')).places;
}

// Returns null when the appointment does not exist.
export async function loadResults(appointmentId) {
  const appointment = await getAppointment(appointmentId);
  if (!appointment) return null;

  const group = await getGroup(appointment.group_id);
  const rows = await Promise.all(
    appointment.participants.map(async (p) => {
      const person = await getPerson(p.user_id);
      const location = person?.locations.find((l) => l.id === p.location_id) ?? null;
      return { id: p.user_id, name: person?.name ?? '?', location, mode: p.transport_mode };
    }),
  );

  // A person or location may have been deleted after the appointment was made.
  const participants = rows.filter((r) => r.location);
  const missing = rows.filter((r) => !r.location).map((r) => r.name);

  const candidates = participants.length
    ? withTravelTimes(buildCandidates(participants.map((p) => p.location), await listAreas()), participants)
    : [];

  const warnings = groupWarnings(participants.map((p) => ({ name: p.name, location: p.location })));

  return { appointment, group, participants, candidates, missing, warnings };
}
