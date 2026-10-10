// Swipeable cards: one block of information per card; swipe (or use the arrows, dots or the
// keyboard) to see the next one. The visitor can switch this view off in the overview to get the
// original layout back; the choice is remembered on this device.

import { t } from '../i18n/nl.js';
import { esc } from './dom.js';
import { icon } from './icons.js';

const KEY = 'aether.business.swipe';
const b = t.business.overview;

// Without a saved choice, the cards are on for phones and tablets and off on a computer.
export function swipeEnabled(key = KEY) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === '1' || saved === '0') return saved === '1';
  } catch {
    // storage blocked: use the default
  }
  return window.matchMedia('(max-width: 900px)').matches;
}

export function setSwipeEnabled(on, key = KEY) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // not remembered
  }
}

export const swipeToggle = (on) =>
  `<button type="button" class="btn btn-small" data-swipe-toggle aria-pressed="${on}" title="${esc(b.swipeHint)}">${icon('sliders')} ${b.swipeToggle}</button>`;

// cards: [{ title, html }] → HTML of the carousel
export function swipeCardsHtml(cards) {
  return `
    <div class="swipe" role="region" aria-roledescription="carousel" aria-label="${esc(b.swipeLabel)}">
      <div class="swipe-track" tabindex="0" data-swipe-track>
        ${cards.map((card, i) => `<section class="card swipe-card" role="group" aria-roledescription="slide" aria-label="${esc(b.swipeSlide(i + 1, cards.length, card.title))}">${card.html}</section>`).join('')}
      </div>
      <div class="swipe-controls">
        <button type="button" class="icon-btn" data-swipe-prev aria-label="${b.swipePrev}">${icon('back')}</button>
        <div class="swipe-dots" role="group" aria-label="${esc(b.swipeLabel)}">
          ${cards.map((card, i) => `<button type="button" class="swipe-dot" data-swipe-dot="${i}" aria-label="${esc(b.swipeGoTo(i + 1, card.title))}"></button>`).join('')}
        </div>
        <button type="button" class="icon-btn" data-swipe-next aria-label="${b.swipeNext}">${icon('chevron')}</button>
      </div>
      <p class="muted small swipe-count" data-swipe-count aria-live="polite"></p>
    </div>`;
}

// Makes the arrows, dots and keyboard work and keeps the dots in step with the swipe.
export function wireSwipeCards(root, titles) {
  const track = root.querySelector('[data-swipe-track]');
  const cards = [...track.children];
  const dots = [...root.querySelectorAll('[data-swipe-dot]')];
  const prev = root.querySelector('[data-swipe-prev]');
  const next = root.querySelector('[data-swipe-next]');
  const count = root.querySelector('[data-swipe-count]');
  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');

  const current = () => {
    const centre = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    cards.forEach((card, i) => {
      if (Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - centre)) best = i;
    });
    return best;
  };
  const show = (i) => {
    const index = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: cards[index].offsetLeft - (track.clientWidth - cards[index].offsetWidth) / 2, behavior: calm() ? 'auto' : 'smooth' });
  };
  const sync = () => {
    const i = current();
    dots.forEach((dot, n) => dot.setAttribute('aria-current', n === i ? 'true' : 'false'));
    prev.disabled = i === 0;
    next.disabled = i === cards.length - 1;
    count.textContent = b.swipeSlide(i + 1, cards.length, titles[i]);
  };

  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }, { passive: true });
  prev.addEventListener('click', () => show(current() - 1));
  next.addEventListener('click', () => show(current() + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.swipeDot))));
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') show(current() + 1);
    else if (event.key === 'ArrowLeft') show(current() - 1);
    else return;
    event.preventDefault();
  });
  new ResizeObserver(sync).observe(track);
  sync();
}
