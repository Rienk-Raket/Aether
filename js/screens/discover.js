// Ontdek plekken: the full fairness view for one appointment — big map, balance slider,
// all ranked places with travel times per person, and choosing the place.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { createFairnessPanel } from '../ui/fairness-panel.js';
import { showToast } from '../ui/toast.js';
import { navigate } from '../router.js';
import { rankCandidates } from '../core/fairness.js';
import { formatTime } from '../core/dates.js';
import { listAppointments, saveAppointment } from '../data/appointments.js';
import { logActivity } from '../data/activity.js';
import { ensureSelf } from '../data/people.js';
import { loadResults } from './results-data.js';
import { nextAppointment } from './home.js';

const TOP = 10;

export async function renderDiscover(container, _params, query) {
  const wantedId = query.get('afspraak') ?? (await nextAppointment())?.id;
  const data = wantedId && (await loadResults(wantedId));

  if (!data) {
    container.innerHTML = `
      <section class="screen">
        <div class="eyebrow">${t.discover.eyebrow}</div>
        <h1 class="section-gap">${t.discover.title}</h1>
        <div class="card empty-state section-gap">
          ${icon('compass')}
          <h2>${t.discover.noAppointment}</h2>
          <p class="muted">${t.discover.noAppointmentHint}</p>
          <a class="btn btn-primary" href="#/nieuw">${icon('plus')} ${t.shell.newAppointment}</a>
        </div>
      </section>`;
    return;
  }

  const { appointment, group, participants, missing, warnings } = data;
  const self = await ensureSelf();
  const upcoming = (await listAppointments()).filter((a) => new Date(a.datetime) >= startOfToday());
  const start = new Date(appointment.datetime);

  container.innerHTML = `
    <section class="screen">
      <div class="screen-header">
        <div>
          <div class="eyebrow">${t.discover.eyebrow}</div>
          <h1 class="section-gap">${t.discover.title}</h1>
          <p class="sub">${t.discover.sub}</p>
        </div>
        ${
          upcoming.length > 1
            ? `<label class="field"><span class="visually-hidden">${t.discover.pickAppointment}</span>
                <select data-pick>${upcoming
                  .map((a) => `<option value="${a.id}" ${a.id === appointment.id ? 'selected' : ''}>${esc(optionLabel(a))}</option>`)
                  .join('')}</select></label>`
            : ''
        }
      </div>

      <div class="chips section-gap">
        <span class="chip active">${esc(group?.name ?? t.appointments.unknownGroup)}</span>
        <span class="chip">${t.home.participants(participants.length)}</span>
        <span class="chip">${esc(start.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${formatTime(start)}</span>
      </div>

      ${missing.length ? `<p class="notice">${esc(t.results.missing(missing.join(', ')))}</p>` : ''}
      ${warnings.filter((w) => w.code !== 'missing_location').map((w) => `<p class="notice">${t.warnings[w.code]}</p>`).join('')}

      <div class="dashboard section-gap">
        <div class="card">
          <div class="section-head">
            <h2>${t.discover.areaTitle}</h2>
            <span class="badge badge-demo">${t.results.estimateNote}</span>
          </div>
          <p class="metrics mono" data-metrics></p>
          <div data-map></div>
          <div data-slider></div>
          <div class="stats" data-stats></div>
        </div>
        <div class="card">
          <div class="section-head"><h2>${t.discover.listTitle}</h2></div>
          <div class="place-list" data-list></div>
        </div>
      </div>
    </section>`;

  container.querySelector('[data-pick]')?.addEventListener('change', (event) => navigate(`/ontdek?afspraak=${event.target.value}`));

  createFairnessPanel(
    data,
    {
      map: container.querySelector('[data-map]'),
      metrics: container.querySelector('[data-metrics]'),
      slider: container.querySelector('[data-slider]'),
      stats: container.querySelector('[data-stats]'),
      list: container.querySelector('[data-list]'),
    },
    {
      alpha: appointment.fairness_priority ?? self.preferences.fairness_priority,
      topN: TOP,
      detail: true,
      onAlpha: (alpha) => {
        appointment.fairness_priority = alpha;
        return saveAppointment(appointment);
      },
      onChoose: async (candidate, alpha) => {
        const ranked = rankCandidates([candidate], alpha)[0];
        Object.assign(appointment, {
          selected_area: { id: candidate.id, name: candidate.name, lat: candidate.lat, lng: candidate.lng },
          fairness_score: Number(ranked.fairness.toFixed(2)),
          average_travel_time: Math.round(ranked.stats.mean),
          travel_time_stddev: Math.round(ranked.stats.stddev),
          fairness_priority: alpha,
        });
        await saveAppointment(appointment);
        await logActivity('place', t.activity.placeChosen(candidate.name), `${group?.name ?? ''} · ${t.results.avg} ${appointment.average_travel_time} min`, `#/ontdek?afspraak=${appointment.id}`);
        showToast(t.results.saved(candidate.name));
        renderDiscover(container, _params, query);
      },
    },
  );
}

function optionLabel(a) {
  const d = new Date(a.datetime);
  return `${d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTime(d)}${a.selected_area ? ` · ${a.selected_area.name}` : ''}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
