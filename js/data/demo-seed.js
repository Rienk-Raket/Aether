// Fills the app with fictional demo data: two groups of made-up people.

import { loadBundledJson } from '../services/mock/network.js';
import { ensureSelf, newPerson, addLocation, savePerson, DEFAULT_PREFERENCES } from './people.js';
import { normalizePreferences } from '../core/profile-model.js';
import { newGroup, addMember, saveGroup, listGroups } from './groups.js';
import { logActivity } from './activity.js';

const SELF_LOCATIONS = [
  { label: 'Thuis', address: 'utrecht-2', transport: 'bike' },
  { label: 'Werk', address: 'den-haag-1', transport: 'transit' },
];

const DEMO_GROUPS = [
  {
    name: 'Vrijdagborrel',
    description: 'Elke laatste vrijdag van de maand',
    people: [
      { name: 'Anna', address: 'amsterdam-2', transport: 'transit', prefs: { dining: { diets: ['vegetarian'], terrace: 'prefer' }, budget_level: 3 } },
      { name: 'Bram', address: 'rotterdam-1', transport: 'car', prefs: { vehicles: [{ id: 'demo-car', kind: 'petrol', label: '' }], travel: { max_minutes: 60, needs_parking: true } } },
      { name: 'Cem', address: 'haarlem-1', transport: 'transit', prefs: { dining: { allergies: ['peanut'], quiet: 'prefer' } } },
      { name: 'Dewi', address: 'amersfoort-2', transport: 'bike', prefs: { vehicles: [{ id: 'demo-bike', kind: 'bike', label: '' }], dining: { kid_friendly: 'must' } } },
    ],
  },
  {
    name: 'Projectteam Noord',
    description: 'Kwartaaloverleg',
    people: [
      { name: 'Eva', address: 'groningen-1', transport: 'car', prefs: { vehicles: [{ id: 'demo-ev', kind: 'electric', label: 'Elektrisch' }], travel: { needs_charger: true, max_minutes: 90 } } },
      { name: 'Joris', address: 'zwolle-2', transport: 'transit', prefs: { accessibility: ['wheelchair'] } },
      { name: 'Lot', address: 'leeuwarden-3', transport: 'transit' },
    ],
  },
];

export async function hasDemoData() {
  return (await listGroups()).some((group) => group.demo);
}

// Returns false when the demo data was already loaded.
export async function loadDemoData() {
  if (await hasDemoData()) return false;

  const { entries } = await loadBundledJson('data/addresses.json');
  const place = (id) => entries.find((entry) => entry.id === id);

  const self = await ensureSelf();
  if (self.locations.length === 0) {
    for (const loc of SELF_LOCATIONS) addLocation(self, { label: loc.label, place: place(loc.address), transport: loc.transport });
    self.preferences.default_transport = 'bike';
    await savePerson(self);
  }

  for (const spec of DEMO_GROUPS) {
    const group = { ...newGroup({ name: spec.name, description: spec.description, owner: self }), demo: true };
    for (const p of spec.people) {
      const person = { ...newPerson({ name: p.name }), demo: true };
      // Some made-up people have filled in preferences, so the preferences step has something to show.
      if (p.prefs) person.preferences = normalizePreferences({ ...DEFAULT_PREFERENCES, ...p.prefs });
      addLocation(person, { label: 'Thuis', place: place(p.address), transport: p.transport });
      await savePerson(person);
      addMember(group, person.id, 'qr');
    }
    await saveGroup(group);
    await logActivity('demo', `${spec.name}: ${spec.people.length + 1} deelnemers (demo)`, '', `#/groepen/${group.id}`);
  }
  return true;
}
