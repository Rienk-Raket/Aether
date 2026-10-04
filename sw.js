// Service worker: stores the app files on the device so Aether works offline.
// APP_SHELL and CACHE_VERSION are generated: run `npm run sw` after adding files or bumping the version.

const CACHE_VERSION = 'aether-v0.3.0';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/components.css',
  './css/fonts.css',
  './css/forms.css',
  './css/tokens.css',
  './css/widgets.css',
  './js/app.js',
  './js/core/dates.js',
  './js/core/fairness.js',
  './js/core/geo.js',
  './js/core/group-warnings.js',
  './js/core/travel-estimate.js',
  './js/data/appointments.js',
  './js/data/db.js',
  './js/data/demo-seed.js',
  './js/data/groups.js',
  './js/data/people.js',
  './js/i18n/nl.js',
  './js/router.js',
  './js/screens/appointments.js',
  './js/screens/group-detail.js',
  './js/screens/groups.js',
  './js/screens/new/flow.js',
  './js/screens/new/step-group.js',
  './js/screens/new/step-when.js',
  './js/screens/new/step-where.js',
  './js/screens/profile-locations.js',
  './js/screens/profile-preferences.js',
  './js/screens/profile.js',
  './js/services/geocode.js',
  './js/services/mock/geocode-mock.js',
  './js/services/mock/network.js',
  './js/ui/address-picker.js',
  './js/ui/datepicker.js',
  './js/ui/demo.js',
  './js/ui/dom.js',
  './js/ui/group-form.js',
  './js/ui/icons.js',
  './js/ui/location-form.js',
  './js/ui/modal.js',
  './js/ui/nav.js',
  './js/ui/toast.js',
  './js/ui/transport.js',
  './js/version.js',
  './assets/fonts/inter-latin.woff2',
  './assets/fonts/rajdhani-600-latin.woff2',
  './assets/fonts/rajdhani-700-latin.woff2',
  './assets/fonts/spacemono-400-latin.woff2',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './data/addresses.json',
  './vendor/idb.js',
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Pages: try the network first (fresh version), fall back to the cached copy offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  // While developing on localhost: always fresh files, cache only when the server is down.
  if (self.location.hostname === 'localhost') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Everything else: cached copy first, network as backup (and remember the result).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
