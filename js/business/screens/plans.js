// Zakelijk → Abonnement kiezen: compare the five plans and switch (simulated).

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { showToast } from '../../ui/toast.js';
import { openSheet } from '../../ui/modal.js';
import { navigate } from '../../router.js';
import { changePlan, OfflineError } from '../services/business-api.js';
import { guard, noRight } from './guard.js';
import { PLAN_ORDER } from '../core/plans.js';
import { losses } from '../core/entitlements.js';
import { prorate } from '../core/billing.js';
import { pageHead, dateLabel } from '../ui/widgets.js';
import { planCard } from '../ui/plan-card.js';

const b = t.business;
let period = 'year';

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  if (!ctx.can('subscription')) {
    container.innerHTML = noRight();
    return;
  }
  const { sub } = ctx;
  if (sub.status === 'active' && sub.billing_period === 'month' && !container.dataset.touched) period = 'month';
  const pendingText = sub.pending_plan ? b.sub.pending(b.plans[sub.pending_plan.plan], dateLabel(sub.renews_at)) : '';

  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.plans2.eyebrow, b.plans2.title, b.plans2.sub)}
      ${ctx.banner}
      <div class="center"><div class="seg" role="group"><button type="button" data-period="month" aria-pressed="${period === 'month'}">${b.plans2.monthly}</button><button type="button" data-period="year" aria-pressed="${period === 'year'}">${b.plans2.yearly}</button></div></div>
      <div class="plans">${PLAN_ORDER.map((id) => planCard(id, { period, current: id === ctx.plan && sub.status !== 'trial' && period === sub.billing_period && !sub.pending_plan, featured: id === 'growth', pending: pendingText && sub.pending_plan.plan === id ? pendingText : '' })).join('')}</div>
      <div class="card"><h2>${b.plans2.contractTitle}</h2><div class="biz-grid cols-3">${b.plans2.contracts.map(([h, p]) => `<div><strong>${h}</strong><p class="small muted">${p}</p></div>`).join('')}</div></div>
      <p class="demo-note">${b.demoNote}</p>
    </section>`;

  container.querySelectorAll('[data-period]').forEach((el) => el.addEventListener('click', () => ((period = el.dataset.period), (container.dataset.touched = '1'), render(container))));
  container.querySelectorAll('[data-plan]').forEach((el) => el.addEventListener('click', () => choose(el.dataset.plan, ctx)));
}

async function choose(planId, ctx) {
  const { sub } = ctx;
  if (planId === 'chain') {
    showToast(b.plans2.contactDone);
    return;
  }
  const from = ctx.plan;
  const upgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(from) || sub.status === 'trial' || sub.status === 'paused';
  const lost = upgrade ? [] : losses(from, planId);
  const left = Math.max(0, Math.ceil((new Date(sub.renews_at) - new Date()) / 86400000));
  const days = sub.billing_period === 'year' ? 365 : 30;
  const amount = upgrade && sub.status === 'active' ? prorate(from, planId, sub.billing_period, left, days) : 0;
  const text = upgrade ? (amount > 0 ? b.plans2.upgradeNow(amount) : b.plans2.upgradeFree) : b.plans2.downgradeLater(dateLabel(sub.renews_at));
  const lostHtml = lost.length
    ? `<p><strong>${b.plans2.losesTitle}</strong></p><ul>${lost.map((l) => `<li>${esc(l.kind === 'feature' ? b.features[l.name] ?? l.name : b.plans2.lostLimit(b.limits[l.name], l.from, l.to))}</li>`).join('')}</ul>`
    : '';
  const ok = await openSheet({
    title: b.plans2.confirmTitle(b.plans[planId]),
    body: `<p>${esc(text)}</p>${lostHtml}<div class="sheet-actions"><button class="btn" type="button" data-no>${b.plans2.cancelBtn}</button><button class="btn btn-primary" type="button" data-yes>${b.plans2.confirm}</button></div>`,
    setup(el, close) {
      el.querySelector('[data-no]').addEventListener('click', () => close(false));
      el.querySelector('[data-yes]').addEventListener('click', () => close(true));
    },
  });
  if (!ok) return;
  try {
    await changePlan(planId, period, { immediately: upgrade });
    showToast(upgrade ? b.plans2.done(b.plans[planId]) : b.plans2.scheduled);
    navigate('/zakelijk/abonnement');
  } catch (error) {
    if (!(error instanceof OfflineError)) throw error;
    showToast(b.offlineAction);
  }
}
