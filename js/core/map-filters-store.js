// Remembers the filters of the Kaart on this device (localStorage), so a choice survives a reload
// and other screens can open the map with filters already set.

import { emptyFilters, normalizeFilters } from './map-filters.js';

export const FILTERS_KEY = 'aether.landmap.filters';

export function loadFilters() {
  try {
    return normalizeFilters(JSON.parse(localStorage.getItem(FILTERS_KEY)));
  } catch {
    return emptyFilters();
  }
}

export function saveFilters(filters) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(normalizeFilters(filters)));
  } catch {
    // not remembered
  }
}
