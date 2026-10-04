// Reserveren: choose the number of people, special requests and the booking route, then continue
// to the (fictional) booking site of that partner. The booking is saved when the visitor returns.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { formatTime } from '../core/dates.js';
import { cancelPolicy, partnerUrl, clampPersons, MIN_PERSONS, MAX_PERSONS, MAX_REQUEST_LENGTH } from '../core/booking.js';
import { providerOn } from '../core/offer.js';
import { getAppointment } from '../data/appointments.js';
import { getPrefs, listProviders } from '../data/offer.js';

export async function renderBooking(container, _params, query) {
  const appointment = await getAppointment(query.get('afspraak') ?? '');
  if (!appointment) return message(container, t.booking.noAppointment, '#/agenda');

  const venue = appointment.selected_poi;
  const back = `#/ontdek?afspraak=${appointment.id}`;
  if (!venue) return message(container, t.booking.noVenue, back);

  const providers = await listProviders();
  const prefs = getPrefs();
  const routes = venue.booking_partners.filter((id) => providerOn(prefs, id)).map((id) => providers.find((p) => p.id === id)).filter(Boolean);
  const start = new Date(appointment.datetime);
  const when = `${start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} · ${formatTime(start)}`;
  const persons = clampPersons(appointment.booking?.persons ?? appointment.participants.length);

  container.innerHTML = `
    <section class="screen wizard">
      <a class="back-link" href="${back}">${icon('back')} ${t.booking.back}</a>
      <div class="eyebrow">${t.booking.eyebrow}</div>
      <h1 class="section-gap">${t.booking.title}</h1>
      <p class="sub">${esc(t.booking.summary(venue.name, when))}</p>
      ${appointment.booking ? `<p class="notice">${t.booking.alreadyBooked(esc(appointment.booking.reference))} <a class="link-btn" href="#/bevestigd?afspraak=${appointment.id}">${t.booking.viewBooking}</a></p>` : ''}

      <form class="card form section-gap" data-form novalidate>
        <label class="field">
          <span class="field-label">${t.booking.persons} <output class="mono" data-persons-out>${persons}</output></span>
          <input type="range" name="persons" min="${MIN_PERSONS}" max="${MAX_PERSONS}" step="1" value="${persons}" />
          <span class="field-hint">${t.booking.personsHint}</span>
        </label>
        <label class="field">
          <span class="field-label">${t.booking.requests}</span>
          <textarea name="requests" rows="3" maxlength="${MAX_REQUEST_LENGTH}" placeholder="${t.booking.requestsPlaceholder}">${esc(appointment.booking?.requests ?? '')}</textarea>
        </label>
        ${routes.length ? routeChoice(routes, appointment.booking?.partner) : `<p class="notice">${t.booking.noRoutes}</p>`}
        <p class="field-hint" data-policy></p>
        <p class="field-hint">${icon('calendar')} ${t.booking.reminderHint}</p>
      </form>

      <p class="muted small">${t.booking.fictional}</p>
      <div class="flow-actions">
        <button type="button" class="btn btn-primary btn-large" data-next ${routes.length ? '' : 'disabled'}>${icon('external')} ${t.booking.next}</button>
      </div>
    </section>`;

  const form = container.querySelector('[data-form]');
  form.addEventListener('submit', (event) => event.preventDefault());
  const chosenRoute = () => form.elements.route?.value;

  const refresh = () => {
    container.querySelector('[data-persons-out]').textContent = form.elements.persons.value;
    const route = chosenRoute();
    container.querySelector('[data-policy]').textContent = route ? `${t.booking.cancelPolicy}: ${t.booking.policies[cancelPolicy(route)]}` : '';
  };
  form.addEventListener('input', refresh);
  refresh();

  container.querySelector('[data-next]').addEventListener('click', () => {
    location.href = partnerUrl(chosenRoute(), {
      appointmentId: appointment.id,
      venueName: venue.name,
      startIso: appointment.datetime,
      persons: form.elements.persons.value,
      requests: form.elements.requests.value.trim(),
    });
  });
}

function routeChoice(routes, selected) {
  const checked = routes.some((r) => r.id === selected) ? selected : routes[0].id;
  return `
    <fieldset class="field">
      <legend class="field-label">${t.booking.via}</legend>
      <div class="rule-list" role="radiogroup">
        ${routes
          .map(
            (r) => `
          <label class="rule-option">
            <input type="radio" name="route" value="${r.id}" ${r.id === checked ? 'checked' : ''} />
            <span><strong>${esc(r.name)}</strong><small>${esc(r.description)}</small></span>
          </label>`,
          )
          .join('')}
      </div>
      <p class="field-hint">${t.booking.viaHint}</p>
    </fieldset>`;
}

function message(container, text, href) {
  container.innerHTML = `
    <section class="screen">
      <a class="back-link" href="${href}">${icon('back')} ${t.booking.back}</a>
      <div class="card empty-state">${icon('pin')}<h1>${text}</h1></div>
    </section>`;
}
