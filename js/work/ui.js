// Small building blocks for the work environment screens (HTML strings).

import { t } from '../i18n/nl.js';
import { esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { formatPriceRange } from '../core/venues.js';

const W = t.work;

export const pageHead = (title, sub = '', actions = '') => `
  <header class="biz-head">
    <div><p class="eyebrow">${W.eyebrow}</p><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>
    ${actions ? `<div class="biz-actions">${actions}</div>` : ''}
  </header>`;

export const euro = (n) => `€ ${new Intl.NumberFormat('nl-NL').format(n)}`;
export const dateTime = (iso) => new Date(iso).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const date = (iso) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

// One recommended venue as a row. `match` = { venue, met, missing, km }
export function venueRow(match, cityOf) {
  const v = match.venue;
  return `
    <a class="card card-link work-venue" href="#/plek/${encodeURIComponent(v.id)}">
      <span class="work-icon ${v.type}">${icon(v.type)}</span>
      <span class="grow">
        <strong>${esc(v.name)}</strong>
        <span class="muted small">${esc(t.placeTypes[v.type])} · ${esc(cityOf(v) ?? '')} · ★ ${v.rating.toFixed(1).replace('.', ',')} · ${esc(formatPriceRange(v))}${match.km !== null ? ` · ${W.places.km(match.km)}` : ''}</span>
        <span class="chips">${match.met.map((n) => `<span class="chip feature">${W.places.met[n]}</span>`).join('')}${match.missing.map((n) => `<span class="chip level-bad" title="${W.places.missing}">${W.places.met[n]} ✕</span>`).join('')}</span>
      </span>
      <span class="start-go">${icon('chevron')}</span>
    </a>`;
}

// Summary chips of the work wishes.
export function prefsSummary(work) {
  if (!work) return `<p class="muted">${W.prefs.empty}</p>`;
  const needs = Object.entries(work.needs ?? {}).filter(([, on]) => on).map(([n]) => W.prefs.needNames[n]).filter(Boolean);
  const rows = [
    [W.prefs.kind, work.meeting_kind ? W.places.meetingKinds[work.meeting_kind] : null],
    [W.prefs.group, work.group_size ? W.places.groupSizes[work.group_size] : null],
    [W.prefs.budget, work.budget_level ? W.prefs.budgets[work.budget_level] : null],
  ].filter(([, value]) => value);
  return `<div class="deck-summary">${rows.map(([k, v]) => `<div class="deck-summary-row"><span>${k}</span><span class="yes">${esc(v)}</span></div>`).join('')}</div>
    <p class="small muted">${W.prefs.needs}</p><div class="chips">${needs.length ? needs.map((n) => `<span class="chip feature">${esc(n)}</span>`).join('') : `<span class="muted small">${W.prefs.noNeeds}</span>`}</div>`;
}
