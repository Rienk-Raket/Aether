// Fictional venue service "Plekwijzer". It pretends to look venues up online;
// in reality it reads data/venues.json (all venues are made up).

import { simulateLatency, loadBundledJson } from './network.js';

export async function fetchAllVenues() {
  await simulateLatency(250, 550);
  return (await loadBundledJson('data/venues.json')).venues;
}
