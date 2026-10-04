// The card that opens when a venue is tapped on the map: name, picture, services, rating and
// average price range — with buttons for the details and for choosing the venue.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { venueArt } from './venue-art.js';
import { openSheet } from './modal.js';
import { showToast } from './toast.js';
import { openLabel, formatPriceRange, crowdLevel } from '../core/venues.js';
import { listProviders } from '../data/offer.js';
import { pickVenue } from '../data/venue-choice.js';

const SERVICE_ICONS = { breakfast: 'cafe', lunch: 'restaurant', dinner: 'restaurant', coffee: 'cafe', drinks: 'bar', stay: 'hotel', meeting: 'meeting_room', event: 'group' };

// providers: result of listProviders()
export function venueCardHtml(venue, { when, providers }) {
  const status = openLabel(venue, when);
  const routes = venue.booking_partners.map((id) => providers.find((p) => p.id === id)?.name).filter(Boolean);

  return `
    <article class="venue-card">
      ${venueArt(venue)}
      <div class="venue-card-body">
        <div class="eyebrow">${t.placeTypes[venue.type]} · ${esc(venue.cuisine)}</div>
        <h3 class="venue-card-title">${esc(venue.name)}</h3>

        <div class="chips">
          <span class="chip active" title="${t.venueCard.reviews(venue.review_count)}">★ ${venue.rating.toFixed(1)} (${venue.review_count})</span>
          <span class="chip" title="${t.venueCard.price}">${formatPriceRange(venue)}</span>
          <span class="chip level-${status.open ? 'good' : 'bad'}">${esc(status.text)}</span>
        </div>

        <div class="section-title">${t.venueCard.services}</div>
        <div class="chips">${venue.services.map((s) => `<span class="chip feature">${icon(SERVICE_ICONS[s])} ${t.serviceNames[s]}</span>`).join('')}</div>

        ${
          venue.diets.length
            ? `<div class="section-title">${t.venueCard.diets}</div>
               <div class="chips">${venue.diets.map((d) => `<span class="chip feature">${icon('leaf')} ${t.dietNames[d]}</span>`).join('')}</div>`
            : ''
        }

        <p class="muted small">
          ${t.venues.crowd[crowdLevel(venue, when)]} · ${t.venueCard.capacity(venue.capacity, venue.price_unit)}<br />
          ${t.venueCard.bookVia}: ${esc(routes.join(', '))}
        </p>
        <p class="muted small">${t.venueCard.fictional}</p>
      </div>
    </article>`;
}

// appointment: optional. Without it the card has no "choose" button. Resolves when closed.
export async function openVenueCard(venue, { when, appointment, onChosen }) {
  const providers = await listProviders();
  const chosen = appointment?.selected_poi?.id === venue.id;
  const href = `#/plek/${encodeURIComponent(venue.id)}${appointment ? `?afspraak=${appointment.id}` : ''}`;

  return openSheet({
    title: venue.name,
    body: `
      ${venueCardHtml(venue, { when, providers })}
      <div class="sheet-actions">
        <a class="btn" href="${href}" data-details>${t.venueCard.details}</a>
        ${
          appointment
            ? chosen
              ? `<span class="badge">${t.venueCard.chosen}</span>`
              : `<button type="button" class="btn btn-primary" data-choose>${icon('check')} ${t.venueCard.choose}</button>`
            : ''
        }
      </div>`,
    setup(el, close) {
      el.querySelector('[data-details]').addEventListener('click', () => close());
      el.querySelector('[data-choose]')?.addEventListener('click', async () => {
        await pickVenue(appointment, venue);
        showToast(t.venue.chosenToast(venue.name));
        close(true);
        onChosen?.();
      });
    },
  });
}
