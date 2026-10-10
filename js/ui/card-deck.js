// A deck of cards you answer one by one. A statement card is swiped to the right (yes) or to the
// left (no); a choice card is answered by tapping an option. Buttons and the arrow keys do the
// same, so it works without a touch screen. The texts come from t.deck (js/i18n/nl-deck.js).

import { t } from '../i18n/nl.js';
import { esc } from './dom.js';
import { icon } from './icons.js';

const THRESHOLD = 90; // pixels to drag before the card counts as answered
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');

// cards: [{ id, type, options? }]; kind: 'personal' | 'business' (picks the statement text)
// answers: starting answers (for editing). onDone(answers) is called after the last card.
export function createDeck(container, { cards, kind, answers: start = {}, onDone }) {
  const answers = { ...start };
  let index = 0;
  let busy = false;

  const text = (card) => t.deck.cards[card.id];
  const statementText = (card) => text(card)[kind] ?? text(card).personal ?? text(card).business;

  function draw() {
    if (index >= cards.length) return onDone({ ...answers });
    const card = cards[index];
    const next = cards[index + 1];
    container.innerHTML = `
      <div class="deck" aria-live="polite">
        <p class="eyebrow deck-count">${t.deck.cardsEyebrow(index + 1, cards.length)}</p>
        <div class="deck-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${cards.length}" aria-valuenow="${index}"><i style="width:${(index / cards.length) * 100}%"></i></div>
        <div class="deck-stage">
          ${next ? '<div class="deck-card behind" aria-hidden="true"></div>' : ''}
          ${card.type === 'statement' ? statementCard(card) : choiceCard(card)}
        </div>
        <p class="muted small deck-hint">${card.type === 'statement' ? t.deck.statementHint : t.deck.choiceHint}</p>
        <div class="deck-actions">
          <button type="button" class="icon-btn" data-undo aria-label="${t.deck.undo}" ${index === 0 ? 'disabled' : ''}>${icon('back')}</button>
          ${card.type === 'statement' ? `<button type="button" class="btn deck-no" data-answer="no">${icon('close')} ${t.deck.no}</button>` : ''}
          <button type="button" class="btn btn-small" data-skip>${t.deck.skip}</button>
          ${card.type === 'statement' ? `<button type="button" class="btn btn-primary deck-yes" data-answer="yes">${icon('check')} ${t.deck.yes}</button>` : ''}
        </div>
      </div>`;
    wire(card);
    const first = container.querySelector('.deck-card:not(.behind)');
    first?.focus({ preventScroll: true });
  }

  const statementCard = (card) => `
    <article class="deck-card statement" tabindex="0" data-card aria-label="${esc(statementText(card))}">
      <span class="deck-stamp yes" aria-hidden="true">${t.deck.swipeYes}</span>
      <span class="deck-stamp no" aria-hidden="true">${t.deck.swipeNo}</span>
      <p class="deck-text">${esc(statementText(card))}</p>
    </article>`;

  const choiceCard = (card) => `
    <article class="deck-card choice" tabindex="0" data-card>
      <h2 class="deck-text">${esc(text(card).title)}</h2>
      <div class="deck-options" role="radiogroup" aria-label="${esc(text(card).title)}">
        ${card.options.map((value) => `<button type="button" role="radio" aria-checked="${String(answers[card.id]) === value}" class="deck-option" data-option="${esc(value)}">${esc(text(card).options[value])}</button>`).join('')}
      </div>
    </article>`;

  function advance(value, direction = 0) {
    if (busy) return;
    const card = cards[index];
    if (value === undefined) delete answers[card.id];
    else answers[card.id] = value;
    const el = container.querySelector('.deck-card:not(.behind)');
    const go = () => {
      busy = false;
      index += 1;
      draw();
    };
    busy = true;
    if (!el || calm() || !direction) return go();
    el.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    el.style.transform = `translateX(${direction * 120}%) rotate(${direction * 14}deg)`;
    el.style.opacity = '0';
    setTimeout(go, 230);
  }

  function wire(card) {
    container.querySelector('[data-undo]').addEventListener('click', () => {
      if (busy || index === 0) return;
      index -= 1;
      draw();
    });
    container.querySelector('[data-skip]').addEventListener('click', () => advance(undefined, 0));

    if (card.type === 'choice') {
      container.querySelectorAll('[data-option]').forEach((btn) => btn.addEventListener('click', () => {
        container.querySelectorAll('[data-option]').forEach((o) => o.setAttribute('aria-checked', String(o === btn)));
        setTimeout(() => advance(btn.dataset.option, 0), calm() ? 0 : 160);
      }));
      return;
    }
    container.querySelectorAll('[data-answer]').forEach((btn) => btn.addEventListener('click', () => advance(btn.dataset.answer, btn.dataset.answer === 'yes' ? 1 : -1)));

    // Dragging the statement card.
    const el = container.querySelector('[data-card]');
    let drag = null;
    const stamp = (dx) => {
      el.style.setProperty('--yes', String(Math.min(1, Math.max(0, dx / THRESHOLD))));
      el.style.setProperty('--no', String(Math.min(1, Math.max(0, -dx / THRESHOLD))));
    };
    el.addEventListener('pointerdown', (event) => {
      if (busy) return;
      drag = { x: event.clientX, dx: 0 };
      el.setPointerCapture(event.pointerId);
      el.style.transition = 'none';
    });
    el.addEventListener('pointermove', (event) => {
      if (!drag) return;
      drag.dx = event.clientX - drag.x;
      el.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 22}deg)`;
      stamp(drag.dx);
    });
    const release = () => {
      if (!drag) return;
      const { dx } = drag;
      drag = null;
      if (Math.abs(dx) >= THRESHOLD) return advance(dx > 0 ? 'yes' : 'no', dx > 0 ? 1 : -1);
      el.style.transition = 'transform 0.2s ease';
      el.style.transform = '';
      stamp(0);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  // Arrow keys on the whole deck: right = yes, left = no, backspace = previous card.
  const keys = (event) => {
    if (!container.isConnected) return document.removeEventListener('keydown', keys);
    if (event.target.matches?.('input, textarea, select')) return;
    const card = cards[index];
    if (!card) return;
    if (card.type === 'statement' && event.key === 'ArrowRight') advance('yes', 1);
    else if (card.type === 'statement' && event.key === 'ArrowLeft') advance('no', -1);
    else if (event.key === 'Backspace' && index > 0 && !busy) {
      index -= 1;
      draw();
    } else return;
    event.preventDefault();
  };
  document.addEventListener('keydown', keys);

  draw();
  return { answers: () => ({ ...answers }), destroy: () => document.removeEventListener('keydown', keys) };
}
