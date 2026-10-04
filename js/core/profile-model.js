// What a profile can say about itself, and sensible defaults. Pure data, no browser needed.
// Older profiles lack the newer fields, so everything read from storage goes through
// normalizePreferences().

export const VEHICLE_KINDS = ['electric', 'petrol', 'diesel', 'hybrid', 'hydrogen', 'other', 'bike', 'transit_pass'];
const NON_CAR_KINDS = ['bike', 'transit_pass'];
export const isCarKind = (kind) => !NON_CAR_KINDS.includes(kind);

// Values match data/venues.json (cuisines are stored as the Dutch names used there).
export const CUISINES = ['Europees', 'Italiaans', 'Aziatisch', 'Mediterraan', 'Vegetarisch', 'Streekkeuken', 'Wereldkeuken', 'Visrestaurant'];
export const DIETS = ['vegetarian', 'vegan', 'halal', 'gluten_free', 'lactose_free'];
export const ALLERGIES = ['peanut', 'tree_nut', 'shellfish', 'egg', 'soy', 'fish', 'sesame'];
export const PLACE_TYPES = ['restaurant', 'cafe', 'bar', 'meeting_room'];
export const ACCESSIBILITY = ['wheelchair', 'step_free', 'accessible_toilet'];
export const LATEST_RETURN_HOURS = [0, 22, 23, 24, 25]; // 0 = no limit, 24 = midnight, 25 = 01:00
// How strongly a venue feature matters: "no" = not important, "prefer" = nice to have, "must" = required.
export const WISH_LEVELS = ['no', 'prefer', 'must'];

export const DEFAULT_PROFILE_EXTRAS = {
  vehicles: [], // [{ id, kind, label }]
  no_car: false,
  dining: { cuisines: [], diets: [], allergies: [], terrace: 'no', kid_friendly: 'no', dog_friendly: 'no', quiet: 'no' },
  travel: { max_minutes: 0, needs_charger: false, needs_parking: false, avoid_rush_hour: false, latest_return_hour: 0 }, // max_minutes 0 = no limit
};

// Fills in anything missing and drops unknown values, without changing the original object.
export function normalizePreferences(prefs = {}) {
  const base = DEFAULT_PROFILE_EXTRAS;
  const vehicles = Array.isArray(prefs.vehicles) ? prefs.vehicles.filter((v) => VEHICLE_KINDS.includes(v?.kind)) : [];
  return {
    ...prefs,
    vehicles,
    no_car: Boolean(prefs.no_car),
    dining: { ...base.dining, ...prefs.dining },
    travel: { ...base.travel, ...prefs.travel },
  };
}

// Which modes of transport this profile can use, based on vehicles (walking is always possible).
export function availableModes(prefs) {
  const p = normalizePreferences(prefs);
  const modes = new Set(['walk', 'transit']);
  if (p.vehicles.some((v) => v.kind === 'bike')) modes.add('bike');
  if (!p.no_car && p.vehicles.some((v) => isCarKind(v.kind))) modes.add('car');
  // Nothing entered at all: do not take options away.
  if (p.vehicles.length === 0 && !p.no_car) ['bike', 'car'].forEach((m) => modes.add(m));
  if (p.no_car) modes.delete('car');
  return [...modes];
}

export const hasElectricCar = (prefs) => normalizePreferences(prefs).vehicles.some((v) => v.kind === 'electric');
