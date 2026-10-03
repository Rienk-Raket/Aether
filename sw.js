// Service worker: stores the app files on the device so Aether works offline.
// Bump CACHE_VERSION (and APP_VERSION in js/version.js) on every release.

const CACHE_VERSION = 'aether-v0.1.1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/fonts.css',
  './css/base.css',
  './css/components.css',
  './js/app.js',
  './js/router.js',
  './js/version.js',
  './js/i18n/nl.js',
  './js/ui/icons.js',
  './js/ui/nav.js',
  './js/ui/toast.js',
  './js/screens/appointments.js',
  './js/screens/groups.js',
  './js/screens/profile.js',
  './assets/fonts/inter-latin.woff2',
  './assets/fonts/rajdhani-600-latin.woff2',
  './assets/fonts/rajdhani-700-latin.woff2',
  './assets/fonts/spacemono-400-latin.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
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
