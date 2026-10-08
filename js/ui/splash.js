// Opening screen: four routes run from outside the corners to the middle of the screen, each
// triangle between them reveals another piece of map. When the routes meet, the Aether logo
// appears. Shown once per fresh start of the app. Tap, press a key or wait to continue.

import { t } from '../i18n/nl.js';
import { buildRoutes, buildTriangles, toPoints, toPath } from './splash-routes.js';
import { PIECES, drawPiece } from './splash-art.js';

export const SPLASH_SEEN_KEY = 'aether.splashSeen';
const AUTO_CONTINUE_MS = 4000; // from the start of the animation; the logo shows from ~1.9 s

export function hasSeenSplash() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function buildArt(width, height) {
  const routes = buildRoutes(width, height);
  const triangles = buildTriangles(routes);
  const pieces = triangles
    .map((points, i) => {
      return `
        <clipPath id="splash-clip-${i}"><polygon points="${toPoints(points)}"/></clipPath>
        <g class="splash-tri" style="--i:${i}" clip-path="url(#splash-clip-${i})">${drawPiece(PIECES[i], i, width, height)}</g>`;
    })
    .join('');
  const lines = routes.map((points, i) => `<path class="splash-line" d="${toPath(points)}" pathLength="1" style="--i:${i}"/>`).join('');
  return `<svg class="splash-art" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${pieces}${lines}</svg>`;
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
    <div class="splash-shade" aria-hidden="true"></div>
    <span class="splash-pulse" aria-hidden="true"></span>
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
    let timer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      splash.classList.add('leaving');
      setTimeout(() => splash.remove(), 350);
      resolve();
    };
    splash.addEventListener('click', finish);
    splash.addEventListener('keydown', (event) => {
      if (['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
        finish();
      }
    });

    splash.insertAdjacentHTML('afterbegin', buildArt(splash.clientWidth || innerWidth, splash.clientHeight || innerHeight));
    splash.classList.add('go');
    timer = setTimeout(finish, AUTO_CONTINUE_MS);
  });
}
