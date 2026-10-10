// Loads what the work environment needs: the profile with its work wishes, all venues (through the
// fictional service Plekwijzer, so offline behaviour is the same as elsewhere) and the appointments.

import { ensureSelf } from '../data/people.js';
import { listAppointments } from '../data/appointments.js';
import { getGroup } from '../data/groups.js';
import { findAllVenues, OfflineError } from '../services/places.js';
import { loadBundledJson } from '../services/mock/network.js';
import { recommend } from '../core/work-match.js';

export { OfflineError };

export const hasWorkProfile = (profile) => Boolean(profile?.work && (profile.work.meeting_kind || Object.keys(profile.work.needs ?? {}).length));

// The default start location of the profile, when there is one.
export function homeOf(profile) {
  const place = profile.locations?.find((l) => l.is_default) ?? profile.locations?.[0];
  return place ? { lat: place.lat, lng: place.lng } : null;
}

export async function loadWork({ withVenues = true } = {}) {
  const profile = await ensureSelf();
  const [appointments, places] = await Promise.all([listAppointments(), loadBundledJson('data/nl-places.json').then((d) => d.places)]);
  const result = { profile, work: profile.work ?? null, appointments, places, venues: [], source: null, recommendations: [] };
  if (withVenues) {
    const found = await findAllVenues();
    const centres = new Map(places.map((p) => [p.id, p]));
    result.venues = found.venues;
    result.source = found.source;
    result.recommendations = result.work ? recommend(found.venues, result.work, { from: homeOf(profile), centreOf: (v) => centres.get(v.area_id) ?? null, limit: 30 }) : [];
  }
  return result;
}

export async function groupName(appointment) {
  return (await getGroup(appointment.group_id))?.name ?? '';
}
