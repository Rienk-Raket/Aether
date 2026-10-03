// App entry point: builds the shell, starts the router and the service worker.

import { createRouter } from './router.js';
import { renderNav, setActiveTab } from './ui/nav.js';
import { showToast } from './ui/toast.js';
import { t } from './i18n/nl.js';
import { renderAppointments } from './screens/appointments.js';
import { renderGroups } from './screens/groups.js';
import { renderProfile } from './screens/profile.js';

const main = document.querySelector('#main');
const nav = document.querySelector('#bottom-nav');

renderNav(nav);

const router = createRouter({
  fallback: '/afspraken',
  routes: {
    '/afspraken': renderAppointments,
    '/groepen': renderGroups,
    '/profiel': renderProfile,
  },
  onChange(path, render) {
    setActiveTab(nav, path);
    render(main);
    window.scrollTo(0, 0);
  },
});

router.start();
registerServiceWorker();
requestPersistentStorage();

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
