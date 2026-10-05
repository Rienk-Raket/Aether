// Fictional venue service "Plekwijzer". It pretends to look venues up online;
// in reality it reads data/venues.json (all venues are made up).

import { simulateLatency, loadBundledJson } from './network.js';
import { applyOverridesToList } from '../../business/data/store.js';

export async function fetchAllVenues() {
  await simulateLatency(250, 550);
  return applyOverridesToList((await loadBundledJson('data/venues.json')).venues);
}
