// Small building blocks for the business screens (HTML strings). Text from users goes through esc().

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { PLANS, requiredPlan } from '../core/plans.js';

const b = t.business;

export const pageHead = (eyebrow, title, sub = '', actions = '') => `
  <header class="biz-head">
    <div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>
    ${actions ? `<div class="biz-actions">${actions}</div>` : ''}
  </header>`;

export const kpi = (label, value, change) => {
  const text = change === null || change === undefined ? b.overview.noTrend : b.overview.vsPrev(change);
  const tone = change === null || change === undefined ? 'muted' : change < 0 ? 'down' : '';
  return `<div class="card kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="delta ${tone}">${esc(text)}</div></div>`;
};

export const planPill = (planId, extra = '') => `<span class="plan-pill ${planId === 'basis' ? 'blue' : ''}">${esc(b.plans[planId])}${extra}</span>`;

export const statusPill = (text, tone) => `<span class="status ${tone}">${esc(text)}</span>`;

// rows: [{ label, share (0-100), text }]
export function bars(rows, tone = '') {
  return `<div class="bars">${rows
    .map((r) => `<div class="bar-row"><span>${esc(r.label)}</span><div class="bar-track" role="presentation"><div class="bar-fill ${tone}" style="width:${Math.max(r.share, 2)}%"></div></div><span class="mono">${esc(r.text ?? `${r.share}%`)}</span></div>`)
    .join('')}</div>`;
}

export const tooFew = () => `<p class="muted small too-few">${icon('quiet')} ${b.overview.tooFew}. ${b.overview.tooFewHint}</p>`;

// Funnel rows: [{ key, count, rate }] with the label texts from the strings.
export function funnelHtml(steps) {
  const top = steps[0].count || 1;
  return `<div class="funnel">${steps
    .map((s, i) => {
      const [label, sub] = b.overview.funnel[s.key];
      const prev = steps[i - 1] ? b.overview.funnel[steps[i - 1].key][0].toLowerCase() : '';
      return `<div class="funnel-row"><span>${label}<br><small>${s.rate === null ? sub : b.overview.rateOf(s.rate, prev)}</small></span><div class="funnel-bar" style="width:${Math.max((s.count / top) * 100, 1)}%"></div><span class="num">${b.num(s.count)}</span></div>`;
    })
    .join('')}</div>`;
}

// Line chart of one or two series (arrays of numbers). Drawn as inline SVG so it works offline.
export function lineChart(series, labels, alt) {
  const w = 760, h = 230, pad = 34;
  const max = Math.max(1, ...series.flat()) * 1.1;
  const x = (i, n) => pad + (i * (w - pad - 10)) / Math.max(n - 1, 1);
  const y = (v) => h - 26 - (v / max) * (h - 44);
  const colors = ['var(--blue)', 'var(--mint)'];
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="${pad}" x2="${w - 10}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="rgba(255,255,255,.07)"/><text x="4" y="${y(max * f) + 4}">${Math.round(max * f)}</text>`).join('');
  const lines = series
    .map((s, k) => {
      const pts = s.map((v, i) => `${x(i, s.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      const area = k === 0 ? `<polygon points="${pad},${h - 26} ${pts} ${w - 10},${h - 26}" fill="${colors[0]}" opacity=".1"/>` : '';
      return `${area}<polyline points="${pts}" fill="none" stroke="${colors[k]}" stroke-width="2.4" stroke-linejoin="round"/>`;
    })
    .join('');
  const ticks = labels.map(([i, text]) => `<text x="${x(i, series[0].length)}" y="${h - 6}" text-anchor="middle">${esc(text)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(alt)}">${grid}${lines}${ticks}</svg>`;
}

// Meter: value of max (Infinity = unlimited).
export function meter(label, value, max, valueText) {
  const share = max === Infinity || !max ? 0 : Math.min(100, Math.round((value / max) * 100));
  const text = valueText ?? `${value} / ${max === Infinity ? b.sub.unlimited : max}`;
  return `<div class="bar-row"><span>${esc(label)}</span><div class="bar-track" role="presentation"><div class="bar-fill mint" style="width:${Math.max(share, max === Infinity ? 0 : 2)}%"></div></div><span class="mono">${esc(text)}</span></div>`;
}

// A feature the current plan does not have: a blurred example plus a way to the plan screen.
export function lockedFeature(featureLabel, feature, example = '') {
  const plan = b.plans[requiredPlan(feature)];
  return `
    <div class="card locked">
      <div class="locked-example" aria-hidden="true">${example}</div>
      <div class="locked-cta">
        ${icon('settings')}
        <h2>${esc(featureLabel)}</h2>
        <p class="muted">${b.locked.needs(plan)}</p>
        <a class="btn btn-small btn-primary" href="#/zakelijk/abonnement/kiezen">${b.locked.action}</a>
      </div>
    </div>`;
}

export const offlineCard = () => `<div class="card empty-state">${icon('activity')}<h2>${b.offlineTitle}</h2><p class="muted">${b.offlineText}</p></div>`;

export const dateLabel = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(iso).toLocaleDateString('nl-NL', opts);
export const dateTimeLabel = (iso) => new Date(iso).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const planOf = (planId) => PLANS[planId];
