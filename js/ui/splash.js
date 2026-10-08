// Opening screen: four routes run from outside the corners to the middle of the screen, each
// triangle between them reveals another piece of map. When the routes meet, the Aether logo
// appears. Shown once per fresh start of the app. Tap, press a key or wait to continue.

import { t } from '../i18n/nl.js';
import { buildRoutes, buildTriangles, boundingBox, toPoints, toPath } from './splash-routes.js';

export const SPLASH_SEEN_KEY = 'aether.splashSeen';
const AUTO_CONTINUE_MS = 4000; // from the start of the animation; the logo shows from ~1.9 s
const IMAGE_WAIT_MS = 1500; // do not wait longer than this for the map pictures

// Map pieces: top, right, bottom, left (fictional demo backdrop, stored in assets/splash/).
const MAPS = ['kaart-groningen', 'kaart-veghel', 'kaart-rosmalen', 'kaart-houten'].map((name) => `assets/splash/${name}.jpg`);

export function hasSeenSplash() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

// Resolves with the pictures that loaded (a failed picture is simply left out).
function preloadMaps() {
  const load = (src) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(src);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  return Promise.race([Promise.all(MAPS.map(load)), new Promise((resolve) => setTimeout(() => resolve(MAPS.map(() => null)), IMAGE_WAIT_MS))]);
}

function buildArt(width, height, loaded) {
  const routes = buildRoutes(width, height);
  const triangles = buildTriangles(routes);
  const pieces = triangles
    .map((points, i) => {
      const box = boundingBox(points);
      return `
        <clipPath id="splash-clip-${i}"><polygon points="${toPoints(points)}"/></clipPath>
        <g class="splash-tri" style="--i:${i}" clip-path="url(#splash-clip-${i})">
          ${loaded[i] ? `<image href="${loaded[i]}" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" preserveAspectRatio="xMidYMid slice"/>` : ''}
        </g>`;
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

    // The animation starts once the map pictures are ready (or after a short wait).
    preloadMaps().then((loaded) => {
      if (done) return;
      splash.insertAdjacentHTML('afterbegin', buildArt(splash.clientWidth || innerWidth, splash.clientHeight || innerHeight, loaded));
      splash.classList.add('go');
      timer = setTimeout(finish, AUTO_CONTINUE_MS);
    });
  });
}
