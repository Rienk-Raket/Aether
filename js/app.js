// App entry point: starts the shell, the router and the service worker.

import { createRouter } from './router.js';
import { initShell, setActiveRoute } from './ui/shell.js';
import { showToast } from './ui/toast.js';
import { t } from './i18n/nl.js';
import { ensureSelf } from './data/people.js';
import { applySettings } from './data/settings.js';
import { renderHome } from './screens/home.js';
import { renderDiscover } from './screens/discover.js';
import { renderGroups, createGroupFlow } from './screens/groups.js';
import { renderVenue } from './screens/venue.js';
import { renderOffer } from './screens/offer.js';
import { renderLandmap } from './screens/landmap.js';
import { renderInviteImport } from './screens/invite-import.js';
import { startSimulation } from './services/simulation.js';
import { renderGroupDetail } from './screens/group-detail.js';
import { renderAgenda } from './screens/agenda.js';
import { renderActivity } from './screens/activity.js';
import { renderSettings } from './screens/settings.js';
import { renderBooking } from './screens/booking.js';
import { renderBookingDone } from './screens/booking-done.js';
import { renderProfile } from './screens/profile.js';
import { renderProfileWizard } from './screens/profile-wizard.js';
import { renderStepGroup } from './screens/new/step-group.js';
import { renderStepWhen } from './screens/new/step-when.js';
import { renderStepPrefs } from './screens/new/step-prefs.js';
import { renderStepWhere } from './screens/new/step-where.js';
import { renderWelcome, ONBOARDED_KEY } from './screens/welcome.js';
import { renderStartMenu } from './screens/start-menu.js';
import { hasSeenSplash, showSplash } from './ui/splash.js';

const main = document.querySelector('#main');

// The business portal is only downloaded when someone opens it (dynamic import).
function businessRoutes() {
  const screen = (name) => (view, params, query) => import(`./business/screens/${name}.js`).then((m) => m.render(view, params, query));
  return {
    '/zakelijk': screen('overview'),
    '/zakelijk/aansluiten': screen('onboarding'),
    '/zakelijk/statistieken': screen('stats'),
    '/zakelijk/zaak': screen('venue-profile'),
    '/zakelijk/aanvragen': screen('requests'),
    '/zakelijk/abonnement': screen('subscription'),
    '/zakelijk/abonnement/kiezen': screen('plans'),
    '/zakelijk/facturen': screen('invoices'),
    '/zakelijk/team': screen('team'),
  };
}

// Page title per first part of the route, e.g. "#/groepen/abc" → "Mijn groepen".
const TITLES = {
  overzicht: t.nav.overview,
  ontdek: t.nav.discover,
  plek: t.nav.discover,
  aanbod: t.nav.offer,
  kaart: t.nav.landmap,
  uitnodiging: t.importInvite.title,
  groepen: t.nav.groups,
  agenda: t.nav.agenda,
  activiteit: t.nav.activity,
  instellingen: t.nav.settings,
  nieuw: t.newAppointment.title,
  welkom: t.welcome.title,
  start: t.start.eyebrow,
  reserveren: t.booking.eyebrow,
  bevestigd: t.bookingDone.eyebrow,
  profiel: t.profile.eyebrow,
  zakelijk: t.business.title,
};

applySettings();
initShell({ newGroup: () => createGroupFlow() });

const router = createRouter({
  fallback: '/overzicht',
  routes: {
    '/overzicht': renderHome,
    '/ontdek': renderDiscover,
    '/plek/:id': renderVenue,
    '/aanbod': renderOffer,
    '/kaart': renderLandmap,
    '/uitnodiging': renderInviteImport,
    '/groepen': renderGroups,
    '/groepen/:id': renderGroupDetail,
    '/agenda': renderAgenda,
    '/activiteit': renderActivity,
    '/instellingen': renderSettings,
    '/nieuw': renderStepGroup,
    '/nieuw/wanneer': renderStepWhen,
    '/nieuw/voorkeuren': renderStepPrefs,
    '/nieuw/waar': renderStepWhere,
    '/welkom': renderWelcome,
    '/start': renderStartMenu,
    '/profiel': renderProfile,
    '/profiel/nieuw': renderProfileWizard,
    '/reserveren': renderBooking,
    '/bevestigd': renderBookingDone,
    ...businessRoutes(),
  },
  onChange(path, render, params, query) {
    setActiveRoute(path);
    // The welcome carousel is full screen: no sidebar, top bar or bottom navigation.
    document.body.classList.toggle('fullscreen', ['/welkom', '/start'].includes(path));
    document.title = `${TITLES[path.split('/')[1]] ?? t.appName} — ${t.appName}`;

    // Every screen gets a fresh element. If the user navigates away while a screen is still
    // loading its data, that screen writes into a detached element and nothing breaks.
    const view = document.createElement('div');
    main.replaceChildren(view);
    window.scrollTo(0, 0);

    Promise.resolve(render(view, params, query))
      .catch((error) => {
        console.error(error);
        showToast(t.common.error);
      })
      .finally(() => {
        // Move keyboard and screen-reader focus to the new screen's heading.
        const heading = view.querySelector('h1');
        if (heading && main.contains(view)) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      });
  },
});

registerServiceWorker();
requestPersistentStorage();
await ensureSelf();
startSimulation();
// Fresh start of the app: opening screen first.
const landing = ['', '#', '#/overzicht'].includes(location.hash);
const freshStart = !hasSeenSplash();
if (freshStart) await showSplash();
// First visit: show the welcome carousel once.
if (!localStorage.getItem(ONBOARDED_KEY) && landing) {
  history.replaceState(null, '', '#/welkom'); // no hashchange event, so no double render
} else if (landing && freshStart) {
  history.replaceState(null, '', '#/start'); // fresh start: startmenu
}
router.start();

// The service worker caches all files so the app keeps working without internet.
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.register('./sw.js');

  // A new version was downloaded in the background: offer a reload.
  const offerUpdate = (worker) => {
    showToast(t.common.newVersion, {
      actionLabel: t.common.reload,
      onAction: () => worker.postMessage('SKIP_WAITING'),
    });
  };

  if (registration.waiting && navigator.serviceWorker.controller) {
    offerUpdate(registration.waiting);
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        offerUpdate(worker);
      }
    });
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
}

// Ask the browser not to clear our local data when the device is low on space.
async function requestPersistentStorage() {
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
    await navigator.storage.persist();
  }
}
