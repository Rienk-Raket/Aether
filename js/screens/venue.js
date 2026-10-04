// Detail of one venue: photos, rating, opening hours, features, crowd forecast and the travel
// time of every participant. From here the group can pick this venue for the appointment.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, initials, hueFor } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { loadingFor } from '../ui/loading.js';
import { sourceBadge, offlineNotice } from '../ui/source-badge.js';
import { navigate } from '../router.js';
import { getVenue, OfflineError, PROVIDER_NAME as PLACES_NAME } from '../services/places.js';
import { travelTimesTo, PROVIDER_NAME as ROUTING_NAME } from '../services/routing.js';
import { openLabel, formatHours, crowdLevel, formatPriceRange } from '../core/venues.js';
import { travelStats, fairnessScore } from '../core/fairness.js';
import { personLevel, fairnessLevel } from '../core/levels.js';
import { formatTime } from '../core/dates.js';
import { getAppointment } from '../data/appointments.js';
import { pickVenue } from '../data/venue-choice.js';
import { listProviders } from '../data/offer.js';
import { venueArt } from '../ui/venue-art.js';
import { transportIcon } from '../ui/transport.js';
import { loadParticipants } from './results-data.js';

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

export async function renderVenue(container, { id }, query) {
  const appointmentId = query.get('afspraak');
  const stopLoading = loadingFor(container, t.loading.venue);

  let found;
  try {
    found = await getVenue(id);
  } catch (error) {
    stopLoading();
    if (!(error instanceof OfflineError)) console.error(error);
    container.innerHTML = notFound(appointmentId, t.offline.noVenues);
    return;
  }
  stopLoading();
  const { venue, source } = found;
  if (!venue) {
    container.innerHTML = notFound(appointmentId, t.common.notFound);
    return;
  }

  const appointment = appointmentId ? await getAppointment(appointmentId) : null;
  const when = appointment ? new Date(appointment.datetime) : new Date();
  const backHref = appointment ? `#/ontdek?afspraak=${appointment.id}` : '#/ontdek';

  let travel = null;
  let participants = [];
  if (appointment) {
    ({ participants } = await loadParticipants(appointment));
    if (participants.length) {
      travel = await travelTimesTo(participants.map((p) => ({ location: p.location, mode: p.mode })), venue, when);
    }
  }

  const providers = await listProviders();
  const status = openLabel(venue, when);
  const crowd = crowdLevel(venue, when);
  const chosen = appointment?.selected_poi?.id === venue.id;

  container.innerHTML = `
    <section class="screen">
      <a class="back-link" href="${backHref}">${icon('back')} ${t.venue.back}</a>

      <div class="dashboard">
        <div>
          <div class="card">
            ${venueArt(venue)}
            <div class="eyebrow section-gap">${t.placeTypes[venue.type]} · ${esc(venue.cuisine)}</div>
            <h1 class="section-gap">${esc(venue.name)}</h1>
            <div class="chips section-gap">
              <span class="chip active">★ ${venue.rating.toFixed(1)} (${venue.review_count})</span>
              <span class="chip">${formatPriceRange(venue)}</span>
              <span class="chip level-${status.open ? 'good' : 'bad'}">${esc(status.text)}</span>
            </div>
            ${status.open ? '' : `<p class="notice" role="status">${t.venues.closedWarning(formatTime(when))}</p>`}
            ${offlineNotice(source)}
            <p class="section-gap">${esc(venue.address)}
              <a class="link-btn" href="https://www.openstreetmap.org/?mlat=${venue.lat}&amp;mlon=${venue.lng}#map=17/${venue.lat}/${venue.lng}" target="_blank" rel="noopener noreferrer">${t.venue.openMap} ${icon('external')}</a>
            </p>
            <p class="muted small section-gap">${sourceBadge(source, PLACES_NAME)} ${t.venueCard.fictional}</p>
          </div>

          <div class="card">
            <h2>${t.venueCard.services}</h2>
            <div class="chips section-gap">${venue.services.map((s) => `<span class="chip feature">${t.serviceNames[s]}</span>`).join('')}</div>
            ${venue.diets.length ? `<div class="section-title section-gap">${t.venueCard.diets}</div><div class="chips">${venue.diets.map((d) => `<span class="chip feature">${icon('leaf')} ${t.dietNames[d]}</span>`).join('')}</div>` : ''}
            <div class="section-title section-gap">${t.venue.features}</div>
            <div class="chips">${features(venue)}</div>
            <p class="muted small section-gap">${t.venueCard.capacity(venue.capacity, venue.price_unit)} · ${t.venueCard.bookVia}: ${esc(venue.booking_partners.map((id) => providers.find((p) => p.id === id)?.name).filter(Boolean).join(', '))}</p>
            <p class="section-gap"><span class="level-${crowd === 'low' ? 'good' : crowd === 'medium' ? 'medium' : 'bad'}">${t.venues.crowd[crowd]}</span>
              <span class="muted small"> ${t.venue.crowdAt(formatTime(when))}</span></p>
          </div>
        </div>

        <div>
          ${travel ? travelCard(participants, travel) : ''}
          <div class="card">
            <h2>${t.venue.hours}</h2>
            <div class="section-gap">${hoursTable(venue, when)}</div>
          </div>
          ${actions(appointment, chosen)}
        </div>
      </div>
    </section>`;

  container.querySelector('[data-choose-venue]')?.addEventListener('click', async () => {
    await pickVenue(appointment, venue);
    showToast(t.venue.chosenToast(venue.name));
    navigate(`/ontdek?afspraak=${appointment.id}`);
  });
}

