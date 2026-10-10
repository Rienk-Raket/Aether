// Nieuw profiel (#/profiel/nieuw): choose particulier or zakelijk, give a name, then build the
// profile with swipeable cards (statements to swipe, choices to tap). With ?opnieuw=1 the cards
// are redone for the current profile.

import { t } from '../i18n/nl.js';
import { esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { showToast } from '../ui/toast.js';
import { navigate } from '../router.js';
import { createDeck } from '../ui/card-deck.js';
import { deckFor, applyPersonalAnswers, businessProfileFrom, PROFILE_KINDS } from '../core/profile-deck.js';
import { ensureSelf } from '../data/people.js';
import { createProfile, updateProfileFromDeck, profileKind } from '../data/profiles.js';
import { getState } from '../business/data/store.js';

const D = t.deck;

export async function renderProfileWizard(container, _params, query) {
  const redo = query?.get('opnieuw') === '1';
  const self = redo ? await ensureSelf() : null;
  const state = { kind: self ? profileKind(self) : null, name: self?.name ?? '', answers: { ...(self?.deck_answers ?? {}) } };
  let deck = null;

  const shell = (inner) => {
    deck?.destroy();
    container.innerHTML = `<section class="screen"><a class="back-link" href="${redo ? '#/profiel' : '#/start'}">${icon('back')} ${t.profile.backToStart}</a>${inner}</section>`;
  };

  function stepKind() {
    shell(`
      <div class="deck-step">
        <div class="eyebrow">${D.kindEyebrow}</div>
        <h1 class="section-gap">${D.kindTitle}</h1>
        <p class="sub">${D.kindHint}</p>
        <div class="kind-grid" role="radiogroup" aria-label="${D.kindTitle}">
          ${PROFILE_KINDS.map((kind) => `
            <button type="button" role="radio" aria-checked="${state.kind === kind}" class="card kind-card" data-kind="${kind}">
              <span class="start-icon">${icon(kind === 'business' ? 'restaurant' : 'users')}</span>
              <strong>${D.kinds[kind].name}</strong><span class="muted">${D.kinds[kind].text}</span>
            </button>`).join('')}
        </div>
        <div class="sheet-actions"><button type="button" class="btn btn-primary btn-large" data-next ${state.kind ? '' : 'disabled'}>${D.next} ${icon('chevron')}</button></div>
      </div>`);
    container.querySelectorAll('[data-kind]').forEach((btn) => btn.addEventListener('click', () => {
      state.kind = btn.dataset.kind;
      container.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      container.querySelector('[data-next]').disabled = false;
    }));
    container.querySelector('[data-next]').addEventListener('click', stepName);
  }

  function stepName() {
    shell(`
      <form class="deck-step form" novalidate>
        <div class="eyebrow">${D.nameEyebrow}</div>
        <h1 class="section-gap">${state.kind === 'business' ? D.nameBusinessTitle : D.nameTitle}</h1>
        <label class="field"><span class="field-label">${D.nameLabel}</span><input name="name" value="${esc(state.name)}" maxlength="40" required autocomplete="off" /></label>
        <div class="sheet-actions"><button type="button" class="btn" data-back>${D.back}</button><button type="submit" class="btn btn-primary btn-large">${D.start} ${icon('chevron')}</button></div>
      </form>`);
    const form = container.querySelector('form');
    form.elements.name.focus();
    container.querySelector('[data-back]').addEventListener('click', stepKind);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      if (!name) return form.elements.name.focus();
      state.name = name;
      stepDeck();
    });
  }

  function stepDeck() {
    shell(`<div class="deck-step"><h1 class="visually-hidden">${D.title}</h1><div data-deck></div></div>`);
    deck = createDeck(container.querySelector('[data-deck]'), { cards: deckFor(state.kind), kind: state.kind, answers: state.answers, onDone: (answers) => { state.answers = answers; stepSummary(); } });
  }

  const label = (card, value) => {
    const text = t.deck.cards[card.id];
    if (card.type === 'choice') return text.options[value];
    return value === 'yes' ? D.yes : D.no;
  };

  function stepSummary() {
    const cards = deckFor(state.kind);
    const rows = cards.map((card) => {
      const text = t.deck.cards[card.id];
      const value = state.answers[card.id];
      const name = card.type === 'choice' ? text.title : text[state.kind] ?? text.personal ?? text.business;
      return `<div class="deck-summary-row"><span>${esc(name)}</span><span class="${value === undefined ? 'muted' : value === 'no' ? 'no' : 'yes'}">${value === undefined ? D.summarySkipped : esc(label(card, value))}</span></div>`;
    });
    shell(`
      <div class="deck-step">
        <div class="eyebrow">${D.kindBadge[state.kind]} · ${esc(state.name)}</div>
        <h1 class="section-gap">${redo ? D.redoTitle : D.summaryTitle}</h1>
        <p class="sub">${D.summaryText} ${state.kind === 'business' && !redo ? D.businessNext : ''}</p>
        <div class="card deck-summary">${rows.join('')}</div>
        <div class="sheet-actions"><button type="button" class="btn" data-restart>${D.restart}</button><button type="button" class="btn btn-primary btn-large" data-save>${icon('check')} ${D.save}</button></div>
      </div>`);
    container.querySelector('[data-restart]').addEventListener('click', () => { state.answers = {}; stepDeck(); });
    container.querySelector('[data-save]').addEventListener('click', save);
  }

  async function save() {
    const personal = state.kind === 'personal';
    const preferences = personal ? applyPersonalAnswers(state.answers, self?.preferences) : null;
    const business = personal ? null : businessProfileFrom(state.answers);
    if (redo) {
      await updateProfileFromDeck(self.id, { preferences, business, answers: state.answers });
      showToast(D.redoSaved);
      return navigate('/profiel');
    }
    const profile = await createProfile(state.name, { kind: state.kind, preferences: personal ? applyPersonalAnswers(state.answers, null) : null, business, answers: state.answers });
    showToast(D.saved(profile.name));
    navigate(personal ? '/profiel' : getState() ? '/zakelijk' : '/zakelijk/aansluiten');
  }

  if (redo) stepDeck();
  else stepKind();
}
