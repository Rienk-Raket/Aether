// Service worker: stores the app files on the device so Aether works offline.
// APP_SHELL and CACHE_VERSION are generated: run `npm run sw` after adding files or bumping the version.

const CACHE_VERSION = 'aether-v0.8.0';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/collab.css',
  './css/components.css',
  './css/fonts.css',
  './css/forms.css',
  './css/offer.css',
  './css/profile.css',
  './css/results.css',
  './css/splash.css',
  './css/tokens.css',
  './css/venues.css',
  './css/widgets.css',
  './js/app.js',
  './js/core/booking.js',
  './js/core/candidates.js',
  './js/core/co2.js',
  './js/core/dates.js',
  './js/core/fairness.js',
  './js/core/geo.js',
  './js/core/group-warnings.js',
  './js/core/hash.js',
  './js/core/ics.js',
  './js/core/invite.js',
  './js/core/levels.js',
  './js/core/offer.js',
  './js/core/poll.js',
  './js/core/pref-match.js',
  './js/core/profile-model.js',
  './js/core/projection.js',
  './js/core/requirements.js',
  './js/core/selection.js',
  './js/core/slots.js',
  './js/core/traffic.js',
  './js/core/travel-estimate.js',
  './js/core/venues.js',
  './js/data/activity.js',
  './js/data/appointments.js',
  './js/data/cache.js',
  './js/data/db.js',
  './js/data/demo-seed.js',
  './js/data/groups.js',
  './js/data/offer.js',
  './js/data/people.js',
  './js/data/polls.js',
  './js/data/profiles.js',
  './js/data/settings.js',
  './js/data/slot-travelers.js',
  './js/data/venue-choice.js',
  './js/i18n/nl-collab.js',
  './js/i18n/nl-offer.js',
  './js/i18n/nl-profile.js',
  './js/i18n/nl-services.js',
  './js/i18n/nl.js',
  './js/router.js',
  './js/screens/activity.js',
  './js/screens/agenda.js',
  './js/screens/discover.js',
  './js/screens/group-detail.js',
  './js/screens/groups.js',
  './js/screens/home.js',
  './js/screens/invite-import.js',
  './js/screens/new/flow.js',
  './js/screens/new/step-group.js',
  './js/screens/new/step-prefs.js',
  './js/screens/new/step-when.js',
  './js/screens/new/step-where.js',
  './js/screens/offer.js',
  './js/screens/profile-dining.js',
  './js/screens/profile-locations.js',
  './js/screens/profile-travel.js',
  './js/screens/profile-vehicles.js',
  './js/screens/profile.js',
  './js/screens/results-data.js',
  './js/screens/settings-connections.js',
  './js/screens/settings.js',
  './js/screens/start-menu.js',
  './js/screens/venue.js',
  './js/screens/welcome.js',
  './js/services/connectivity.js',
  './js/services/geocode.js',
  './js/services/mock/geocode-mock.js',
  './js/services/mock/network.js',
  './js/services/mock/plekwijzer-mock.js',
  './js/services/mock/routara-mock.js',
  './js/services/places.js',
  './js/services/routing.js',
  './js/services/simulation.js',
  './js/ui/address-picker.js',
  './js/ui/appointment-card.js',
  './js/ui/datepicker.js',
  './js/ui/demo.js',
  './js/ui/dom.js',
  './js/ui/fairness-panel.js',
  './js/ui/fairness-slider.js',
  './js/ui/form-bits.js',
  './js/ui/group-form.js',
  './js/ui/icons.js',
  './js/ui/invite-sheet.js',
  './js/ui/loading.js',
  './js/ui/location-form.js',
  './js/ui/map2d.js',
  './js/ui/modal.js',
  './js/ui/name-form.js',
  './js/ui/poll-sheet.js',
  './js/ui/requirements-summary.js',
  './js/ui/shell.js',
  './js/ui/slot-hints.js',
  './js/ui/source-badge.js',
  './js/ui/splash.js',
  './js/ui/toast.js',
  './js/ui/transport.js',
  './js/ui/venue-art.js',
  './js/ui/venue-card.js',
  './js/ui/venue-map.js',
  './js/ui/venue-section.js',
  './js/version.js',
  './assets/fonts/dmsans-latin.woff2',
  './assets/fonts/spacegrotesk-latin.woff2',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './data/addresses.json',
  './data/nl-places.json',
  './data/providers.json',
  './data/venues.json',
  './vendor/idb.js',
  './vendor/qrcode.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

// Remove caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// The page asks us to activate right away after the user clicks "Herladen".
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// How long we wait for the network before falling back to the saved copy (slow connections).
const NETWORK_TIMEOUT_MS = 4000;

// Network first, saved copy as backup. This keeps all files of one version together: with
// "saved copy first", an old app.js could end up next to a new index.html and crash.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function savedCopy(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  // A page that is not saved (for example "#/..." variants): show the app shell.
  return request.mode === 'navigate' ? caches.match('./index.html') : undefined;
}

function networkFirst(request) {
  // "no-cache" = always check with the server whether the file changed (cheap if it did not).
  const options = request.mode === 'navigate' ? undefined : { cache: 'no-cache' };
  const fresh = fetch(request, options).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  });

  const slow = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS)).then(async () => (await savedCopy(request)) ?? fresh);

  return Promise.race([fresh, slow]).catch(async () => (await savedCopy(request)) ?? Response.error());
}