function notFound(appointmentId, message) {
  return `
    <section class="screen">
      <a class="back-link" href="${appointmentId ? `#/ontdek?afspraak=${appointmentId}` : '#/ontdek'}">${icon('back')} ${t.venue.back}</a>
      <div class="card empty-state">${icon('pin')}<h2>${message}</h2></div>
    </section>`;
}

function features(venue) {
  const list = [
    venue.accessible && [t.venues.switches.accessible, 'wheelchair'],
    venue.quiet && [t.venues.switches.quiet, 'quiet'],
    venue.vegetarian && [t.venues.switches.vegetarian, 'leaf'],
  ].filter(Boolean);
  if (!list.length) return `<span class="muted">${t.venue.noFeatures}</span>`;
  return list.map(([label, name]) => `<span class="chip feature">${icon(name)} ${label}</span>`).join('');
}

function hoursTable(venue, when) {
  return WEEK.map((day) => {
    const name = new Date(2026, 9, 4 + day).toLocaleDateString('nl-NL', { weekday: 'long' });
    return `<div class="row ${day === when.getDay() ? 'today-row' : ''}">
      <span>${name[0].toUpperCase()}${name.slice(1)}</span>
      <span class="mono ${venue.hours[day] ? '' : 'muted'}">${formatHours(venue.hours[day])}</span>
    </div>`;
  }).join('');
}

function travelCard(participants, travel) {
  const stats = travelStats(travel.times);
  const fairness = fairnessScore(stats);
  const rows = participants.map((p, i) => `
    <div class="list-row">
      <span class="mini-avatar" style="--hue:${hueFor(p.id)}">${esc(initials(p.name))}</span>
      <span class="grow">${esc(p.name)}</span>
      <span class="transport-icon">${transportIcon(p.mode)}</span>
      <strong class="mono level-${personLevel(travel.times[i], stats.mean)}">${Math.round(travel.times[i])} min</strong>
    </div>`).join('');

  return `
    <div class="card">
      <div class="section-head"><h2>${t.venue.travel}</h2>${sourceBadge(travel.source, ROUTING_NAME)}</div>
      ${offlineNotice(travel.source)}
      ${rows}
      <div class="stats">
        <div class="stat"><strong>${Math.round(stats.mean)} min</strong><span>${t.results.statAvg}</span></div>
        <div class="stat"><strong>${Math.round(stats.stddev)} min</strong><span>${t.results.statSpread}</span></div>
        <div class="stat"><strong class="level-${fairnessLevel(fairness)}">${Math.round(fairness * 100)}</strong><span>${t.results.fairnessWord}</span></div>
      </div>
    </div>`;
}

function actions(appointment, chosen) {
  if (!appointment) return '';
  return `
    <div class="card">
      ${
        chosen
          ? `<p><span class="badge">${t.results.chosen}</span> ${t.venue.alreadyChosen}</p>`
          : `<button type="button" class="btn btn-primary btn-block btn-large" data-choose-venue>${icon('check')} ${t.venue.choose}</button>`
      }
      ${chosen ? `<a class="btn btn-primary btn-block btn-large section-gap" href="#/${appointment.booking ? 'bevestigd' : 'reserveren'}?afspraak=${appointment.id}">${icon('calendar')} ${appointment.booking ? t.booking.viewBooking : t.booking.reserve}</a>` : ''}
    </div>`;
}
