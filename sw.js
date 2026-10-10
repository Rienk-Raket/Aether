// Service worker: stores the app files on the device so Aether works offline.
// APP_SHELL and CACHE_VERSION are generated: run `npm run sw` after adding files or bumping the version.

const CACHE_VERSION = 'aether-v0.10.1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/business.css',
  './css/collab.css',
  './css/components.css',
  './css/fonts.css',
  './css/forms.css',
  './css/landmap.css',
  './css/offer.css',
  './css/profile.css',
  './css/results.css',
  './css/splash.css',
  './css/tokens.css',
  './css/venues.css',
  './css/widgets.css',
  './js/app.js',
  './js/business/core/billing.js',
  './js/business/core/entitlements.js',
  './js/business/core/plans.js',
  './js/business/core/roles.js',
  './js/business/core/stats.js',
  './js/business/data/booking-hook.js',
  './js/business/data/seed.js',
  './js/business/data/store.js',
  './js/business/screens/guard.js',
  './js/business/screens/invoices.js',
  './js/business/screens/onboarding.js',
  './js/business/screens/overview.js',
  './js/business/screens/plans.js',
  './js/business/screens/requests.js',
  './js/business/screens/stats.js',
  './js/business/screens/subscription.js',
  './js/business/screens/team.js',
  './js/business/screens/venue-profile.js',
  './js/business/services/business-api.js',
  './js/business/services/mock/zaakwijzer-mock.js',
  './js/business/ui/plan-card.js',
  './js/business/ui/promo.js',
  './js/business/ui/widgets.js',
  './js/core/booking.js',
  './js/core/candidates.js',
  './js/core/co2.js',
  './js/core/dates.js',
  './js/core/fairness.js',
  './js/core/geo.js',
  './js/core/group-warnings.js',
  './js/core/guide-import.js',
  './js/core/hash.js',
  './js/core/ics.js',
  './js/core/invite.js',
  './js/core/levels.js',
  './js/core/map-cluster.js',
  './js/core/map-filters.js',
  './js/core/nl-outline.js',
  './js/core/offer.js',
  './js/core/orb-layout.js',
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
  './js/data/bookings.js',
  './js/data/cache.js',
  './js/data/db.js',
  './js/data/demo-seed.js',
  './js/data/groups.js',
  './js/data/imported-venues.js',
  './js/data/offer.js',
  './js/data/people.js',
  './js/data/polls.js',
  './js/data/profiles.js',
  './js/data/settings.js',
  './js/data/slot-travelers.js',
  './js/data/venue-choice.js',
  './js/i18n/nl-booking.js',
  './js/i18n/nl-business.js',
  './js/i18n/nl-collab.js',
  './js/i18n/nl-landmap.js',
  './js/i18n/nl-offer.js',
  './js/i18n/nl-profile.js',
  './js/i18n/nl-services.js',
  './js/i18n/nl.js',
  './js/router.js',
  './js/screens/activity.js',
  './js/screens/agenda.js',
  './js/screens/booking-done.js',
  './js/screens/booking.js',
  './js/screens/discover.js',
  './js/screens/group-detail.js',
  './js/screens/groups.js',
  './js/screens/home.js',
  './js/screens/invite-import.js',
  './js/screens/landmap-import.js',
  './js/screens/landmap.js',
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
  './js/services/share.js',
  './js/services/simulation.js',
  './js/three/orb.js',
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
  './js/ui/map-view.js',
  './js/ui/map2d.js',
  './js/ui/modal.js',
  './js/ui/name-form.js',
  './js/ui/nl-map.js',
  './js/ui/plus-badge.js',
  './js/ui/poll-sheet.js',
  './js/ui/requirements-summary.js',
  './js/ui/shell.js',
  './js/ui/slot-hints.js',
  './js/ui/source-badge.js',
  './js/ui/splash-city.js',
  './js/ui/splash-pins.js',
  './js/ui/splash-plan.js',
  './js/ui/splash-play.js',
  './js/ui/splash-routes.js',
  './js/ui/splash-svg.js',
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
  './data/gids_locaties_nederland.md',
  './data/nl-places.json',
  './data/providers.json',
  './data/venues.json',
  './vendor/idb.js',
  './vendor/qrcode.js',
  './vendor/three.core.js',
  './vendor/three.module.js',
  './partners/direct.html',
  './partners/overnachter.html',
  './partners/partner.css',
  './partners/partner.js',
  './partners/samenzijn.html',
  './partners/tafelaar.html',
  './partners/zaalmeester.html',
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
