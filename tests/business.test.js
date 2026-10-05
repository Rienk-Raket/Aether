import { describe, it, expect } from 'vitest';
import { PLANS, PLAN_ORDER, requiredPlan } from '../js/business/core/plans.js';
import { effectivePlan, can, limit, losses } from '../js/business/core/entitlements.js';
import { periodPrice, prorate, withVat, buildInvoices, addMonths } from '../js/business/core/billing.js';
import { dayStats, rangeStats, splitShares, funnel, trend, median, toCsv } from '../js/business/core/stats.js';

const sub = (over = {}) => ({ plan: 'growth', status: 'active', billing_period: 'year', started_at: '2026-03-01T10:00:00.000Z', addons: {}, ...over });
const venue = { id: 'amsterdam-restaurant-1', popularity: 0.48, rating: 4.7 };
const cities = ['Amsterdam', 'Utrecht', 'Haarlem', 'Almere'];

describe('plans', () => {
  it('each plan has everything of the plan below it', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const lower = PLANS[PLAN_ORDER[i - 1]];
      const higher = PLANS[PLAN_ORDER[i]];
      for (const f of Object.keys(lower.features)) expect(higher.features[f]).toBe(true);
      for (const name of Object.keys(lower.limits)) expect(higher.limits[name]).toBeGreaterThanOrEqual(lower.limits[name]);
      expect(higher.monthly).toBeGreaterThan(lower.monthly);
    }
  });
  it('knows the cheapest plan for a feature', () => {
    expect(requiredPlan('benchmark')).toBe('growth');
    expect(requiredPlan('csv_export')).toBe('pro');
  });
});

describe('entitlements', () => {
  it('uses the plan while active and Basis when paused', () => {
    expect(can(sub(), 'benchmark')).toBe(true);
    expect(can(sub({ status: 'paused' }), 'benchmark')).toBe(false);
    expect(effectivePlan(sub({ status: 'paused' }))).toBe('basis');
  });
  it('falls back to Basis after the trial or the cancel date', () => {
    const now = new Date('2026-10-05');
    expect(effectivePlan(sub({ status: 'trial', trial_ends_at: '2026-09-01' }), now)).toBe('basis');
    expect(effectivePlan(sub({ status: 'trial', trial_ends_at: '2026-11-01' }), now)).toBe('growth');
    expect(effectivePlan(sub({ status: 'cancelled', cancel_at: '2026-09-01' }), now)).toBe('basis');
    expect(effectivePlan(sub({ status: 'cancelled', cancel_at: '2026-12-01' }), now)).toBe('growth');
  });
  it('adds bought extras to the limit', () => {
    expect(limit(sub(), 'requests')).toBe(100);
    expect(limit(sub({ addons: { requests: 1, users: 2 } }), 'requests')).toBe(150);
    expect(limit(sub({ addons: { users: 2 } }), 'users')).toBe(7);
    expect(limit(sub({ plan: 'pro' }), 'requests')).toBe(Infinity);
  });
  it('lists what is lost on a downgrade', () => {
    const lost = losses('growth', 'start');
    expect(lost.some((l) => l.name === 'benchmark')).toBe(true);
    expect(lost.some((l) => l.kind === 'limit' && l.name === 'requests' && l.to === 25)).toBe(true);
    expect(losses('start', 'growth')).toEqual([]);
  });
});

describe('billing', () => {
  it('charges 10 months for a year and adds 21% VAT', () => {
    expect(periodPrice('growth', 'year')).toBe(490);
    expect(periodPrice('growth', 'month')).toBe(49);
    expect(withVat(490)).toBe(592.9);
  });
  it('prorates an upgrade for the rest of the period', () => {
    expect(prorate('start', 'growth', 'month', 15, 30)).toBe(15);
    expect(prorate('growth', 'start', 'month', 15, 30)).toBe(0);
    expect(prorate('start', 'growth', 'month', 99, 30)).toBe(30);
  });
  it('builds a stable invoice list with one planned renewal', () => {
    const now = new Date('2026-10-05');
    const a = buildInvoices(sub(), now);
    expect(a).toEqual(buildInvoices(sub(), now));
    expect(a.filter((i) => i.status === 'planned')).toHaveLength(1);
    expect(a.filter((i) => i.status === 'paid')).toHaveLength(1);
    expect(buildInvoices(sub({ plan: 'basis' }), now)).toEqual([]);
    expect(addMonths(new Date('2026-03-01'), 12).getFullYear()).toBe(2027);
  });
});

describe('statistics', () => {
  it('is the same every time for the same venue and day', () => {
    expect(dayStats(venue, '2026-10-02', cities)).toEqual(dayStats(venue, '2026-10-02', cities));
    expect(dayStats(venue, '2026-10-02', cities)).not.toEqual(dayStats(venue, '2026-10-03', cities));
  });
  it('keeps the funnel in order and the trend sensible', () => {
    const r = rangeStats(venue, 30, '2026-10-05', cities);
    expect(r.shown).toBeGreaterThan(r.shortlisted);
    expect(r.shortlisted).toBeGreaterThan(r.chosen);
    expect(r.chosen).toBeGreaterThanOrEqual(r.requests);
    expect(r.fairness).toBeGreaterThan(0.5);
    expect(r.fairness).toBeLessThanOrEqual(1);
    expect(funnel(r)[1].rate).toBeGreaterThan(0);
    expect(r.days).toHaveLength(30);
  });
  it('hides a split below 5 choices', () => {
    expect(splitShares({ a: 2, b: 2 })).toBeNull();
    expect(splitShares({ a: 6, b: 4 })[0]).toEqual({ key: 'a', count: 6, share: 60 });
  });
  it('handles empty comparisons', () => {
    expect(trend(5, 0)).toBeNull();
    expect(trend(120, 100)).toBe(20);
    expect(median([])).toBeNull();
    expect(median([1, 5, 3])).toBe(3);
    expect(toCsv(rangeStats(venue, 3, '2026-10-05', cities)).split('\n')).toHaveLength(4);
  });
});

describe('fairness is independent of plans', () => {
  it('the ranking code does not know about subscriptions', async () => {
    const { readFileSync } = await import('node:fs');
    for (const file of ['js/core/candidates.js', 'js/core/fairness.js', 'js/core/venues.js']) {
      expect(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).not.toMatch(/business|subscription|entitlement/i);
    }
  });
});
