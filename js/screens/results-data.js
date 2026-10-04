// Loads everything the results screens need, and asks Routara for travel times to every candidate place.

import { loadBundledJson } from '../services/mock/network.js';
import { buildCandidates } from '../core/candidates.js';
import { travelMatrix } from '../services/routing.js';
import { groupWarnings } from '../core/group-warnings.js';
import { getAppointment } from '../data/appointments.js';
import { getGroup } from '../data/groups.js';
import { getPerson } from '../data/people.js';

export async function listAreas() {
  return (await loadBundledJson('data/nl-places.json')).places;
}

// The people of an appointment with their chosen start location and transport.
// A person or location may have been deleted after the appointment was made: those end up in `missing`.
export async function loadParticipants(appointment) {
  const rows = await Promise.all(
    appointment.participants.map(async (p) => {
      const person = await getPerson(p.user_id);
      const location = person?.locations.find((l) => l.id === p.location_id) ?? null;
      return { id: p.user_id, name: person?.name ?? '?', location, mode: p.transport_mode };
    }),
  );
  return {
    participants: rows.filter((r) => r.location),
    missing: rows.filter((r) => !r.location).map((r) => r.name),
  };
}

// Returns null when the appointment does not exist.
export async function loadResults(appointmentId) {
  const appointment = await getAppointment(appointmentId);
  if (!appointment) return null;

  const group = await getGroup(appointment.group_id);
  const { participants, missing } = await loadParticipants(appointment);

  let candidates = [];
  let source = 'estimate';
  let fetchedAt = null;
  if (participants.length) {
    const places = buildCandidates(participants.map((p) => p.location), await listAreas());
    const matrix = await travelMatrix({
      participants: participants.map((p) => ({ location: p.location, mode: p.mode })),
      places,
      when: new Date(appointment.datetime),
    });
    candidates = places.map((place, i) => ({ ...place, times: matrix.times[i] }));
    ({ source, fetchedAt } = matrix);
  }

  const warnings = groupWarnings(participants.map((p) => ({ name: p.name, location: p.location })));

  return { appointment, group, participants, candidates, missing, warnings, source, fetchedAt };
}
