// Bottom navigation bar with the three main tabs.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';

export const tabs = [
  { path: '/afspraken', also: ['/nieuw'], label: t.nav.appointments, icon: 'calendar' },
  { path: '/groepen', also: [], label: t.nav.groups, icon: 'users' },
  { path: '/profiel', also: [], label: t.nav.profile, icon: 'user' },
];

export function renderNav(container) {
  container.setAttribute('aria-label', t.nav.label);
  container.innerHTML = tabs
    .map((tab) => `<a class="nav-item" href="#${tab.path}">${icon(tab.icon)}<span>${tab.label}</span></a>`)
    .join('');
}

// Highlight the tab that matches the current route (the new-appointment flow belongs to "Afspraken").
export function setActiveTab(container, path) {
  const links = container.querySelectorAll('.nav-item');
  tabs.forEach((tab, i) => {
    const active = [tab.path, ...tab.also].some((prefix) => path.startsWith(prefix));
    if (active) links[i].setAttribute('aria-current', 'page');
    else links[i].removeAttribute('aria-current');
  });
}
