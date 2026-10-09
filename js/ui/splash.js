// Opening screen: a map of six wedges around the Aether logo. Icons run dashed routes over the streets,
// leave their own wedge and meet in the bottom one (js/ui/splash-play.js). Shown once per fresh start.
// Tap, press a key or wait to continue.

import { t } from '../i18n/nl.js';
import { createScene } from './splash-play.js';
import { T_TOTAL } from './splash-routes.js';

export const SPLASH_SEEN_KEY = 'aether.splashSeen';
const AUTO_CONTINUE_MS = T_TOTAL * 1000 + 500;
const CALM_CONTINUE_MS = 2500;

export function hasSeenSplash() {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function prefersCalm() {
  return document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const stage = document.createElement('div');
  stage.className = 'splash-stage';
  splash.append(stage);
  document.body.append(splash);
  document.documentElement.classList.remove('splash-pending');
  splash.focus();

  const scene = createScene(stage);
  const calm = prefersCalm();

  return new Promise((resolve) => {
    let done = false;
    let timer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      scene.stop();
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

    if (calm) scene.showFinal();
    else scene.play();
    timer = setTimeout(finish, calm ? CALM_CONTINUE_MS : AUTO_CONTINUE_MS);
  });
}
