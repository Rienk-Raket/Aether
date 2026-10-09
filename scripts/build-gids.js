// Builds data/gids-venues.json from docs/gids_locaties_nederland.md: the venues of the guide as
// demo data in the same shape as data/venues.json. The guide has no coordinates, so every venue
// is placed near the centre of its city (a fixed seed keeps the result identical on every run).
// Facts the guide does not give (price level, facilities...) are filled in with seeded numbers.
// Run: node scripts/build-gids.js

import { readFileSync, writeFileSync } from 'node:fs';

const guide = readFileSync('docs/gids_locaties_nederland.md', 'utf8');
const { places } = JSON.parse(readFileSync('data/nl-places.json', 'utf8'));

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
const range = (r, min, max) => min + r() * (max - min);
const norm = (text) => text.toLowerCase().replace(/[’']/g, '');

const CATEGORY = { restaurants: 'restaurant', overleg: 'meeting_room', hotels: 'hotel', cafés: 'cafe', 'eet)cafés': 'cafe', evenementenlocaties: 'event', events: 'event', vergaderen: 'meeting_room' };
const typeOf = (heading) => {
  const key = norm(heading).replace(/^\(/, '').replace(/^3x /, '').replace(/[^a-zé)]+/g, ' ').trim().split(' ')[0];
  return CATEGORY[key] ?? CATEGORY[norm(heading).replace(/[^a-zé)]/g, '')] ?? null;
};

// ---- Parsing ----
const cities = []; // { place, byType: { type: [{ name, detail }] } }
let current = null;
let type = null;
let item = null;
const lines = guide.split('\n');

function startCity(name) {
  const place = places.find((p) => norm(p.name) === norm(name));
  if (!place) throw new Error(`Unknown city in guide: ${name}`);
  current = { place, byType: {} };
  cities.push(current);
  type = null;
  item = null;
}
const add = (t, entry) => ((current.byType[t] ??= []).push(entry));

for (const raw of lines) {
  const line = raw.trimEnd();
  const city = line.match(/^## \d+\. (.+)$/);
  if (city) { startCity(city[1]); continue; }
  if (!current) continue;

  const heading = line.match(/^### (.+)$/);
  if (heading) { type = typeOf(heading[1]); item = null; continue; }

  // Short form: "3x Restaurants: A, B, C | 3x Vergaderen: ..." (cities 7–49: names only)
  if (/3x /.test(line) && /\|/.test(line)) {
    for (const part of line.replace(/^\*?\(?\s*\*?\s*/, '').replace(/\)\*?\s*$/, '').split('|')) {
      const m = part.match(/3x\s+([^:*]+):\**\s*(.+)$/);
      const t = m && typeOf(m[1]);
      if (!t) continue;
      for (const name of m[2].replace(/[.)*]+\s*$/, '').split(/,\s+(?![^(]*\))/)) if (name.trim()) add(t, { name: name.trim() });
    }
    continue;
  }

  // Long form: a numbered, bold name starts an item; the lines below belong to it.
  const start = line.match(/^\d+\. \*\*(.+)\*\*$/);
  if (start && type) { item = { name: start[1].trim() }; add(type, item); continue; }
  if (!item) continue;
  let m;
  if ((m = line.match(/^\s+\*\*([\d,]+)\*\*.*\(([\d.]+) reviews\)/))) { item.rating = Number(m[1].replace(',', '.')); item.reviews = Number(m[2].replace('.', '')); }
  else if ((m = line.match(/^\s+\*(.+?) · (.+)\*$/))) { item.kind = m[1].trim(); item.address = m[2].trim(); }
  else if ((m = line.match(/^\s+[🟢🔴🟡]\s*\*\*[^*]+\*\*\s*·\s*(.+)$/u))) item.hours = m[1].trim();
  else if (/^\s+✓/.test(line)) item.highlights = line.split('✓').map((s) => s.replace(/·\s*$/, '').trim()).filter(Boolean);
  else if ((m = line.match(/^\s+\* \*\*Zakelijk(?:e)?:\*\*\s*(.+)$/))) item.business = m[1].trim();
  else if ((m = line.match(/^\s+\* \*\*Privé:\*\*\s*(.+)$/))) item.private = m[1].trim();
}

// ---- Opening hours ----
const DAYS = { zondag: 0, maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4, vrijdag: 5, zaterdag: 6 };
const clock = (text) => { const [h, m] = text.split(':').map(Number); return h * 60 + m; };
const DEFAULT_HOURS = { restaurant: [1020, 1380], cafe: [600, 1320], meeting_room: [480, 1080], hotel: [0, 1440], event: [540, 1320] };

function parseHours(text, venueType) {
  const week = Array(7).fill(null);
  const fallback = DEFAULT_HOURS[venueType];
  if (!text) { week.fill(fallback); return { hours: week.map((h) => h), byAppointment: false }; }
  const lower = text.toLowerCase();
  if (lower.includes('24 uur')) return { hours: week.map(() => [0, 1440]), byAppointment: false };
  const byAppointment = lower.includes('op afspraak');
  const open = lower.match(/van (\d{2}:\d{2}) – (\d{2}:\d{2})/);
  let [from, to] = open ? [clock(open[1]), clock(open[2])] : byAppointment ? [540, 1020] : fallback;
  if (open && to <= from) to += 1440;
  if (!open && lower.includes('dagelijks geopend')) [from, to] = fallback;
  const span = lower.match(/(\w+) t\/m (\w+)/);
  let days = [0, 1, 2, 3, 4, 5, 6];
  if (span && span[1] in DAYS && span[2] in DAYS) {
    days = [];
    for (let d = DAYS[span[1]]; ; d = (d + 1) % 7) { days.push(d); if (d === DAYS[span[2]]) break; }
  } else if (byAppointment) days = [1, 2, 3, 4, 5];
  days.forEach((d) => (week[d] = [from, to]));
  return { hours: week, byAppointment };
}

// ---- Facts the guide does not give: seeded numbers per venue ----
const CUISINES = {
  restaurant: ['Europees', 'Italiaans', 'Aziatisch', 'Mediterraans', 'Streekkeuken', 'Wereldkeuken', 'Visrestaurant'],
  cafe: ['Eetcafé', 'Grand Café', 'Koffie & gebak', 'Brouwcafé'],
  meeting_room: ['Vergaderruimte', 'Werkcafé', 'Congrescentrum'],
  hotel: ['Stadshotel', 'Boetiekhotel', 'Businesshotel'],
  event: ['Eventlocatie', 'Theater & zalen', 'Cultuurlocatie'],
};
const PRICE_BASE = { restaurant: [2, 4], cafe: [1, 2], meeting_room: [2, 3], hotel: [2, 4], event: [2, 4] };
const PRICE_RANGE = {
  restaurant: [[10, 22], [18, 35], [32, 55], [55, 95]], cafe: [[3, 9], [6, 14], [10, 20], [15, 28]],
  meeting_room: [[10, 25], [18, 40], [30, 60], [50, 90]], hotel: [[60, 95], [90, 140], [130, 200], [190, 320]], event: [[15, 30], [25, 50], [40, 80], [70, 140]],
};
const CAPACITY = { restaurant: [20, 120], cafe: [15, 60], meeting_room: [8, 200], hotel: [15, 220], event: [150, 1500] };
const SERVICE_CHANCE = {
  restaurant: { lunch: 0.7, dinner: 1, drinks: 0.3, breakfast: 0.1, event: 0.25 },
  cafe: { coffee: 1, lunch: 0.7, breakfast: 0.5, drinks: 0.5, meeting: 0.1 },
  meeting_room: { meeting: 1, coffee: 1, lunch: 0.8, event: 0.5 },
  hotel: { stay: 1, breakfast: 0.95, dinner: 0.6, lunch: 0.4, coffee: 0.8, meeting: 0.5, event: 0.4 },
  event: { event: 1, meeting: 0.7, drinks: 0.6, dinner: 0.4, coffee: 0.5 },
};
const CHANCE = {
  restaurant: { terrace: 0.45, kid: 0.6, dog: 0.3, parking: 0.5, charger: 0.2, quiet: 0.4, veg: 0.7 },
  cafe: { terrace: 0.6, kid: 0.6, dog: 0.45, parking: 0.4, charger: 0.15, quiet: 0.5, veg: 0.6 },
  meeting_room: { terrace: 0.15, kid: 0.2, dog: 0.1, parking: 0.7, charger: 0.5, quiet: 0.9, veg: 0.5 },
  hotel: { terrace: 0.3, kid: 0.5, dog: 0.3, parking: 0.8, charger: 0.4, quiet: 0.6, veg: 0.5 },
  event: { terrace: 0.3, kid: 0.4, dog: 0.1, parking: 0.8, charger: 0.3, quiet: 0.1, veg: 0.5 },
};
const PARTNERS = { restaurant: ['tafelaar'], cafe: ['direct'], meeting_room: ['zaalmeester'], hotel: ['overnachter'], event: ['samenzijn'] };
const ALLERGENS = ['peanut', 'tree_nut', 'shellfish', 'egg', 'soy', 'fish', 'sesame'];
const has = (item, re) => (item.highlights ?? []).some((h) => re.test(h)) || re.test(item.kind ?? '');

function build(cityEntry, venueType, item, index) {
  const place = cityEntry.place;
  const id = `gids-${place.id}-${venueType}-${index + 1}`;
  const r = seeded(hashText(id));
  const f = seeded(hashText(`${id}:facts`));
  const chance = CHANCE[venueType];
  const [lowP, highP] = PRICE_BASE[venueType];
  let priceLevel = Math.round(range(r, lowP, highP));
  if (/michelin|fine dining|gastronom/i.test(`${item.kind} ${(item.highlights ?? []).join(' ')}`)) priceLevel = 4;
  const reviews = item.reviews ?? Math.round(range(r, 60, 1500));
  const { hours, byAppointment } = parseHours(item.hours, venueType);
  const vegetarian = f() < chance.veg;
  const accessible = has(item, /rolstoel|toegankelijk|lift/i) || f() < 0.7;
  const services = Object.entries(SERVICE_CHANCE[venueType]).filter(([, c]) => f() < c).map(([n]) => n);
  const diets = [];
  if (vegetarian) { diets.push('vegetarian'); if (f() < 0.35) diets.push('vegan'); }
  if (f() < 0.5) diets.push('gluten_free');
  if (f() < 0.2) diets.push('halal');
  if (f() < 0.4) diets.push('lactose_free');
  const [lo, hi] = PRICE_RANGE[venueType][priceLevel - 1];
  const spread = (v) => Math.round(v * (0.92 + r() * 0.16));
  const [minCap, maxCap] = CAPACITY[venueType];
  const capacityText = (item.highlights ?? []).join(' ').match(/Tot ([\d.]+) personen/);
  const partners = [...PARTNERS[venueType]];
  if (['restaurant', 'hotel'].includes(venueType) && r() < 0.5) partners.push('direct');
  if (venueType === 'meeting_room' || (venueType === 'hotel' && services.includes('meeting'))) partners.push('samenzijn');

  return {
    id,
    area_id: place.id,
    name: item.name,
    type: venueType,
    cuisine: item.kind ?? CUISINES[venueType][Math.floor(r() * CUISINES[venueType].length)],
    lat: +(place.lat + range(r, -0.016, 0.016)).toFixed(5),
    lng: +(place.lng + range(r, -0.024, 0.024)).toFixed(5),
    address: item.address ?? `Centrum, ${place.name}`,
    price_level: priceLevel,
    rating: item.rating ?? +range(r, 3.9, 4.8).toFixed(1),
    review_count: reviews,
    hours,
    accessible,
    quiet: has(item, /rustig|intiem|stil|tuin/i) || f() < chance.quiet,
    vegetarian,
    popularity: Math.min(1, reviews / 1000),
    photos: [0, 1, 2, 3].map(() => Math.floor(r() * 360)),
    last_updated: '2026-10-01T08:00:00.000Z',
    services,
    diets,
    price_range: [spread(lo), spread(hi)],
    price_unit: venueType === 'hotel' ? 'room' : 'pp',
    capacity: capacityText ? Number(capacityText[1].replace('.', '')) : Math.round(minCap + r() * (maxCap - minCap)),
    booking_partners: partners,
    terrace: has(item, /terras/i) || f() < chance.terrace,
    kid_friendly: f() < chance.kid,
    dog_friendly: f() < chance.dog,
    parking: has(item, /parkeer|valet/i) || f() < chance.parking,
    charger: f() < chance.charger,
    accessible_toilet: accessible && f() < 0.7,
    allergen_safe: ALLERGENS.filter(() => f() < 0.8),
    // Extra facts from the guide
    source: 'gids',
    by_appointment: byAppointment,
    highlights: item.highlights ?? [],
    use_business: item.business ?? '',
    use_private: item.private ?? '',
  };
}

const venues = cities.flatMap((c) => Object.entries(c.byType).flatMap(([t, list]) => list.map((item, i) => build(c, t, item, i))));
const source = 'Gids locaties Nederland (demo): namen uit de gids, overige gegevens en ligging zijn fictief. Gegenereerd door scripts/build-gids.js.';
writeFileSync('data/gids-venues.json', `{\n"source": ${JSON.stringify(source)},\n"venues": [\n${venues.map((v) => JSON.stringify(v)).join(',\n')}\n]\n}\n`);
const count = {};
venues.forEach((v) => (count[v.type] = (count[v.type] ?? 0) + 1));
console.log(`${venues.length} venues in ${cities.length} cities`, count);
