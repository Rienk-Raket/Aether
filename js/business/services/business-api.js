// The only file the business screens use for data. "Online" things (statistics, confirming a
// request, changing the plan) go through the fictional service Zaakwijzer and need a connection;
// offline you see the last answer that was saved, marked as outdated.

import * as provider from './mock/zaakwijzer-mock.js';
import { simulateLatency } from '../../services/mock/network.js';
import { fetchAllVenues } from '../../services/mock/plekwijzer-mock.js';
import { isOffline } from '../../services/connectivity.js';
import { OfflineError } from '../../services/places.js';
import { cacheGet, cacheSet, cacheClear } from '../../data/cache.js';
import { isoDay } from '../core/stats.js';
import { getState, update, saveVenueOverrides, applyOverrides } from '../data/store.js';
import { ADDONS } from '../core/plans.js';
import { logActivity } from '../../data/activity.js';

export const PROVIDER_NAME = 'Zaakwijzer (demo)';
const TTL_MS = 15 * 60 * 1000;
export { OfflineError };

// Statistics for the last `days` days. Returns { range, benchmark, fetched_at, source: 'live' | 'cache' | 'stale' }.
export async function getStats(days) {
  const state = getState();
  const key = `biz:stats:v1:${state.venue_id}:${days}:${isoDay(new Date())}`;
  const cached = await cacheGet(key);
  if (cached && !cached.expired) return { ...cached.data, source: 'cache' };
  if (isOffline()) {
    if (cached) return { ...cached.data, source: 'stale' };
    throw new OfflineError();
  }
  const data = await provider.fetchStats(state.venue_id, days);
  await cacheSet(key, data, TTL_MS);
  return { ...data, source: 'live' };
}

// The venue as groups see it (with the owner's edits from "Mijn zaak").
export async function getVenue() {
  const state = getState();
  const venue = (await fetchAllVenues()).find((v) => v.id === state.venue_id);
  return venue ? applyOverrides(venue) : null;
}

async function online() {
  if (isOffline()) throw new OfflineError();
  await simulateLatency(300, 700);
}

export async function saveVenueProfile(fields) {
  await online();
  saveVenueOverrides(getState().venue_id, fields);
  await cacheClear(); // groups must see the new details, not an older saved copy
  await logActivity('place', 'Zaakprofiel bijgewerkt', getState().business.name, '#/zakelijk/zaak');
}

export async function answerRequest(id, status) {
  await online();
  update((s) => {
    s.requests.find((r) => r.id === id).status = status;
  });
  const req = getState().requests.find((r) => r.id === id);
  await logActivity('appointment', status === 'confirmed' ? `Aanvraag van ${req.group_name} bevestigd` : `Aanvraag van ${req.group_name} afgewezen`, '', '#/zakelijk/aanvragen');
}

export async function changePlan(plan, period, { immediately }) {
  await online();
  update((s) => {
    const sub = s.subscription;
    if (immediately) Object.assign(sub, { plan, billing_period: period, status: 'active', trial_ends_at: null, pending_plan: null });
    else sub.pending_plan = { plan, billing_period: period };
  });
  await logActivity('system', 'Abonnement gewijzigd (demo)', plan, '#/zakelijk/abonnement');
}

export async function buyAddon(name) {
  await online();
  update((s) => {
    const sub = s.subscription;
    sub.addons[name] = (sub.addons[name] ?? 0) + 1;
    sub.purchases.push({ id: `x-${name}-${sub.purchases.length}`, name: name === 'requests' ? 'requests_pack' : name, amount: ADDONS[name].price, at: new Date().toISOString() });
  });
}

export async function setSubscriptionStatus(status, extra = {}) {
  await online();
  update((s) => Object.assign(s.subscription, { status }, extra));
}

export async function inviteUser(name, email, role) {
  await online();
  update((s) => s.users.push({ id: `u-${Date.now()}`, name, email, role, last_active: null }));
}
