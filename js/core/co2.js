// Rough CO₂ comparison: how much less does the group emit than if everybody drove?
//
// Grams of CO₂ per passenger-kilometre. Sources: CO2emissiefactoren.nl and CE Delft (STREAM
// Personenvervoer): average car ≈ 146 g, average public transport ≈ 28 g (electric train ≈ 17 g,
// bus ≈ 96 g). Walking and cycling are counted as 0. This is an estimate, shown with "≈".

import { haversineKm } from './geo.js';
import { TRANSPORT_MODES } from './travel-estimate.js';

export const GRAMS_PER_KM = { walk: 0, bike: 0, transit: 28, car: 146 };

export function tripKm(from, to, mode) {
  return haversineKm(from, to) * TRANSPORT_MODES[mode].detour;
}

// participants: [{ location: { lat, lng }, mode }], place: { lat, lng }
export function groupEmissions(participants, place) {
  let actual = 0;
  let allByCar = 0;
  for (const p of participants) {
    const km = tripKm(p.location, place, p.mode);
    actual += km * GRAMS_PER_KM[p.mode];
    allByCar += km * GRAMS_PER_KM.car;
  }
  const changePct = allByCar === 0 ? 0 : Math.round((actual / allByCar - 1) * 100);
  return { actualGrams: Math.round(actual), carGrams: Math.round(allByCar), changePct };
}

// −18 → "−18%", 0 → "0%"
export function formatChange(changePct) {
  return changePct < 0 ? `−${Math.abs(changePct)}%` : `${changePct}%`;
}
