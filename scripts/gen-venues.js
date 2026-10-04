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
  restaurant: { cuisines: ['Europees', 'Italiaans', 'Aziatisch', 'Mediterraan', 'Vegetarisch', 'Streekkeuken', 'Wereldkeuken', 'Visrestaurant'], price: [2, 4], quiet: 0.4, veg: 0.7 },
  cafe: { cuisines: ['Koffie & gebak', 'Lunchcafé', 'Brouwcafé'], price: [1, 2], quiet: 0.5, veg: 0.6 },
  bar: { cuisines: ['Cocktails', 'Craft beer', 'Wijnbar'], price: [2, 3], quiet: 0.15, veg: 0.3 },
  meeting_room: { cuisines: ['Vergaderruimte', 'Werkcafé'], price: [2, 3], quiet: 0.9, veg: 0.5 },
  hotel: { cuisines: ['Stadshotel', 'Boetiekhotel', 'Businesshotel'], price: [2, 4], quiet: 0.6, veg: 0.5 },
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


// ---- Services, diets, prices and booking routes (own random sequence per venue, so the
// ---- fields above never change when this part changes) ----
// Chance (0–1) that a venue of this type offers each service. 1 = always.
const SERVICE_CHANCE = {
  restaurant: { lunch: 0.7, dinner: 1, drinks: 0.3, breakfast: 0.1, event: 0.25 },
  cafe: { coffee: 1, lunch: 0.7, breakfast: 0.5, drinks: 0.2, meeting: 0.1 },
  bar: { drinks: 1, dinner: 0.2, event: 0.4 },
  meeting_room: { meeting: 1, coffee: 1, lunch: 0.8, event: 0.5 },
  hotel: { stay: 1, breakfast: 0.95, dinner: 0.6, lunch: 0.4, coffee: 0.8, meeting: 0.5, event: 0.4 },
};
const DIET_CHANCE = { gluten_free: 0.5, halal: 0.2, lactose_free: 0.4 }; // vegetarian/vegan come from `vegetarian`
// Average price per person (in euro) for price levels 1–4; hotels: per room per night.
const PRICE_RANGE = {
  restaurant: [[10, 22], [18, 35], [32, 55], [55, 95]],
  cafe: [[3, 9], [6, 14], [10, 20], [15, 28]],
  bar: [[6, 14], [10, 22], [18, 35], [28, 50]],
  meeting_room: [[10, 25], [18, 40], [30, 60], [50, 90]],
  hotel: [[60, 95], [90, 140], [130, 200], [190, 320]],
};
const CAPACITY = { restaurant: [20, 120], cafe: [15, 60], bar: [30, 150], meeting_room: [8, 80], hotel: [15, 120] };

function addFacets(venue) {
  const f = seeded(hashText(`${venue.id}:facets`));
  const services = Object.entries(SERVICE_CHANCE[venue.type])
    .filter(([, chance]) => f() < chance)
    .map(([name]) => name);

  const diets = [];
  if (venue.vegetarian) {
    diets.push('vegetarian');
    if (f() < 0.35) diets.push('vegan');
  }
  for (const [diet, chance] of Object.entries(DIET_CHANCE)) if (f() < chance) diets.push(diet);

  const [low, high] = PRICE_RANGE[venue.type][venue.price_level - 1];
  const spread = (value) => Math.round(value * (0.92 + f() * 0.16));

  // Ways to book: the venue's own website always works for cafés and bars; restaurants,
  // hotels and meeting rooms mostly go through a booking site; events through the agency.
  const partners = { restaurant: ['tafelaar'], cafe: ['direct'], bar: ['direct'], meeting_room: ['zaalmeester'], hotel: ['overnachter'] }[venue.type];
  if (['restaurant', 'hotel'].includes(venue.type) && f() < 0.5) partners.push('direct');
  if (services.includes('event') || (venue.type === 'hotel' && services.includes('meeting'))) partners.push('samenzijn');

  const [minCap, maxCap] = CAPACITY[venue.type];
  return {
    ...venue,
    services,
    diets,
    price_range: [spread(low), spread(high)],
    price_unit: venue.type === 'hotel' ? 'room' : 'pp',
    capacity: Math.round(minCap + f() * (maxCap - minCap)),
    booking_partners: partners,
  };
}

const venues = [];
places.forEach((place, index) => {
  const r = seeded(hashText(place.id));
  const kinds = ['restaurant', 'cafe', ['bar', 'meeting_room', 'restaurant'][index % 3]];
  if (index % 2 === 0) kinds.push('hotel');

  kinds.forEach((type, i) => {
    const spec = TYPES[type];
    const reviews = Math.round(range(r, 40, 1200));
    venues.push(addFacets({
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
      photos: [0, 1, 2, 3].map(() => Math.floor(r() * 360)), // hues for the generated photo tiles
      last_updated: '2026-10-01T08:00:00.000Z',
    }));
  });
});

const source = 'Plekwijzer (demo): alle zaken zijn fictief. Gegenereerd door scripts/gen-venues.js.';
const lines = venues.map((v) => JSON.stringify(v)).join(',\n');
writeFileSync('data/venues.json', `{\n"source": ${JSON.stringify(source)},\n"venues": [\n${lines}\n]\n}\n`);
console.log(`${venues.length} venues for ${places.length} places`);
