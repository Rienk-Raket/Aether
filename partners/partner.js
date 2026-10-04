// Shared script of the fictional booking pages. Reads the reservation from the link, shows it,
// and sends the visitor back to the app when they confirm or cancel. Nothing is sent anywhere.

const query = new URLSearchParams(location.hash.slice(1));
const partner = document.body.dataset.partner;
const appointment = query.get('afspraak');
const reference = query.get('ref');
const start = new Date(query.get('start'));
const valid = Boolean(appointment && reference && query.get('plek') && !Number.isNaN(start.getTime()));

const set = (selector, text) => {
  document.querySelector(selector).textContent = text;
};

if (valid) {
  set('[data-venue]', query.get('plek'));
  set('[data-when]', start.toLocaleString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }));
  set('[data-persons]', query.get('n') ?? '1');
  set('[data-requests]', query.get('wens') || 'Geen');
  set('[data-ref]', reference);
} else {
  document.querySelector('[data-error]').hidden = false;
  document.querySelector('[data-confirm]').disabled = true;
}

// The app lives one folder up. The hash route is read by js/app.js.
const appUrl = (route, params) => `../index.html#${route}?${new URLSearchParams(params)}`;

document.querySelector('[data-confirm]').addEventListener('click', () => {
  location.href = appUrl('/bevestigd', { afspraak: appointment, partner, ref: reference, n: query.get('n') ?? '1', wens: query.get('wens') ?? '' });
});

document.querySelector('[data-cancel]').addEventListener('click', () => {
  location.href = appointment ? appUrl('/reserveren', { afspraak: appointment }) : '../index.html';
});
