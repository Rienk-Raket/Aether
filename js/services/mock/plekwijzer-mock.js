// Fictional venue service "Plekwijzer". It pretends to look venues up online;
// in reality it reads data/venues.json and the venues the visitor imported (all venues are made up).

import { simulateLatency, loadBundledJson } from './network.js';
import { applyOverridesToList } from '../../business/data/store.js';
import { listImported } from '../../data/imported-venues.js';

export async function fetchAllVenues() {
  await simulateLatency(250, 550);
  const [base, imported] = await Promise.all([loadBundledJson('data/venues.json'), listImported()]);
  return applyOverridesToList([...base.venues, ...imported]);
}
