// One plan as a card on the "Abonnement kiezen" screen, plus the text lines that describe it.

import { t } from '../../i18n/nl.js';
import { PLANS, PLAN_ORDER, YEAR_MONTHS } from '../core/plans.js';
import { esc } from '../../ui/dom.js';

const b = t.business;
const SHOWN_LIMITS = ['requests', 'users', 'locations', 'photos', 'featured_weeks', 'history_days'];
const MISSING_HINTS = ['requests', 'featured', 'benchmark', 'csv_export', 'api'];

// What this plan adds compared with the one below it, as short lines.
export function planLines(planId) {
  const i = PLAN_ORDER.indexOf(planId);
  const prev = i > 0 ? PLANS[PLAN_ORDER[i - 1]] : null;
  const plan = PLANS[planId];
  const lines = [];
  if (prev) lines.push(b.plans2.everythingOf(b.plans[prev.id]));
  for (const f of Object.keys(plan.features)) {
    if (prev?.features[f] || !b.features[f] || f === 'requests') continue;
    lines.push(b.features[f]);
  }
  for (const name of SHOWN_LIMITS) {
    const value = plan.limits[name];
    if (value === 0 || (name === 'featured_weeks' && !value)) continue;
    if (prev && prev.limits[name] === value) continue;
    lines.push(b.limitLine[name](value));
  }
  lines.push(b.support[plan.support]);
  const missing = MISSING_HINTS.filter((f) => (f in plan.features ? false : f in PLANS.chain.features || f === 'requests') && !(f === 'requests' && plan.limits.requests > 0)).slice(0, 3);
  return { lines, missing: missing.map((f) => (f === 'requests' ? b.features.requests : b.features[f])) };
}

export function planCard(planId, { period, current, pending, featured }) {
  const plan = PLANS[planId];
  const { lines, missing } = planLines(planId);
  const price = plan.custom
    ? `<div class="price">${b.plans2.custom}</div><small class="muted">${b.plans2.from(plan.monthly)}</small>`
    : `<div class="price">${b.eur(period === 'year' ? plan.monthly * YEAR_MONTHS : plan.monthly)} <small>${period === 'year' ? b.plans2.perYear : b.plans2.perMonth}</small></div>${period === 'year' && plan.monthly ? `<small class="muted">${b.eur(Math.round((plan.monthly * YEAR_MONTHS) / 12 * 100) / 100)} ${b.plans2.perMonth}</small>` : ''}`;
  const label = current ? b.plans2.current : plan.custom ? b.plans2.contact : planId === 'basis' ? b.plans2.freeStart : b.plans2.choose(b.plans[planId]);
  return `
    <div class="card plan ${featured ? 'featured' : ''} ${current ? 'is-current' : ''}">
      ${featured ? `<span class="plan-pill ribbon">${b.plans2.mostChosen}</span>` : ''}
      <h3>${b.plans[planId]}</h3><p class="muted small">${b.planFor[planId]}</p>
      ${price}
      <ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}${missing.map((l) => `<li class="off">${esc(l)}</li>`).join('')}</ul>
      <button class="btn ${featured && !current ? 'btn-primary' : ''}" type="button" data-plan="${planId}" ${current ? 'disabled' : ''}>${label}</button>
      ${pending ? `<small class="muted">${esc(pending)}</small>` : ''}
    </div>`;
}
