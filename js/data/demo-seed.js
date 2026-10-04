// Fills the app with fictional demo data: two groups of made-up people.

import { loadBundledJson } from '../services/mock/network.js';
import { ensureSelf, newPerson, addLocation, savePerson } from './people.js';
import { newGroup, addMember, saveGroup, listGroups } from './groups.js';

const SELF_LOCATIONS = [
  { label: 'Thuis', address: 'utrecht-2', transport: 'bike' },
  { label: 'Werk', address: 'den-haag-1', transport: 'transit' },
];

const DEMO_GROUPS = [
  {
    name: 'Vrijdagborrel',
    description: 'Elke laatste vrijdag van de maand',
    people: [
      { name: 'Anna', address: 'amsterdam-2', transport: 'transit' },
      { name: 'Bram', address: 'rotterdam-1', transport: 'car' },
      { name: 'Cem', address: 'haarlem-1', transport: 'transit' },
      { name: 'Dewi', address: 'amersfoort-2', transport: 'bike' },
    ],
  },
  {
    name: 'Projectteam Noord',
    description: 'Kwartaaloverleg',
    people: [
      { name: 'Eva', address: 'groningen-1', transport: 'car' },
      { name: 'Joris', address: 'zwolle-2', transport: 'transit' },
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
      addLocation(person, { label: 'Thuis', place: place(p.address), transport: p.transport });
      await savePerson(person);
      addMember(group, person.id, 'qr');
    }
    await saveGroup(group);
  }
  return true;
}
