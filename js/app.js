// App entry point: builds the shell, starts the router and the service worker.

import { createRouter } from './router.js';
import { renderNav, setActiveTab } from './ui/nav.js';
import { showToast } from './ui/toast.js';
import { t } from './i18n/nl.js';
import { ensureSelf } from './data/people.js';
import { renderAppointments } from './screens/appointments.js';
import { renderGroups } from './screens/groups.js';
import { renderGroupDetail } from './screens/group-detail.js';
import { renderProfile } from './screens/profile.js';
import { renderStepGroup } from './screens/new/step-group.js';
import { renderStepWhen } from './screens/new/step-when.js';
import { renderStepWhere } from './screens/new/step-where.js';
import { renderResults } from './screens/results.js';
import { renderWelcome, ONBOARDED_KEY } from './screens/welcome.js';

const main = document.querySelector('#main');
const nav = document.querySelector('#bottom-nav');

renderNav(nav);

const router = createRouter({
  fallback: '/afspraken',
  routes: {
    '/afspraken': renderAppointments,
    '/groepen': renderGroups,
    '/groepen/:id': renderGroupDetail,
    '/profiel': renderProfile,
    '/nieuw': renderStepGroup,
    '/nieuw/wanneer': renderStepWhen,
    '/nieuw/waar': renderStepWhere,
    '/afspraak/:id/resultaten': renderResults,
    '/welkom': renderWelcome,
  },
  onChange(path, render, params, query) {
    setActiveTab(nav, path);
    // The welcome carousel is full screen: no header or bottom navigation.
    document.body.classList.toggle('fullscreen', path === '/welkom');
    // Every screen gets a fresh element. If the user navigates away while a screen is still
    // loading its data, that screen writes into a detached element and nothing breaks.
    const view = document.createElement('div');
    main.replaceChildren(view);
    window.scrollTo(0, 0);
    Promise.resolve(render(view, params, query)).catch((error) => {
      console.error(error);
      showToast(t.common.error);
    });
  },
});

registerServiceWorker();
requestPersistentStorage();
await ensureSelf();
// First visit: show the welcome carousel once.
if (!localStorage.getItem(ONBOARDED_KEY) && ['', '#', '#/afspraken'].includes(location.hash)) {
  history.replaceState(null, '', '#/welkom'); // no hashchange event, so no double render
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
