// Zakelijk → Statistieken: fairness, group size, reasons, origin and a neighbourhood comparison.
// What is visible depends on the plan (see core/plans.js).

import { t } from '../../i18n/nl.js';
import { loadingFor } from '../../ui/loading.js';
import { showToast } from '../../ui/toast.js';
import { getStats, getVenue, OfflineError } from '../services/business-api.js';
import { guard } from './guard.js';
import { staleNote } from './overview.js';
import { can, limit } from '../core/entitlements.js';
import { PLANS, requiredPlan } from '../core/plans.js';
import { splitShares, toCsv } from '../core/stats.js';
import { pageHead, bars, tooFew, lockedFeature, offlineCard } from '../ui/widgets.js';

const b = t.business;
const PERIODS = [7, 30, 90, 365];
let period = 30;

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  const maxDays = limit(ctx.sub, 'history_days');
  if (period > maxDays) period = Math.max(...PERIODS.filter((p) => p <= maxDays));

  const stop = loadingFor(container, b.loading);
  let stats;
  let venue;
  try {
    [stats, venue] = await Promise.all([getStats(period), getVenue()]);
  } catch (error) {
    stop();
    if (!(error instanceof OfflineError)) throw error;
    container.innerHTML = `<section class="screen">${pageHead(b.stats.eyebrow, b.stats.title)}${offlineCard()}</section>`;
    return;
  }
  stop();

  const { range, benchmark } = stats;
  const canCsv = can(ctx.sub, 'csv_export');
  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.stats.eyebrow, b.stats.title, b.stats.sub)}
      ${ctx.banner}${staleNote(stats)}
      <div class="toolbar biz-toolbar">
        <div class="chips" role="group" aria-label="Periode">
          ${PERIODS.map((p) => `<button type="button" class="chip" data-period="${p}" aria-pressed="${p === period}" ${p > maxDays ? 'data-locked' : ''}>${b.stats.periods[p]}${p > maxDays ? ` <span class="plan-pill orange">${b.plans[PERIODS_PLAN(p)]}</span>` : ''}</button>`).join('')}
        </div>
        <button type="button" class="btn btn-small" data-csv ${canCsv ? '' : 'disabled'} title="${canCsv ? '' : b.locked.needs(b.plans[requiredPlan('csv_export')])}">${b.stats.export}${canCsv ? '' : ` <span class="plan-pill orange">${b.plans[requiredPlan('csv_export')]}</span>`}</button>
      </div>
      <div class="biz-grid cols-2e">
        ${can(ctx.sub, 'stats_fairness') ? fairnessCard(range) : lockedFeature(b.stats.fairnessTitle, 'stats_fairness', fairnessCard(range))}
        ${can(ctx.sub, 'stats_size') ? sizeCard(range) : lockedFeature(b.stats.sizeTitle, 'stats_size', sizeCard(range))}
      </div>
      <div class="biz-grid cols-2e">
        ${can(ctx.sub, 'stats_why') ? whyCard(range) : lockedFeature(b.stats.whyTitle, 'stats_why', whyCard(range))}
        ${can(ctx.sub, 'stats_origin') ? originCard(range) : lockedFeature(b.stats.originTitle, 'stats_origin', originCard(range))}
      </div>
      ${can(ctx.sub, 'benchmark') ? benchCard(range, benchmark, venue) : lockedFeature(b.stats.benchTitle, 'benchmark', benchCard(range, benchmark ?? { peers: 7, radius: 2, choice_rate: 4.1, rating: 4.3, travel: 27 }, venue))}
      <p class="demo-note">${b.demoNote}</p>
    </section>`;

  container.querySelectorAll('[data-period]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const p = Number(btn.dataset.period);
      if (p > maxDays) {
        showToast(b.stats.longPeriodLocked(b.plans[PERIODS_PLAN(p)]));
        return;
      }
      period = p;
      render(container);
    }),
  );
  container.querySelector('[data-csv]')?.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([toCsv(range)], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `aether-statistieken-${period}d.csv` });
    a.click();
    URL.revokeObjectURL(url);
    showToast(b.stats.exported);
  });
}

// Cheapest plan that keeps this many days of history.
function PERIODS_PLAN(days) {
  return Object.values(PLANS).find((p) => p.limits.history_days >= days).id;
}

function fairnessCard(range) {
  const buckets = [['0,9 – 1,0', 0.31], ['0,8 – 0,9', 0.44], ['0,7 – 0,8', 0.17], ['< 0,7', 0.08]];
  return `<div class="card"><h2>${b.stats.fairnessTitle}</h2><p class="muted small">${b.stats.fairnessSub}</p>
    <div class="big-numbers"><div><div class="mono big">${range.fairness.toFixed(2).replace('.', ',')}</div><small class="muted">${b.stats.avgFairness}</small></div><div><div class="mono big">${Math.round(range.travel)} ${b.stats.min}</div><small class="muted">${b.stats.avgTravel}</small></div></div>
    ${bars(buckets.map(([label, w]) => ({ label, share: Math.round(w * 100) })), 'mint')}</div>`;
}

function sizeCard(range) {
  const split = splitShares(range.sizes);
  if (!split) return `<div class="card"><h2>${b.stats.sizeTitle}</h2>${tooFew()}</div>`;
  const mid = split.filter((s) => s.key === '4-6' || s.key === '7-9').reduce((s, x) => s + x.share, 0);
  return `<div class="card"><h2>${b.stats.sizeTitle}</h2><p class="muted small">${b.stats.sizeSub}</p>
    ${bars(split.map((s) => ({ label: b.stats.sizeBuckets[s.key], share: s.share })))}<p class="small muted tip">${b.stats.sizeTip(mid)}</p></div>`;
}

function whyCard(range) {
  const split = splitShares(range.wishes);
  return `<div class="card"><h2>${b.stats.whyTitle}</h2><p class="muted small">${b.stats.whySub}</p>
    ${split ? bars(split.map((s) => ({ label: b.stats.wishes[s.key], share: Math.round((s.count / Math.max(range.chosen, 1)) * 100) }))) : tooFew()}</div>`;
}

function originCard(range) {
  const split = splitShares(range.origins);
  return `<div class="card"><h2>${b.stats.originTitle}</h2><p class="muted small">${b.stats.originSub}</p>
    ${split ? bars(split.map((s) => ({ label: s.key, share: s.share })), 'mint') : tooFew()}</div>`;
}

function benchCard(range, bench, venue) {
  if (!bench) return `<div class="card"><h2>${b.stats.benchTitle}</h2><p class="muted">${b.stats.benchNone}</p></div>`;
  const mine = range.shortlisted ? Math.round((range.chosen / range.shortlisted) * 1000) / 10 : 0;
  const row = (label, a, c) => `<tr><td>${label}</td><td class="mono">${a}</td><td class="mono">${c}</td></tr>`;
  const f = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  return `<div class="card"><h2>${b.stats.benchTitle}</h2><p class="muted small">${b.stats.benchSub(bench.peers, bench.radius ?? 2)}</p>
    <table class="table"><tr><th></th><th>${b.stats.me}</th><th>${b.stats.area}</th></tr>
    ${row(b.stats.benchRows.choice, `${f(mine)}%`, `${f(bench.choice_rate)}%`)}
    ${row(b.stats.benchRows.travel, `${Math.round(range.travel)} ${b.stats.min}`, `${Math.round(bench.travel)} ${b.stats.min}`)}
    ${row(b.stats.benchRows.rating, venue?.rating ? f(venue.rating) : '–', bench.rating ? f(bench.rating) : '–')}</table></div>`;
}
