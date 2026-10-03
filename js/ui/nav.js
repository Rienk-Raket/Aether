// Bottom navigation bar with the three main tabs.

import { t } from '../i18n/nl.js';
import { icon } from './icons.js';

export const tabs = [
  { path: '/afspraken', label: t.nav.appointments, icon: 'calendar' },
  { path: '/groepen', label: t.nav.groups, icon: 'users' },
  { path: '/profiel', label: t.nav.profile, icon: 'user' },
];

export function renderNav(container) {
  container.setAttribute('aria-label', t.nav.label);
  container.innerHTML = tabs
    .map((tab) => `<a class="nav-item" href="#${tab.path}">${icon(tab.icon)}<span>${tab.label}</span></a>`)
    .join('');
}

// Highlight the tab that matches the current route.
export function setActiveTab(container, path) {
  for (const link of container.querySelectorAll('.nav-item')) {
    const isActive = path.startsWith(link.getAttribute('href').slice(1));
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
