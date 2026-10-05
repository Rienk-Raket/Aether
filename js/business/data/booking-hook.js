// When someone books this business's venue in the personal app, the booking shows up as a new
// request in the business portal (fictional: both sides live on the same device in the demo).

import { getState, update } from './store.js';
import { requestFromBooking } from './seed.js';

export function receiveBooking(appointment, groupName) {
  const state = getState();
  const reference = appointment?.booking?.reference;
  if (!state || !reference || appointment.selected_poi?.id !== state.venue_id) return;
  if (state.requests.some((r) => r.id === `req-${reference}`)) return;
  update((s) => s.requests.push(requestFromBooking(appointment, groupName ?? appointment.title ?? 'Groep', reference)));
}
