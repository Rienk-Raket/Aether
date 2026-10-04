// Results: candidate places ranked by the fairness slider, a 2D map, and per-person travel times.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, initials, hueFor } from '../ui/dom.js';
import { renderMap2d } from '../ui/map2d.js';
import { createFairnessSlider } from '../ui/fairness-slider.js';
import { showToast } from '../ui/toast.js';
import { navigate } from '../router.js';
import { rankCandidates } from '../core/fairness.js';
import { personLevel, fairnessLevel, durationLevel } from '../core/levels.js';
import { formatTime } from '../core/dates.js';
import { saveAppointment } from '../data/appointments.js';
import { ensureSelf } from '../data/people.js';
import { loadResults } from './results-data.js';

const TOP = 8;

export async function renderResults(container, { id }) {
  const [data, self] = await Promise.all([loadResults(id), ensureSelf()]);
  if (!data) {
    container.innerHTML = `<section class="screen"><p>${t.common.notFound}</p><a href="#/afspraken">${t.common.back}</a></section>`;
    return;
  }
  const { appointment, group, participants, candidates, missing, warnings } = data;
  const start = new Date(appointment.datetime);

  container.innerHTML = `
    <section class="screen results">
      <a class="back-link" href="#/afspraken">${icon('back')} ${t.nav.appointments}</a>
      <header class="screen-header">
        <div>
          <h1 class="gradient-text">${esc(group?.name ?? t.appointments.unknownGroup)}</h1>
          <p class="muted mono small">${esc(start.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${formatTime(start)}</p>
        </div>
      </header>
      ${missing.length ? `<p class="notice">${esc(t.results.missing(missing.join(', ')))}</p>` : ''}
      ${warnings.filter((w) => w.code !== 'missing_location').map((w) => `<p class="notice">${t.warnings[w.code]}</p>`).join('')}
      ${candidates.length ? '' : `<div class="card empty-state">${icon('pin')}<h2>${t.results.empty}</h2></div>`}
      <p class="metrics mono" data-metrics></p>
      <div class="card map-card" data-map></div>
      <div class="section-head">
        <h2 class="section-title">${t.results.places}</h2>
        <span class="muted small">${t.results.estimateNote}</span>
      </div>
      <div data-list></div>
      <div class="slider-dock" data-slider></div>
    </section>`;

  if (!candidates.length) {
    container.querySelector('[data-map]').remove();
    return;
  }

  let alpha = appointment.fairness_priority ?? self.preferences.fairness_priority;
  let selectedId = null; // null = follow the best place

  function update() {
    const ranked = rankCandidates(candidates, alpha).slice(0, TOP);
    const selected = ranked.find((c) => c.id === selectedId) ?? ranked[0];

    renderMap2d(container.querySelector('[data-map]'), {
      participants,
      candidates: ranked,
      selectedId: selected.id,
      onSelect: (candidateId) => {
        selectedId = candidateId;
        update();
        container.querySelector(`[data-card="${CSS.escape(candidateId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      },
    });

    container.querySelector('[data-metrics]').innerHTML = metricsLine(selected);
    container.querySelector('[data-list]').innerHTML = ranked
      .map((c, i) => resultCard(c, i + 1, participants, c.id === selected.id, appointment.selected_area?.id === c.id))
      .join('');
  }

  // One listener on the list handles all cards (they are re-rendered on every slider move).
  container.querySelector('[data-list]').addEventListener('click', async (event) => {
    const choose = event.target.closest('[data-choose]');
    if (choose) {
      await choosePlace(appointment, candidates.find((c) => c.id === choose.dataset.choose), alpha);
      return;
    }
    const card = event.target.closest('[data-card]');
    if (card) {
      selectedId = card.dataset.card;
      update();
    }
  });

  createFairnessSlider(container.querySelector('[data-slider]'), {
    value: alpha,
    onInput: (value) => {
      alpha = value;
      selectedId = null;
      update();
    },
  });

  update();
}

function metricsLine(c) {
  return `
    <span class="level-${fairnessLevel(c.fairness)}">${t.results.fairness} ${c.fairness.toFixed(2)}</span>
    <span class="sep">|</span>
    <span>${t.results.avg} ${Math.round(c.stats.mean)} min</span>
    <span class="sep">|</span>
    <span title="${t.results.spreadTitle}">Δ ${Math.round(c.stats.stddev)} min</span>`;
}

function resultCard(c, rank, participants, isSelected, isChosen) {
  const times = participants
    .map((p, i) => {
      const minutes = c.times[i];
      return `
        <span class="time-chip level-${personLevel(minutes, c.stats.mean)}" title="${esc(p.name)}">
          <span class="mini-avatar" style="--hue:${hueFor(p.id)}">${esc(initials(p.name))}</span>${Math.round(minutes)}′
        </span>`;
    })
    .join('');

  return `
    <article class="card result-card ${isSelected ? 'selected' : ''}" data-card="${esc(c.id)}" tabindex="0">
      <div class="card-row">
        <div class="grow">
          <span class="rank mono">#${rank}</span>
          <span class="card-title inline">${esc(c.name)}</span>
          ${isChosen ? `<span class="badge">${t.results.chosen}</span>` : ''}
        </div>
        <span class="score mono level-${fairnessLevel(c.fairness)}" title="${t.results.fairness}">${c.fairness.toFixed(2)}</span>
      </div>
      <div class="muted small mono">
        <span class="level-${durationLevel(c.stats.mean)}">${t.results.avg} ${Math.round(c.stats.mean)} min</span>
        · ${t.results.longest} ${Math.round(c.stats.max)} min
      </div>
      <div class="time-chips">${times}</div>
      ${isSelected ? `<button type="button" class="btn btn-primary btn-small" data-choose="${esc(c.id)}">${icon('check')} ${t.results.choose}</button>` : ''}
    </article>`;
}

async function choosePlace(appointment, candidate, alpha) {
  const ranked = rankCandidates([candidate], alpha)[0];
  Object.assign(appointment, {
    selected_area: { id: candidate.id, name: candidate.name, lat: candidate.lat, lng: candidate.lng },
    fairness_score: Number(ranked.fairness.toFixed(2)),
    average_travel_time: Math.round(ranked.stats.mean),
    travel_time_stddev: Math.round(ranked.stats.stddev),
    fairness_priority: alpha,
  });
  await saveAppointment(appointment);
  showToast(t.results.saved(candidate.name));
  navigate('/afspraken');
}
