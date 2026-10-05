// Zakelijk → Mijn zaak: edit what groups see. Saved edits are merged into the venue list of
// "Ontdek plekken" (see applyOverrides in data/store.js). Reistijd and fairness stay calculated.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { showToast } from '../../ui/toast.js';
import { venueCardHtml } from '../../ui/venue-card.js';
import { listProviders } from '../../data/offer.js';
import { loadingFor } from '../../ui/loading.js';
import { getVenue, saveVenueProfile, OfflineError } from '../services/business-api.js';
import { update } from '../data/store.js';
import { guard, noRight } from './guard.js';
import { can, limit } from '../core/entitlements.js';
import { pageHead } from '../ui/widgets.js';

const b = t.business;
const AMENITIES = ['vegetarian', 'accessible', 'quiet', 'terrace', 'kid_friendly', 'dog_friendly', 'parking', 'charger'];
const toTime = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMinutes = (text, wrap) => {
  const [h, m] = text.split(':').map(Number);
  const minutes = h * 60 + m;
  return wrap ? minutes + 1440 : minutes;
};
// Monday first on screen; venue.hours is indexed by getDay() (Sunday = 0).
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0];

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  if (!ctx.can('profile')) {
    container.innerHTML = noRight();
    return;
  }
  const stop = loadingFor(container, b.loading);
  const [venue, providers] = await Promise.all([getVenue(), listProviders()]);
  stop();

  const canRequests = can(ctx.sub, 'requests');
  const accept = ctx.state.accepts_requests ?? canRequests;
  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.venue.eyebrow, b.venue.title, b.venue.sub, `<button class="btn btn-primary" type="submit" form="venue-form" data-save>${b.venue.save}</button>`)}
      ${ctx.banner}
      <form id="venue-form" class="biz-grid cols-2" novalidate>
        <div class="biz-stack">
          <div class="card"><h2>${b.venue.basics}</h2><div class="biz-grid cols-2e biz-form">
            ${field('name', b.venue.name, venue.name)}${field('cuisine', b.venue.cuisine, venue.cuisine)}
            ${field('address', b.venue.address, venue.address)}${field('capacity', b.venue.capacity, venue.capacity, 'number')}
            ${field('low', b.venue.priceFrom, venue.price_range[0], 'number')}${field('high', b.venue.priceTo, venue.price_range[1], 'number')}
          </div></div>
          <div class="card"><h2>${b.venue.servicesTitle}</h2><div class="chips">
            ${AMENITIES.map((a) => `<label class="chip-label"><input type="checkbox" name="amenity" value="${a}" ${isOn(venue, a) ? 'checked' : ''}/><span>${b.venue.amenities[a]}</span></label>`).join('')}
          </div></div>
          <div class="card"><h2>${b.venue.hoursTitle}</h2><div class="hours">${DAY_INDEX.map((d, i) => hoursRow(venue.hours[d], i)).join('')}</div></div>
          <div class="card"><h2>${b.venue.bookingTitle}</h2>
            <label class="toggle-row"><span>${b.venue.acceptRequests}</span><span class="toggle"><input type="checkbox" name="accept" ${accept && canRequests ? 'checked' : ''} ${canRequests ? '' : 'disabled'} /><span class="toggle-track"></span></span></label>
            <p class="muted small">${canRequests ? b.venue.requestsHint(limit(ctx.sub, 'requests')) : b.venue.requestsLocked}</p></div>
        </div>
        <aside class="card sticky"><p class="eyebrow">${b.venue.previewTitle}</p><div data-preview></div><p class="muted small">${b.venue.previewNote}</p>
          <a class="btn btn-small" href="#/ontdek">${b.venue.openInDiscover}</a></aside>
      </form>
    </section>`;

  const form = container.querySelector('#venue-form');
  const read = () => {
    const get = (n) => form.elements[n].value.trim();
    const hours = [...venue.hours];
    DAY_INDEX.forEach((d, i) => {
      if (form.elements[`closed${i}`].checked) hours[d] = null;
      else {
        const from = form.elements[`from${i}`].value;
        const to = form.elements[`to${i}`].value;
        hours[d] = from && to ? [toMinutes(from), toMinutes(to, toMinutes(to) <= toMinutes(from))] : null;
      }
    });
    const amenities = new Set([...form.querySelectorAll('[name="amenity"]:checked')].map((el) => el.value));
    const fields = {
      name: get('name'), cuisine: get('cuisine'), address: get('address'), capacity: Number(get('capacity')),
      price_range: [Number(get('low')), Number(get('high'))], hours,
      ...Object.fromEntries(AMENITIES.map((a) => [a, amenities.has(a)])),
    };
    fields.diets = amenities.has('vegetarian') ? [...new Set([...venue.diets, 'vegetarian'])] : venue.diets.filter((d) => d !== 'vegetarian');
    return fields;
  };
  const valid = (f) => f.name && f.address && f.cuisine && f.capacity > 0 && f.price_range[0] >= 0 && f.price_range[1] >= f.price_range[0];
  const preview = () => {
    container.querySelector('[data-preview]').innerHTML = venueCardHtml({ ...venue, ...read() }, { when: new Date(), providers });
  };
  form.addEventListener('input', preview);
  form.addEventListener('change', (event) => {
    if (event.target.name?.startsWith('closed')) form.elements[`from${event.target.name.slice(6)}`].disabled = form.elements[`to${event.target.name.slice(6)}`].disabled = event.target.checked;
    preview();
  });
  preview();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = read();
    if (!valid(fields)) {
      showToast(b.venue.invalid);
      return;
    }
    const button = container.querySelector('[data-save]');
    button.disabled = true;
    button.textContent = b.venue.saving;
    try {
      await saveVenueProfile(fields);
      update((s) => {
        s.accepts_requests = form.elements.accept.checked;
      });
      showToast(b.venue.saved);
    } catch (error) {
      if (!(error instanceof OfflineError)) throw error;
      showToast(b.offlineAction);
    } finally {
      button.disabled = false;
      button.textContent = b.venue.save;
    }
  });
}

const isOn = (venue, a) => (a === 'vegetarian' ? venue.vegetarian || venue.diets.includes('vegetarian') : Boolean(venue[a]));

function field(name, label, value, type = 'text') {
  return `<label class="field"><span class="field-label">${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${type === 'number' ? 'min="0"' : ''} /></label>`;
}

function hoursRow(range, i) {
  const closed = !range;
  return `<div class="hours-row"><span>${b.venue.days[i]}</span>
    <input type="time" name="from${i}" value="${closed ? '' : toTime(range[0])}" ${closed ? 'disabled' : ''} aria-label="${b.venue.from} ${b.venue.days[i]}" />
    <input type="time" name="to${i}" value="${closed ? '' : toTime(range[1])}" ${closed ? 'disabled' : ''} aria-label="${b.venue.to} ${b.venue.days[i]}" />
    <label class="chip-label"><input type="checkbox" name="closed${i}" ${closed ? 'checked' : ''} /><span>${b.venue.closed}</span></label></div>`;
}
