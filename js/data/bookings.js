// A booking lives inside its appointment (appointment.booking). It is created when the visitor
// comes back from the fictional partner page.

import { saveAppointment } from './appointments.js';
import { logActivity } from './activity.js';
import { t } from '../i18n/nl.js';

// details: result of parseReturn() in core/booking.js. Saving the same reservation twice
// (for example after a reload) changes nothing and logs nothing.
export async function confirmBooking(appointment, details) {
  if (appointment.booking?.reference === details.reference) return appointment;

  appointment.booking = {
    partner: details.partner,
    reference: details.reference,
    persons: details.persons,
    requests: details.requests,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  };
  appointment.status = 'confirmed';
  await saveAppointment(appointment);
  await logActivity('place', t.bookingDone.activity(appointment.selected_poi?.name ?? ''), details.reference, `#/bevestigd?afspraak=${appointment.id}`);
  document.dispatchEvent(new CustomEvent('aether:data'));
  return appointment;
}
