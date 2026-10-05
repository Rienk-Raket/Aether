// Demo billing maths: prices, VAT, pro-rata upgrades, renewal dates and the (fictional) invoice list.

import { PLANS, ADDONS, YEAR_MONTHS } from './plans.js';

export const VAT_RATE = 0.21;
const round2 = (n) => Math.round(n * 100) / 100;

export const withVat = (amount) => round2(amount * (1 + VAT_RATE));
export const vatOf = (amount) => round2(amount * VAT_RATE);

// Price of a plan for one billing period, excluding VAT.
export const periodPrice = (planId, period) => PLANS[planId].monthly * (period === 'year' ? YEAR_MONTHS : 1);

// Yearly price per month, for "2 maanden gratis" style hints.
export const monthlyEquivalent = (planId, period) => (period === 'year' ? (PLANS[planId].monthly * YEAR_MONTHS) / 12 : PLANS[planId].monthly);

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const renewalDate = (start, period) => addMonths(start, period === 'year' ? 12 : 1);

// Upgrade: pay the difference for the rest of the current period.
export function prorate(fromPlan, toPlan, period, daysLeft, daysInPeriod) {
  const diff = periodPrice(toPlan, period) - periodPrice(fromPlan, period);
  if (diff <= 0 || daysInPeriod <= 0) return 0;
  return round2(diff * Math.min(Math.max(daysLeft, 0), daysInPeriod) / daysInPeriod);
}

export const addonPrice = (name, count = 1) => ADDONS[name].price * count;

// Fictional invoices from the subscription: one per past period, one planned, plus bought extras.
// Deterministic: same subscription → same list.
export function buildInvoices(sub, now = new Date()) {
  if (!sub || sub.plan === 'basis' || sub.status === 'trial') return [];
  const invoices = [];
  const months = sub.billing_period === 'year' ? 12 : 1;
  const price = periodPrice(sub.plan, sub.billing_period);
  let date = new Date(sub.started_at);
  let n = 0;
  while (date <= now && n < 60) {
    invoices.push(invoice(date, `${PLANS[sub.plan].id}:${n}`, 'period', price, 'paid'));
    date = addMonths(date, months);
    n += 1;
  }
  if (sub.status !== 'cancelled') invoices.push(invoice(date, `${PLANS[sub.plan].id}:${n}`, 'renewal', price, 'planned'));
  for (const p of sub.purchases ?? []) invoices.push(invoice(new Date(p.at), p.id, p.name, p.amount, 'paid'));
  return invoices.sort((a, b) => b.issued_at.localeCompare(a.issued_at)).map((inv, i, all) => ({ ...inv, number: numberFor(inv, all.length - i) }));
}

function invoice(date, id, kind, amount, status) {
  return { id, kind, issued_at: new Date(date).toISOString(), amount_ex_vat: amount, vat: vatOf(amount), total: withVat(amount), status };
}

const numberFor = (inv, order) => `AE-${inv.issued_at.slice(0, 4)}-${String(order * 137 + 5).padStart(4, '0')}`;
