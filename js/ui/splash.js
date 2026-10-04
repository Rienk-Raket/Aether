// Opening screen: name and logo burst into view with a shockwave and glass cracks.
// Shown once per fresh start of the app (not on every screen change). Tap, press a key or
// wait ~3 seconds to continue.

import { t } from '../i18n/nl.js';

export const SPLASH_SEEN_KEY = 'aether.splashSeen';
const AUTO_CONTINUE_MS = 3000;

// Crack lines radiate from the centre of a 200x200 box (pathLength 1 lets CSS draw them).
const CRACKS = [
  'M100 100 L62 70 L48 40 L20 18',
  'M100 100 L138 66 L150 38 L184 14',
  'M100 100 L170 104 L190 128 L200 152',
  'M100 100 L132 142 L128 170 L150 200',
  'M100 100 L84 148 L52 166 L38 200',
  'M100 100 L30 112 L10 98 L0 110',
  'M100 100 L98 52 L112 24 L104 0',
];

export function hasSeenSplash() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

// Resolves when the user has continued.
export function showSplash() {
  try {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
  } catch {
    // private mode: the splash simply shows again next time
  }

  const splash = document.createElement('div');
  splash.id = 'splash';
  splash.setAttribute('role', 'button');
  splash.tabIndex = 0;
  splash.setAttribute('aria-label', `${t.appName}. ${t.splash.slogan} ${t.splash.hint}`);
  splash.innerHTML = `
    <svg class="splash-cracks" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${CRACKS.map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`).join('')}
    </svg>
    <span class="splash-ring" aria-hidden="true"></span>
    <span class="splash-ring second" aria-hidden="true"></span>
    <div class="splash-brand" aria-hidden="true">
      <span class="splash-mark">A</span>
      <span class="splash-name">${t.appName}</span>
    </div>
    <p class="splash-slogan splash-fade" aria-hidden="true">${t.splash.slogan}</p>
    <p class="splash-sub splash-fade" aria-hidden="true">${t.splash.sub}</p>
    <p class="splash-hint splash-fade" aria-hidden="true">${t.splash.hint}</p>`;
  document.body.append(splash);
  document.documentElement.classList.remove('splash-pending');
  splash.focus();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      splash.classList.add('leaving');
      setTimeout(() => splash.remove(), 350);
      resolve();
    };
    const timer = setTimeout(finish, AUTO_CONTINUE_MS);
    splash.addEventListener('click', finish);
    splash.addEventListener('keydown', (event) => {
      if (['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
        finish();
      }
    });
  });
}
