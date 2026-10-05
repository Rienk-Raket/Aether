// Zakelijk → Overzicht: key numbers, chart, funnel, origin and the subscription at a glance.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { loadingFor } from '../../ui/loading.js';
import { getStats, getVenue, OfflineError } from '../services/business-api.js';
import { guard } from './guard.js';
import { limit } from '../core/entitlements.js';
import { funnel, splitShares, isoDay } from '../core/stats.js';
import { pageHead, kpi, bars, funnelHtml, lineChart, planPill, tooFew, offlineCard, dateTimeLabel } from '../ui/widgets.js';

const b = t.business;
const DAYS = 30;

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  const stop = loadingFor(container, b.loading);
  let stats;
  let venue;
  try {
    [stats, venue] = await Promise.all([getStats(DAYS), getVenue()]);
  } catch (error) {
    stop();
    if (!(error instanceof OfflineError)) throw error;
    container.innerHTML = `<section class="screen">${pageHead(b.eyebrow, b.nav.overview)}${offlineCard()}</section>`;
    return;
  }
  stop();

  const { range } = stats;
  const sizes = splitShares(range.sizes);
  const avgSize = sizes ? (sizes.reduce((s, x) => s + ({ '2-3': 2.5, '4-6': 5, '7-9': 8, '10+': 12 }[x.key] * x.count), 0) / sizes.reduce((s, x) => s + x.count, 0)).toFixed(1).replace('.', ',') : '–';
  const origins = splitShares(range.origins);
  const weekdays = weekdayLoad(range);
  const used = ctx.state.requests.filter((r) => r.status !== 'declined').length;
  const max = limit(ctx.sub, 'requests');
  const fresh = ctx.state.requests.filter((r) => r.status === 'new');
  const labels = [0, 7, 14, 21, DAYS - 1].map((i) => [i, new Date(range.days[i].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })]);
  const alt = b.stats.chartAlt(b.num(range.shown), b.num(range.chosen));

  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.eyebrow, b.overview.greeting(ctx.user.name.split(' ')[0]), b.overview.sub(venue?.name ?? ctx.state.business.name, DAYS))}
      ${ctx.banner}
      ${staleNote(stats)}
      <div class="biz-grid cols-4">
        ${kpi(b.overview.chosen, b.num(range.chosen), range.trend.chosen)}
        ${kpi(b.overview.shortlisted, b.num(range.shortlisted), range.trend.shortlisted)}
        ${kpi(b.overview.requests, b.num(range.requests), range.trend.requests)}
        ${kpi(b.overview.size, avgSize, null)}
      </div>
      <div class="biz-grid cols-2">
        <div class="card"><h2>${b.overview.chartTitle}</h2>
          <p class="muted small legend"><span style="color:var(--blue)">●</span> ${b.overview.legendShown} &nbsp; <span style="color:var(--mint)">●</span> ${b.overview.legendChosen}</p>
          ${lineChart([range.days.map((d) => d.shown), range.days.map((d) => d.chosen * 8)], labels, alt)}</div>
        <div class="card"><h2>${b.overview.funnelTitle}</h2>${funnelHtml(funnel(range))}</div>
      </div>
      <div class="biz-grid cols-3">
        <div class="card"><h2>${b.overview.originTitle}</h2>${origins ? bars(origins.slice(0, 5).map((o) => ({ label: o.key, share: o.share })), 'mint') : tooFew()}</div>
        <div class="card"><h2>${b.overview.momentsTitle}</h2>${bars(weekdays, '')}</div>
        <div class="card"><h2>${b.overview.planTitle}</h2>
          <p class="biz-pill-row">${planPill(ctx.plan, ' · demo')}</p>
          ${max > 0 ? `<div class="usage-line"><p class="small muted">${b.overview.usage(used, max === Infinity ? b.sub.unlimited : max)}</p><div class="bar-track"><div class="bar-fill mint" style="width:${max === Infinity ? 5 : Math.min(100, Math.round((used / max) * 100))}%"></div></div></div>` : `<p class="muted small">${b.sub.basisText}</p>`}
          <a class="btn btn-small" href="#/zakelijk/abonnement">${b.overview.manage}</a></div>
      </div>
      <div class="card"><h2>${b.overview.newRequests}</h2>
        ${fresh.length ? `<div class="list-card">${fresh.slice(0, 3).map(requestRow).join('')}</div>` : `<p class="muted">${b.overview.noNew}</p>`}</div>
      <p class="demo-note">${b.demoNote}</p>
    </section>`;
}

function requestRow(r) {
  return `<div class="card-row biz-row"><div><strong>${esc(r.group_name)} · ${r.people} pers.</strong><br><small class="muted">${esc(dateTimeLabel(r.datetime))}</small></div><a class="btn btn-small btn-primary" href="#/zakelijk/aanvragen">${b.overview.open}</a></div>`;
}

// Choices per weekday (busiest first), as bar rows.
function weekdayLoad(range) {
  const totals = Array(7).fill(0);
  for (const d of range.days) totals[new Date(`${d.date}T12:00:00`).getDay()] += d.chosen;
  const top = Math.max(...totals, 1);
  return totals
    .map((n, i) => ({ label: b.overview.moments[i], share: Math.round((n / top) * 100), text: String(n), n }))
    .sort((a, c) => c.n - a.n)
    .slice(0, 4);
}

export const staleNote = (stats) => (stats.source === 'stale' ? `<div class="notice" role="status">${esc(b.stale(new Date(stats.fetched_at).toLocaleString('nl-NL')))}</div>` : '');
export { isoDay };
