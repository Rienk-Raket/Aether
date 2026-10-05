// Overzicht: the next appointment as a hero, the group's status, a live fairness map and the top places.

import { businessPromoHtml } from '../business/ui/promo.js';
import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { createFairnessPanel } from '../ui/fairness-panel.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { loadingFor } from '../ui/loading.js';
import { openPollSheet } from '../ui/poll-sheet.js';
import { sourceBadge, offlineNotice } from '../ui/source-badge.js';
import { PROVIDER_NAME as ROUTING_NAME } from '../services/routing.js';
import { formatTime } from '../core/dates.js';
import { listAppointments, saveAppointment } from '../data/appointments.js';
import { listGroups } from '../data/groups.js';
import { getPerson, ensureSelf } from '../data/people.js';
import { loadResults } from './results-data.js';

export async function nextAppointment() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (await listAppointments()).find((a) => new Date(a.datetime) >= today) ?? null;
}

export async function renderHome(container) {
  const next = await nextAppointment();
  const stopLoading = loadingFor(container, t.loading.routes);
  let data;
  try {
    data = next && (await loadResults(next.id));
  } finally {
    stopLoading();
  }
  if (!data || !data.candidates.length) return renderEmpty(container, Boolean(next));

  const { appointment, group, participants } = data;
  const self = await ensureSelf();
  const people = (await Promise.all(group.members.map((m) => getPerson(m.user_id)))).filter(Boolean);
  const located = people.filter((p) => p.locations.length).length;
  const pct = people.length ? Math.round((located / people.length) * 100) : 0;
  const start = new Date(appointment.datetime);
  const weekday = start.toLocaleDateString('nl-NL', { weekday: 'long' });

  container.innerHTML = `
    <section class="screen">
      <div class="hero">
        <div class="card hero-card">
          <div class="eyebrow">${t.home.next}</div>
          <h1>${t.home.headline}</h1>
          <p class="sub">${t.home.sub}</p>
          <div class="chips">
            <span class="chip active">${t.home.participants(participants.length)}</span>
            <span class="chip">${esc(weekday[0].toUpperCase() + weekday.slice(1))} ${formatTime(start)}</span>
            <span class="chip">${esc(appointment.selected_poi?.name ?? appointment.selected_area?.name ?? t.appointments.noPlaceYet)}</span>
          </div>
          <div class="hero-buttons">
            <a class="btn btn-primary" href="#/ontdek?afspraak=${appointment.id}">${t.home.viewPlaces} ${icon('chevron')}</a>
            <a class="btn" href="#/groepen/${group.id}">${t.home.openGroup}</a>
          </div>
        </div>
        <div class="card pulse-card">
          <div>
            <div class="eyebrow">${t.home.groupStatus}</div>
            <h2 class="section-gap">${esc(group.name)}</h2>
            <p class="muted small">${t.home.locationsOf(located, people.length)}</p>
          </div>
          <div>
            <div class="metric"><strong>${pct}%</strong><small>${t.home.complete}</small></div>
            <div class="meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
            <p class="muted small">${pct === 100 ? t.home.allReady : t.home.addMissing}</p>
          </div>
        </div>
      </div>

      ${offlineNotice(data.source)}
      <div class="dashboard">
        <div class="card">
          <div class="section-head">
            <div>
              <h2>${t.home.mapTitle}</h2>
              <p class="muted small">${esc(group.name)} · ${esc(start.toLocaleDateString('nl-NL', { weekday: 'long' }))} ${sourceBadge(data.source, ROUTING_NAME)}</p>
            </div>
            <a class="btn btn-small" href="#/ontdek?afspraak=${appointment.id}">${t.home.fullScreen}</a>
          </div>
          <div data-map></div>
          <div data-slider></div>
          <div class="stats" data-stats></div>
        </div>
        <div class="card">
          <div class="section-head">
            <div>
              <h2>${t.home.topPlaces}</h2>
              <p class="muted small">${t.home.rankedBy}</p>
            </div>
          </div>
          <div class="place-list" data-list></div>
          <button type="button" class="btn btn-primary btn-block section-gap" data-vote>${icon('vote')} ${t.poll.button}</button>
          <a class="btn btn-block section-gap" href="#/ontdek?afspraak=${appointment.id}">${t.home.allPlaces} ${icon('chevron')}</a>
        </div>
      </div>
      ${businessPromoHtml()}
    </section>`;

  const currentAlpha = () => appointment.fairness_priority ?? self.preferences.fairness_priority;
  container.querySelector('[data-vote]').addEventListener('click', async () => {
    await openPollSheet(data, { alpha: currentAlpha(), selfId: self.id });
    renderHome(container); // the vote may have chosen an area
  });

  createFairnessPanel(
    data,
    {
      map: container.querySelector('[data-map]'),
      slider: container.querySelector('[data-slider]'),
      stats: container.querySelector('[data-stats]'),
      list: container.querySelector('[data-list]'),
    },
    {
      alpha: appointment.fairness_priority ?? self.preferences.fairness_priority,
      topN: 3,
      detail: false,
      onAlpha: (alpha) => {
        appointment.fairness_priority = alpha; // shared with Ontdek plekken
        return saveAppointment(appointment);
      },
    },
  );
}

async function renderEmpty(container, brokenAppointment) {
  const groups = await listGroups();
  container.innerHTML = `
    <section class="screen">
      <div class="hero">
        <div class="card hero-card">
          <div class="eyebrow">${t.home.start}</div>
          <h1>${t.home.headline}</h1>
          <p class="sub">${brokenAppointment ? t.home.brokenAppointment : t.home.sub}</p>
          <div class="hero-buttons">
            <a class="btn btn-primary" href="#/nieuw">${icon('plus')} ${t.shell.newAppointment}</a>
            ${groups.length ? '' : demoButtonHtml()}
          </div>
        </div>
        <div class="card">
          <div class="eyebrow">${t.home.howItWorks}</div>
          <ol class="steps">${t.home.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        </div>
      </div>
      ${businessPromoHtml()}
    </section>`;
  wireDemoButtons(container, () => renderHome(container));
}
