// Fictional venue service "Plekwijzer". It pretends to look venues up online;
// in reality it reads data/venues.json and data/gids-venues.json (all venues are made up).

import { simulateLatency, loadBundledJson } from './network.js';
import { applyOverridesToList } from '../../business/data/store.js';

export async function fetchAllVenues() {
  await simulateLatency(250, 550);
  const [base, guide] = await Promise.all([loadBundledJson('data/venues.json'), loadBundledJson('data/gids-venues.json')]);
  return applyOverridesToList([...base.venues, ...guide.venues]);
}
