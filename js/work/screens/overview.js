// Werkomgeving → Overzicht: next appointment, suited places, work wishes, costs and expenses, as
// swipeable cards (switch off for the plain layout), like the business overview.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { loadingFor } from '../../ui/loading.js';
import { navigate } from '../../router.js';
import { swipeEnabled, setSwipeEnabled, swipeToggle, swipeCardsHtml, wireSwipeCards } from '../../ui/swipe-cards.js';
import { loadWork, hasWorkProfile, groupName, OfflineError } from '../data.js';
import { expenseRows } from '../../core/work-match.js';
import { nextAppointment } from '../../screens/home.js';
import { pageHead, venueRow, prefsSummary, euro, dateTime } from '../ui.js';

const W = t.work;
const KEY = 'aether.work.swipe';

export async function renderWork(container) {
  const stop = loadingFor(container, W.places.loading);
  let data;
  try {
    data = await loadWork();
  } catch (error) {
    stop();
    if (!(error instanceof OfflineError)) throw error;
    data = await loadWork({ withVenues: false });
  }
  stop();

  const { profile, work, appointments, places } = data;
  const cityOf = (v) => places.find((p) => p.id === v.area_id)?.name;
  const next = await nextAppointment();
  const rows = expenseRows(appointments);
  const month = new Date().toISOString().slice(0, 7);
  const monthRows = rows.filter((r) => r.date.startsWith(month));
  const travel = appointments.filter((a) => a.average_travel_time);
  const avgTravel = travel.length ? travel.reduce((s, a) => s + a.average_travel_time, 0) / travel.length : null;
  const ready = hasWorkProfile(profile);

  const nextBlock = `<h2>${W.cards.next}</h2>${next
    ? `<div class="work-next"><strong>${esc(dateTime(next.datetime))}</strong><span class="muted">${esc(await groupName(next))} · ${W.next.people(next.participants.length)}</span><span class="muted small">${esc(next.selected_poi?.name ?? W.next.noPlace)}</span></div><a class="btn btn-small btn-primary" href="#/ontdek?afspraak=${next.id}">${W.next.open}</a>`
    : `<p class="muted">${W.next.none}</p><a class="btn btn-small btn-primary" href="#/nieuw">${icon('plus')} ${W.next.create}</a>`}`;

  const placesBlock = `<h2>${W.cards.places}</h2>${ready
    ? data.recommendations.length
      ? `<div class="work-list">${data.recommendations.slice(0, 3).map((m) => venueRow(m, cityOf)).join('')}</div><a class="btn btn-small" href="#/werk/plekken">${W.actions.places}</a>`
      : `<p class="muted">${W.places.empty}</p><a class="btn btn-small" href="#/werk/plekken">${W.actions.places}</a>`
    : `<p class="muted">${W.noProfile}</p>`}`;

  const prefsBlock = `<h2>${W.cards.prefs}</h2>${prefsSummary(work)}<a class="btn btn-small" href="#/profiel/nieuw?opnieuw=1">${icon('sliders')} ${ready ? W.redo : W.setup}</a>`;

  const sum = (list) => list.reduce((s, r) => s + (r.cost ?? 0), 0);
  const costsBlock = `<h2>${W.cards.costs}</h2>${rows.length
    ? `<div class="biz-grid kpi-pair">
        <div class="card kpi"><div class="label">${W.costs.appointments} · ${W.costs.thisMonth}</div><div class="value">${monthRows.length}</div></div>
        <div class="card kpi"><div class="label">${W.costs.spend} · ${W.costs.thisMonth}</div><div class="value">${euro(sum(monthRows))}</div></div>
        <div class="card kpi"><div class="label">${W.costs.appointments} · ${W.costs.all}</div><div class="value">${rows.length}</div></div>
        <div class="card kpi"><div class="label">${W.costs.travel}</div><div class="value">${avgTravel ? W.costs.minutes(avgTravel) : '–'}</div></div></div>`
    : `<p class="muted">${W.costs.none}</p>`}`;

  const expensesBlock = `<h2>${W.cards.expenses}</h2>${rows.length
    ? `<div class="work-list">${rows.slice(0, 3).map((r) => `<div class="card-row biz-row"><div><strong>${esc(r.place)}</strong><br><small class="muted">${esc(dateTime(r.date))} · ${r.people} p.</small></div><span class="mono">${r.cost ? euro(r.cost) : '–'}</span></div>`).join('')}</div>`
    : `<p class="muted">${W.expenses.empty}</p>`}<a class="btn btn-small" href="#/werk/declaraties">${W.actions.expenses}</a>`;

  const actionsBlock = `<h2>${W.cards.actions}</h2><div class="work-actions">
      <a class="btn btn-primary" href="#/nieuw">${icon('plus')} ${W.actions.newAppointment}</a>
      <a class="btn" href="#/werk/plekken">${icon('meeting_room')} ${W.actions.places}</a>
      <button type="button" class="btn" data-open-map>${icon('pin')} ${W.actions.map}</button>
      <a class="btn" href="#/werk/declaraties">${icon('copy')} ${W.actions.expenses}</a></div>`;

  const cards = [
    { title: W.cards.next, html: nextBlock },
    { title: W.cards.places, html: placesBlock },
    { title: W.cards.prefs, html: prefsBlock },
    { title: W.cards.costs, html: costsBlock },
    { title: W.cards.expenses, html: expensesBlock },
    { title: W.cards.actions, html: actionsBlock },
  ];
  const swipe = swipeEnabled(KEY);
  const plain = `
      <div class="biz-grid cols-2"><div class="card">${nextBlock}</div><div class="card">${prefsBlock}</div></div>
      <div class="card">${placesBlock}</div>
      <div class="biz-grid cols-2"><div class="card">${costsBlock}</div><div class="card">${expensesBlock}</div></div>
      <div class="card">${actionsBlock}</div>`;

  container.innerHTML = `
    <section class="screen work">
      ${pageHead(W.greeting(profile.name.split(' ')[0]), W.sub, swipeToggle(swipe))}
      ${swipe ? swipeCardsHtml(cards) : plain}
    </section>`;

  if (swipe) wireSwipeCards(container.querySelector('.swipe'), cards.map((c) => c.title));
  container.querySelector('[data-swipe-toggle]').addEventListener('click', () => {
    setSwipeEnabled(!swipe, KEY);
    renderWork(container);
  });
  container.querySelector('[data-open-map]')?.addEventListener('click', async () => {
    const { openMapWithWork } = await import('../open-map.js');
    openMapWithWork(work);
    navigate('/kaart');
  });
}
