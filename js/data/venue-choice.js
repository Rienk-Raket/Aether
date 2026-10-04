// Choosing a venue for an appointment. Used by the venue card and the venue detail screen.

import { saveAppointment } from './appointments.js';
import { logActivity } from './activity.js';
import { t } from '../i18n/nl.js';

// Stores the chosen venue in the appointment, logs it, and tells open screens.
export async function pickVenue(appointment, venue) {
  appointment.selected_poi = {
    id: venue.id,
    name: venue.name,
    type: venue.type,
    address: venue.address,
    lat: venue.lat,
    lng: venue.lng,
    price_level: venue.price_level,
    price_range: venue.price_range,
    price_unit: venue.price_unit,
    rating: venue.rating,
    booking_partners: venue.booking_partners,
  };
  await saveAppointment(appointment);
  await logActivity('place', t.activity.venueChosen(venue.name), appointment.selected_area?.name ?? '', `#/plek/${venue.id}?afspraak=${appointment.id}`);
  document.dispatchEvent(new CustomEvent('aether:data'));
}
