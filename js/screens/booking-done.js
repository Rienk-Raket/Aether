// Bevestigd: shown when the visitor comes back from a partner page (the booking is saved first),
// and when opening a saved booking. Add it to the calendar (.ics) or share it with the group.

import qrcode from '../../vendor/qrcode.js';
import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { plusBadge } from '../ui/plus-badge.js';
import { buildIcs } from '../core/ics.js';
import { parseReturn, shareText as buildShareText } from '../core/booking.js';
import { fitsInQr } from '../core/invite.js';
import { formatTime } from '../core/dates.js';
import { getAppointment } from '../data/appointments.js';
import { getGroup } from '../data/groups.js';
import { confirmBooking } from '../data/bookings.js';
import { listProviders } from '../data/offer.js';
import { shareText, copyText, downloadTextFile } from '../services/share.js';

export async function renderBookingDone(container, _params, query) {
  const providers = await listProviders();
  let appointment = await getAppointment(query.get('afspraak') ?? '');

  // Coming back from a partner page: read, check and save what it sent.
  if (query.get('partner')) {
    const details = parseReturn(query, providers.map((p) => p.id));
    if (!details || !appointment || details.appointmentId !== appointment.id) return message(container, t.bookingDone.invalid, '#/agenda');
    appointment = await confirmBooking(appointment, details);
    history.replaceState(null, '', `#/bevestigd?afspraak=${appointment.id}`); // a reload shows the saved booking
  }
  if (!appointment) return message(container, t.booking.noAppointment, '#/agenda');
  const { booking, selected_poi: venue } = appointment;
  if (!booking || !venue) return message(container, t.bookingDone.noBooking, `#/ontdek?afspraak=${appointment.id}`);

  const group = await getGroup(appointment.group_id);
  const partner = providers.find((p) => p.id === booking.partner);
  const start = new Date(appointment.datetime);
  const startText = `${start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} ${formatTime(start)}`;
  const groupName = group?.name ?? t.appointments.unknownGroup;
  const text = buildShareText({ groupName, venueName: venue.name, address: venue.address, startText, persons: booking.persons, partnerName: partner?.name ?? booking.partner, reference: booking.reference });
  const qr = fitsInQr(text) ? makeQr(text) : '';

  container.innerHTML = `
    <section class="screen wizard">
      <div class="eyebrow">${t.bookingDone.eyebrow}</div>
      <h1 class="section-gap">${t.bookingDone.title}</h1>

      <div class="card section-gap">
        <h2 class="card-title">${esc(venue.name)}</h2>
        <p>${esc(startText)}</p>
        <p class="muted small">${esc(venue.address)}</p>
        <div class="row"><span>${t.bookingDone.reference}</span><span class="mono">${esc(booking.reference)}</span></div>
        <div class="row"><span>${esc(partner?.name ?? booking.partner)}</span><span>${t.bookingDone.persons(booking.persons)}</span></div>
        <div class="row"><span>${t.bookingDone.requests}</span><span>${esc(booking.requests || t.bookingDone.none)}</span></div>
      </div>

      <div class="hero-buttons section-gap">
        <button type="button" class="btn btn-primary" data-ics>${icon('calendar')} ${t.bookingDone.addToCalendar}</button>
        <button type="button" class="btn" data-share>${icon('share')} ${t.bookingDone.share}</button>
        <button type="button" class="btn" data-copy>${icon('copy')} ${t.bookingDone.copy}</button>
      </div>

      ${
        qr
          ? `<div class="card section-gap">
              <div class="section-head"><h2 class="card-title">${t.bookingDone.qrTitle}</h2>${plusBadge()}</div>
              <div class="qr-box" role="img" aria-label="${t.bookingDone.qrAlt}">${qr}</div>
              <p class="muted small">${t.bookingDone.qrHint}</p>
            </div>`
          : ''
      }

      <div class="flow-actions"><a class="btn btn-large" href="#/overzicht">${t.bookingDone.toOverview}</a></div>
    </section>`;

  container.querySelector('[data-ics]').addEventListener('click', () => {
    const ics = buildIcs(
      {
        id: appointment.id,
        title: t.bookingDone.eventTitle(groupName, venue.name),
        start,
        durationMinutes: appointment.duration_minutes,
        location: `${venue.name}, ${venue.address}`,
        description: text,
      },
      [60, 1440],
    );
    downloadTextFile('aether-afspraak.ics', ics, 'text/calendar');
    showToast(t.bookingDone.calendarSaved);
  });

  container.querySelector('[data-share]').addEventListener('click', async () => {
    const result = await shareText(t.bookingDone.shareTitle, text);
    if (result === 'copied') showToast(t.bookingDone.copied);
    if (result === 'failed') showToast(t.bookingDone.copyFailed);
  });

  container.querySelector('[data-copy]').addEventListener('click', async () => {
    showToast((await copyText(text)) === 'copied' ? t.bookingDone.copied : t.bookingDone.copyFailed);
  });
}

function makeQr(text) {
  const qr = qrcode(0, 'L');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function message(container, text, href) {
  container.innerHTML = `
    <section class="screen">
      <a class="back-link" href="${href}">${icon('back')} ${t.booking.back}</a>
      <div class="card empty-state">${icon('pin')}<h1>${text}</h1></div>
    </section>`;
}
