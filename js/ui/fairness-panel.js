// The "fairness panel": map + balance slider + stats + ranked places for one appointment.
// Used by Overzicht (compact) and Ontdek plekken (full). The caller provides the HTML slots,
// so each screen decides where things sit. One slider position is shared through the appointment.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc, initials, hueFor } from './dom.js';
import { renderMap2d } from './map2d.js';
import { createFairnessSlider } from './fairness-slider.js';
import { rankCandidates } from '../core/fairness.js';
import { personLevel, fairnessLevel, durationLevel } from '../core/levels.js';
import { groupEmissions, formatChange } from '../core/co2.js';
import { getSettings } from '../data/settings.js';

// data:   result of loadResults()
// slots:  { map, metrics, slider, stats, list } — any of them may be missing
// options: { alpha, topN, detail, onChoose(candidate, alpha), onAlpha(alpha), onSelect(candidate) }
export function createFairnessPanel(data, slots, options) {
  const { participants, candidates, appointment } = data;
  let alpha = options.alpha;
  let selectedId = appointment.selected_area?.id ?? null;
  let ranked = [];
  let notifiedId = null;

  const find = (id) => ranked.find((c) => c.id === id);

  function update() {
    ranked = rankCandidates(candidates, alpha).slice(0, options.topN);
    if (!find(selectedId)) selectedId = ranked[0].id;
    const selected = find(selectedId);
    if (selectedId !== notifiedId) {
      notifiedId = selectedId;
      options.onSelect?.(selected);
    }

    if (slots.map) {
      renderMap2d(slots.map, {
        participants,
        candidates: ranked,
        selectedId,
        onSelect: (id) => {
          selectedId = id;
          update();
          slots.list?.querySelector(`[data-card="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        },
      });
    }
    if (slots.metrics) slots.metrics.innerHTML = metricsLine(selected);
    if (slots.stats) slots.stats.innerHTML = statsTiles(selected, participants);
    if (slots.list) {
      slots.list.innerHTML = ranked
        .map((c, i) => placeCard(c, i + 1, participants, c.id === selectedId, appointment.selected_area?.id === c.id, options.detail))
        .join('');
    }
  }

  slots.list?.addEventListener('click', (event) => {
    const choose = event.target.closest('[data-choose]');
    if (choose) {
      options.onChoose?.(find(choose.dataset.choose), alpha);
      return;
    }
    const card = event.target.closest('[data-card]');
    if (card) {
      selectedId = card.dataset.card;
      update();
    }
  });

  slots.list?.addEventListener('keydown', (event) => {
    const card = event.target.closest?.('[data-card]');
    if (card && event.target === card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      selectedId = card.dataset.card;
      update();
      slots.list.querySelector(`[data-card="${CSS.escape(selectedId)}"]`)?.focus();
    }
  });

  if (slots.slider) {
    createFairnessSlider(slots.slider, {
      value: alpha,
      onInput: (value) => {
        alpha = value;
        selectedId = null; // follow the best place while sliding
        update();
      },
      onChange: (value) => options.onAlpha?.(value),
    });
  }

  update();
  return { update };
}

function metricsLine(c) {
  return `
    <span class="level-${fairnessLevel(c.fairness)}">${t.results.fairness} ${c.fairness.toFixed(2)}</span>
    <span class="sep">|</span>
    <span>${t.results.avg} ${Math.round(c.stats.mean)} min</span>
    <span class="sep">|</span>
    <span title="${t.results.spreadTitle}">Δ ${Math.round(c.stats.stddev)} min</span>`;
}

function statsTiles(c, participants) {
  const tiles = [
    [`${Math.round(c.stats.mean)} min`, t.results.statAvg],
    [`${Math.round(c.stats.stddev)} min`, t.results.statSpread],
  ];
  if (getSettings().showCo2) {
    const { changePct } = groupEmissions(participants, c);
    tiles.push([`≈ ${formatChange(changePct)}`, t.results.statCo2]);
  }
  return tiles.map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function placeCard(c, rank, participants, isSelected, isChosen, detail) {
  const worstCase = Math.round(c.stats.max);
  const times = participants
    .map((p, i) => `
      <span class="time-chip level-${personLevel(c.times[i], c.stats.mean)}" title="${esc(p.name)}">
        <span class="mini-avatar" style="--hue:${hueFor(p.id)}">${esc(initials(p.name))}</span>${Math.round(c.times[i])}′
      </span>`)
    .join('');

  return `
    <article class="place ${isSelected ? 'selected' : ''}" data-card="${esc(c.id)}" tabindex="0" aria-label="${esc(t.results.markerLabel(rank, c.name))}">
      <div class="thumb">${rank}</div>
      <div>
        <h3>${esc(c.name)} ${isChosen ? `<span class="badge">${t.results.chosen}</span>` : ''}</h3>
        <p class="level-${durationLevel(c.stats.mean)}">${t.results.everyoneWithin(worstCase)}</p>
        <p>${t.results.avg} ${Math.round(c.stats.mean)} min · Δ ${Math.round(c.stats.stddev)} min</p>
      </div>
      <div class="score"><strong class="level-${fairnessLevel(c.fairness)}">${Math.round(c.fairness * 100)}</strong><small>${t.results.fairnessWord}</small></div>
      ${
        detail
          ? `<div class="place-extra">
              <div class="time-chips">${times}</div>
              ${isSelected ? `<button type="button" class="btn btn-primary btn-small" data-choose="${esc(c.id)}">${icon('check')} ${t.results.choose}</button>` : ''}
            </div>`
          : ''
      }
    </article>`;
}
