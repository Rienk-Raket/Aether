// Generates data/venues.json: FICTIONAL restaurants, cafés, bars, meeting rooms and hotels
// around the places in data/nl-places.json. The "random" numbers come from a fixed seed, so
// running this script again gives exactly the same file. Run: node scripts/gen-venues.js

import { readFileSync, writeFileSync } from 'node:fs';

const { places } = JSON.parse(readFileSync('data/nl-places.json', 'utf8'));

// Small seeded random generator (mulberry32), so the output never changes between runs.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hashText = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

const ADJ = ['Gouden', 'Stille', 'Blauwe', 'Vlakke', 'Oude', 'Nieuwe', 'Kleine', 'Late', 'Zilveren', 'Warme', 'Groene', 'Heldere'];
const NOUN = ['Spar', 'Lepel', 'Kade', 'Vlinder', 'Anker', 'Molen', 'Tafel', 'Kolibrie', 'Appel', 'Brug', 'Vuurtoren', 'Wolk', 'Esdoorn', 'Kompas', 'Schuur', 'Lantaarn'];
const STREETS = ['Lindelaan', 'Kastanjestraat', 'Zonnebloemweg', 'Havenkade', 'Molenpad', 'Vlinderhof', 'Sterrenlaan', 'Duinroosstraat', 'IJsvogelweg', 'Hazelaarlaan', 'Lichtbaken', 'Morgenrood'];

const TYPES = {
  restaurant: { cuisines: ['Europees', 'Italiaans', 'Aziatisch', 'Mediterraan', 'Vegetarisch', 'Streekkeuken', 'Wereldkeuken', 'Visrestaurant'], price: [2, 4], quiet: 0.4, veg: 0.7, partner: 'tafelaar' },
  cafe: { cuisines: ['Koffie & gebak', 'Lunchcafé', 'Brouwcafé'], price: [1, 2], quiet: 0.5, veg: 0.6, partner: null },
  bar: { cuisines: ['Cocktails', 'Craft beer', 'Wijnbar'], price: [2, 3], quiet: 0.15, veg: 0.3, partner: null },
  meeting_room: { cuisines: ['Vergaderruimte', 'Werkcafé'], price: [2, 3], quiet: 0.9, veg: 0.5, partner: 'overnachter' },
  hotel: { cuisines: ['Stadshotel', 'Boetiekhotel', 'Businesshotel'], price: [2, 4], quiet: 0.6, veg: 0.5, partner: 'overnachter' },
};

// Opening hours: 7 entries (Sunday first) of [openMinute, closeMinute] or null when closed.
// A closing time above 1440 means "after midnight" (1500 = 01:00 the next day).
const week = (fn) => Array.from({ length: 7 }, (_, day) => fn(day));
const HOURS = {
  restaurant: (r) => { const closedDay = Math.floor(r() * 7); return week((d) => (d === closedDay && r() < 0.6 ? null : [1020, 1380])); },
  cafe: (r) => { const late = r() < 0.4; return week(() => (late ? [600, 1320] : [540, 1080])); },
  bar: () => week((d) => (d === 1 || d === 2 ? null : [960, 1500])),
  meeting_room: () => week((d) => (d === 0 || d === 6 ? null : [480, 1080])),
  hotel: () => week(() => [0, 1440]),
};

const pick = (r, list) => list[Math.floor(r() * list.length)];
const range = (r, min, max) => min + r() * (max - min);

const used = new Set();
function makeName(r, type) {
  for (let tries = 0; tries < 50; tries++) {
    const noun = pick(r, NOUN);
    const adj = pick(r, ADJ);
    const options = {
      restaurant: [`De ${adj} ${noun}`, `Het ${noun}huis`, `Keuken ${noun}`],
      cafe: [`Café ${noun}`, `Koffiehuis ${noun}`, `${noun} & Co`, `Café De ${adj} ${noun}`, `Koffiebar ${adj} ${noun}`],
      bar: [`Bar ${noun}`, `${noun} Social`, `De ${adj} Bar`],
      meeting_room: [`Werkplaats ${noun}`, `Vergaderhuis ${noun}`, `Studio ${noun}`],
      hotel: [`Hotel ${noun}`, `Hotel De ${adj}`, `Hotel ${adj} ${noun}`, `Grand Hotel ${noun}`],
    }[type];
    const name = pick(r, options);
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return `${type} ${used.size}`;
}

const venues = [];
places.forEach((place, index) => {
  const r = seeded(hashText(place.id));
  const kinds = ['restaurant', 'cafe', ['bar', 'meeting_room', 'restaurant'][index % 3]];
  if (index % 2 === 0) kinds.push('hotel');

  kinds.forEach((type, i) => {
    const spec = TYPES[type];
    const reviews = Math.round(range(r, 40, 1200));
    venues.push({
      id: `${place.id}-${type}-${i + 1}`,
      area_id: place.id,
      name: makeName(r, type),
      type,
      cuisine: pick(r, spec.cuisines),
      lat: +(place.lat + range(r, -0.012, 0.012)).toFixed(5),
      lng: +(place.lng + range(r, -0.018, 0.018)).toFixed(5),
      address: `${pick(r, STREETS)} ${Math.round(range(r, 1, 120))}, ${place.name}`,
      price_level: Math.round(range(r, spec.price[0], spec.price[1])),
      rating: +range(r, 3.8, 4.9).toFixed(1),
      review_count: reviews,
      hours: HOURS[type](r),
      accessible: r() < 0.7,
      quiet: r() < spec.quiet,
      vegetarian: r() < spec.veg,
      popularity: Math.min(1, reviews / 1000), // 0–1, used for the crowd forecast
      booking_partner: spec.partner,
      photos: [0, 1, 2, 3].map(() => Math.floor(r() * 360)), // hues for the generated photo tiles
      last_updated: '2026-10-01T08:00:00.000Z',
    });
  });
});

const source = 'Plekwijzer (demo): alle zaken zijn fictief. Gegenereerd door scripts/gen-venues.js.';
const lines = venues.map((v) => JSON.stringify(v)).join(',\n');
writeFileSync('data/venues.json', `{\n"source": ${JSON.stringify(source)},\n"venues": [\n${lines}\n]\n}\n`);
console.log(`${venues.length} venues for ${places.length} places`);
