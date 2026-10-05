// Which plan counts right now, and what that plan allows. Screens only ask can() and limit().
// Paying never changes the venue ranking for groups: that code does not know about plans at all.

import { PLANS, ADDONS } from './plans.js';

// A subscription that is paused, cancelled (after its end date) or whose trial ran out counts as Basis.
export function effectivePlan(sub, now = new Date()) {
  if (!sub) return 'basis';
  if (sub.status === 'paused') return 'basis';
  if (sub.status === 'cancelled' && sub.cancel_at && new Date(sub.cancel_at) <= now) return 'basis';
  if (sub.status === 'trial' && sub.trial_ends_at && new Date(sub.trial_ends_at) <= now) return 'basis';
  return sub.plan;
}

export const can = (sub, feature, now) => PLANS[effectivePlan(sub, now)].features[feature] === true;

// Limit of the plan plus whatever extras were bought. Infinity means unlimited.
export function limit(sub, name, now) {
  const base = PLANS[effectivePlan(sub, now)].limits[name];
  if (base === Infinity || effectivePlan(sub, now) === 'basis') return base;
  const extra = (sub?.addons?.[name] ?? 0) * (ADDONS[name]?.unit ?? 0);
  return base + extra;
}

// What disappears when going from one plan to another: [{ kind: 'feature' | 'limit', name, from, to }]
export function losses(fromPlan, toPlan) {
  const from = PLANS[fromPlan];
  const to = PLANS[toPlan];
  const lostFeatures = Object.keys(from.features).filter((f) => !to.features[f]).map((name) => ({ kind: 'feature', name }));
  const lowerLimits = Object.keys(from.limits)
    .filter((name) => to.limits[name] < from.limits[name])
    .map((name) => ({ kind: 'limit', name, from: from.limits[name], to: to.limits[name] }));
  return [...lostFeatures, ...lowerLimits];
}
