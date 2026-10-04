// Gathers the people behind an appointment (or a draft) for the "when can everyone" scoring.

import { travelLimits } from '../core/requirements.js';
import { scoreSlot } from '../core/slots.js';
import { getPerson } from './people.js';
import { loadParticipants } from '../screens/results-data.js';

// participants: [{ id, name, location, mode, preferences }] → input for core/slots.js
export function toTravelers(participants, appointmentPrefs) {
  return participants
    .filter((p) => p.location)
    .map((p) => ({ id: p.id, name: p.name, mode: p.mode, location: p.location, limits: travelLimits(p, appointmentPrefs) }));
}

// Group members for a draft: default location and transport unless the draft says otherwise.
export async function draftParticipants(group, draftChoices = {}) {
  const people = (await Promise.all(group.members.map((m) => getPerson(m.user_id)))).filter(Boolean);
  return people.map((person) => {
    const choice = draftChoices[person.id];
    const location = person.locations.find((l) => l.id === choice?.location_id) ?? person.locations.find((l) => l.is_default) ?? person.locations[0] ?? null;
    return { id: person.id, name: person.name, location, mode: choice?.transport_mode ?? location?.transport_mode ?? 'transit', preferences: person.preferences };
  });
}

// How well does the moment of a saved appointment suit everyone? null when nobody has a location.
export async function appointmentSlotCheck(appointment) {
  const { participants } = await loadParticipants(appointment);
  const travelers = toTravelers(participants, appointment.preferences);
  if (!travelers.length) return null;
  return scoreSlot({ start: new Date(appointment.datetime), durationMinutes: appointment.duration_minutes, travelers });
}
