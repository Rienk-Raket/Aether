// Brings the static shell in index.html to life: icons, date, active navigation, profile,
// the notification dot and the "+" and "Meer" menus.

import { icon } from './icons.js';
import { actionSheet } from './modal.js';
import { initials, hueFor } from './dom.js';
import { todayLabel } from '../core/dates.js';
import { navigate } from '../router.js';
import { ensureSelf } from '../data/people.js';
import { hasUnseenActivity } from '../data/activity.js';
import { isOffline, onConnectivityChange } from '../services/connectivity.js';
import { t } from '../i18n/nl.js';

// handlers: { newGroup() } — passed in by app.js so this file does not depend on screens.
export function initShell(handlers) {
  document.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  document.querySelector('[data-today]').textContent = todayLabel();

  document.querySelector('[data-new]').addEventListener('click', async () => {
    const choice = await actionSheet(t.shell.newTitle, [
      { label: t.shell.newAppointment, value: 'appointment', icon: 'calendar' },
      { label: t.shell.newGroup, value: 'group', icon: 'group' },
    ]);
    if (choice === 'appointment') navigate('/nieuw');
    if (choice === 'group') handlers.newGroup();
  });

  document.querySelector('[data-more]').addEventListener('click', async () => {
    const choice = await actionSheet(t.shell.moreTitle, [
      { label: t.nav.landmap, value: '/kaart', icon: 'pin' },
      { label: t.nav.offer, value: '/aanbod', icon: 'sliders' },
      { label: t.nav.activity, value: '/activiteit', icon: 'activity' },
      { label: t.nav.settings, value: '/instellingen', icon: 'settings' },
      { label: t.business.toBusiness, value: '/zakelijk', icon: 'restaurant' },
    ]);
    if (choice) navigate(choice);
  });

  document.querySelector('[data-more-business]').addEventListener('click', async () => {
    const choice = await actionSheet(t.business.title, [
      { label: t.business.nav.subscription, value: '/zakelijk/abonnement', icon: 'sliders' },
      { label: t.business.nav.invoices, value: '/zakelijk/facturen', icon: 'copy' },
      { label: t.business.nav.team, value: '/zakelijk/team', icon: 'users' },
      { label: t.business.toPersonal, value: '/overzicht', icon: 'home' },
    ]);
    if (choice) navigate(choice);
  });

  document.addEventListener('aether:activity', refreshBell);
  document.addEventListener('aether:profile', refreshProfile);
  onConnectivityChange(refreshStatus);
  refreshStatus();
  refreshProfile();
  refreshBell();
}

// Marks the link that belongs to the current screen (aria-current="page").
export function setActiveRoute(path) {
  // The business portal (#/zakelijk/...) swaps the navigation; see css/business.css.
  document.body.dataset.mode = path.startsWith('/zakelijk') ? 'business' : 'personal';
  const matches = (route) => path === route || (route !== '/zakelijk' && path.startsWith(`${route}/`)) || (route === '/overzicht' && path.startsWith('/nieuw')) || (route === '/ontdek' && path.startsWith('/plek'));

  document.querySelectorAll('[data-route]').forEach((el) => {
    if (matches(el.dataset.route)) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  for (const more of document.querySelectorAll('[data-more], [data-more-business]')) {
    const inMore = more.dataset.routeGroup.split(' ').some(matches);
    if (inMore) more.setAttribute('aria-current', 'page');
    else more.removeAttribute('aria-current');
  }
}

export async function refreshProfile() {
  const self = await ensureSelf();
  const avatar = document.querySelector('[data-profile-avatar]');
  avatar.textContent = initials(self.name);
  avatar.style.setProperty('--hue', hueFor(self.id));
  document.querySelector('[data-profile-name]').textContent = self.name;
}

// "Demo · lokaal opgeslagen" normally, "Offline · lokale data" without a connection.
function refreshStatus() {
  const state = isOffline() ? t.status.offline : t.status.online;
  const chip = document.querySelector('[data-status]');
  chip.classList.toggle('offline', isOffline());
  chip.querySelector('[data-status-label]').textContent = state.label;
  chip.querySelector('[data-status-long]').textContent = state.long;
}

async function refreshBell() {
  document.querySelector('[data-bell-dot]').hidden = !(await hasUnseenActivity());
}
