// Zakelijk → Abonnement: current plan, usage meters, next invoice, extras, pause and cancel.

import { t } from '../../i18n/nl.js';
import { showToast } from '../../ui/toast.js';
import { confirmDialog } from '../../ui/modal.js';
import { navigate } from '../../router.js';
import { resetBusiness } from '../data/store.js';
import { buyAddon, changePlan, setSubscriptionStatus, OfflineError } from '../services/business-api.js';
import { guard, noRight } from './guard.js';
import { limit } from '../core/entitlements.js';
import { ADDONS, PLANS } from '../core/plans.js';
import { periodPrice, withVat } from '../core/billing.js';
import { pageHead, planPill, meter, dateLabel } from '../ui/widgets.js';

const b = t.business;

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  if (!ctx.can('subscription')) {
    container.innerHTML = noRight();
    return;
  }
  const { sub, state, plan } = ctx;
  const paid = plan !== 'basis' || sub.plan !== 'basis';
  const used = {
    requests: state.requests.filter((r) => r.status !== 'declined').length,
    featured_weeks: sub.featured_used ?? 0,
    users: state.users.length,
    locations: 1,
  };
  const price = periodPrice(sub.plan, sub.billing_period);
  const contract = sub.status === 'trial' ? b.sub.trialText(dateLabel(sub.trial_ends_at)) : `${b.sub.contract[sub.billing_period]} · ${b.sub.since(dateLabel(sub.started_at))} · ${b.sub.renews(dateLabel(sub.renews_at))}`;
  const rows = ['requests', 'featured_weeks', 'users', 'locations'].filter((k) => PLANS[plan].limits[k] > 0);
  const meters = rows.map((k) => meter(b.sub.usageRows[k], used[k], limit(sub, k))).join('') + meter(b.sub.usageRows.history_days, 0, 0, `${limit(sub, 'history_days')} dagen`);

  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.sub.eyebrow, b.sub.title, b.sub.sub)}
      ${ctx.banner}
      ${sub.pending_plan ? `<div class="notice">${b.sub.pending(b.plans[sub.pending_plan.plan], dateLabel(sub.renews_at))}</div>` : ''}
      <div class="biz-grid cols-2">
        <div class="card">
          <div class="card-row"><div>${planPill(plan, ' · demo')}
            <h2 class="biz-price">${b.eur(price)} <small class="muted">${sub.billing_period === 'year' ? b.per.year : b.per.month}, excl. btw</small></h2>
            <p class="muted small">${b.statuses[sub.status]} · ${contract}</p></div>
            <div class="card-side"><a class="btn btn-primary" href="#/zakelijk/abonnement/kiezen">${b.sub.changePlan}</a>${controls(sub)}</div></div>
          <h3 class="biz-sub">${b.sub.usageTitle}</h3><div class="bars">${meters}</div>
        </div>
        <div class="biz-stack">
          <div class="card"><h2>${b.sub.nextInvoice}</h2>${nextInvoice(sub, price)}</div>
          <div class="card"><h2>${b.sub.addonsTitle}</h2>${paid ? addons() : `<p class="muted small">${b.sub.basisText}</p>`}</div>
        </div>
      </div>
      <div class="card"><h2>${b.reset.title}</h2><p class="muted small">${b.reset.text}</p><button class="btn btn-small btn-danger" type="button" data-reset>${b.reset.action}</button></div>
      <p class="demo-note">${b.demoNote}</p>
    </section>`;

  const run = (action, message) => async () => {
    try {
      await action();
      showToast(message);
      render(container);
    } catch (error) {
      if (!(error instanceof OfflineError)) throw error;
      showToast(b.offlineAction);
    }
  };
  container.querySelectorAll('[data-buy]').forEach((el) => el.addEventListener('click', run(() => buyAddon(el.dataset.buy), b.sub.bought)));
  container.querySelector('[data-cancel]')?.addEventListener('click', async () => {
    if (await confirmDialog(b.sub.cancelConfirm(dateLabel(sub.renews_at)), { confirmLabel: b.sub.cancel, danger: true })) run(() => setSubscriptionStatus('cancelled', { cancel_at: sub.renews_at }), b.sub.cancelled)();
  });
  container.querySelector('[data-reset]').addEventListener('click', async () => {
    if (!(await confirmDialog(b.reset.text, { confirmLabel: b.reset.action, danger: true }))) return;
    resetBusiness();
    showToast(b.reset.done);
    navigate('/zakelijk/aansluiten');
  });
  container.querySelector('[data-pause]')?.addEventListener('click', run(() => setSubscriptionStatus('paused'), b.sub.paused));
  container.querySelector('[data-resume]')?.addEventListener('click', run(() => (sub.status === 'cancelled' ? setSubscriptionStatus('active', { cancel_at: null }) : changePlan(sub.plan, sub.billing_period, { immediately: true })), sub.status === 'cancelled' ? b.sub.cancelUndone : b.sub.resumed));
}

function controls(sub) {
  if (sub.status === 'paused') return `<button class="btn btn-small" type="button" data-resume>${b.sub.resume}</button>`;
  if (sub.status === 'cancelled') return `<button class="btn btn-small" type="button" data-resume>${b.sub.undoCancel}</button>`;
  if (sub.plan === 'basis') return '';
  return `<button class="btn btn-small" type="button" data-pause>${b.sub.pause}</button><button class="btn btn-small btn-danger" type="button" data-cancel>${b.sub.cancel}</button>`;
}

function nextInvoice(sub, price) {
  if (sub.plan === 'basis' || sub.status === 'cancelled') return `<p class="muted">${b.sub.none}</p>`;
  if (sub.status === 'trial') return `<p class="mono biz-big">${dateLabel(sub.trial_ends_at)}</p><p class="muted small">${b.sub.trialText(dateLabel(sub.trial_ends_at))}</p>`;
  return `<p class="mono biz-big">${dateLabel(sub.renews_at)}</p><p class="muted small">${b.sub.nextInvoiceText(price, withVat(price))}</p>`;
}

function addons() {
  return `<table class="table">${Object.entries(ADDONS).map(([k, a]) => `<tr><td>${b.addons[k]}</td><td class="mono">${b.eur(a.price)} <small class="muted">${b.per[a.per]}</small></td><td class="actions"><button class="btn btn-small" type="button" data-buy="${k}">${b.sub.buy}</button></td></tr>`).join('')}</table>`;
}
