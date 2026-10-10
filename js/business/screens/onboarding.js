// Zakelijk → Zaak aansluiten: four steps (account, find the venue, verify, start). Demo: the
// verification code is pre-filled and nothing is sent anywhere.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { showToast } from '../../ui/toast.js';
import { navigate } from '../../router.js';
import { fetchAllVenues } from '../../services/mock/plekwijzer-mock.js';
import { loadingFor } from '../../ui/loading.js';
import { createBusiness, getState, saveState } from '../data/store.js';
import { pageHead } from '../ui/widgets.js';
import { ensureSelf } from '../../data/people.js';

const b = t.business;
const DEMO_CODE = '123456';

export async function render(container) {
  if (getState()) {
    navigate('/zakelijk');
    return;
  }
  const stop = loadingFor(container, b.loading);
  const venues = await fetchAllVenues();
  stop();

  // A business profile (made with the profile cards) already tells us what kind of venue to look for.
  const profile = await ensureSelf();
  const model = { step: 1, venue: null, name: profile.kind === 'business' ? profile.name : '', email: '', query: profile.business?.venue_type ? '' : 'Keuken Kade', type: profile.business?.venue_type ?? null };
  const draw = () => {
    container.innerHTML = `<section class="screen">${pageHead(b.onboarding.eyebrow, b.onboarding.title)}${stepper(model.step + 1)}<div data-step></div></section>`;
    const body = container.querySelector('[data-step]');
    [null, stepSearch, stepVerify, stepStart][model.step](body);
  };

  function stepSearch(body) {
    body.innerHTML = `
      <div class="biz-grid cols-2">
        <div class="card"><h2>${b.onboarding.searchTitle}</h2><p class="muted small">${b.onboarding.searchSub}</p>
          <div class="biz-form">
            <label class="field"><span class="field-label">${b.onboarding.ownerName}</span><input name="name" value="${esc(model.name)}" autocomplete="name" /></label>
            <label class="field"><span class="field-label">${b.onboarding.ownerEmail}</span><input name="email" type="email" value="${esc(model.email)}" autocomplete="email" /></label>
            <label class="field"><span class="field-label">${b.onboarding.searchLabel}</span><input name="query" type="search" placeholder="${b.onboarding.searchPlaceholder}" value="${esc(model.query)}" /></label>
          </div>
          ${model.type ? `<p class="notice small" data-type-note>${t.deck.businessFromProfile(t.placeTypes[model.type])} <button type="button" class="link-btn" data-clear-type>${t.deck.businessClearType}</button></p>` : ''}
          <div class="list-card" data-results></div></div>
        <div class="card"><h2>${b.onboarding.demoAccount}</h2><p class="muted small">${b.onboarding.demoAccountHint}</p>
          <button class="btn btn-block" type="button" data-demo>${b.onboarding.useDemo}</button>
          <p class="demo-note">${b.demoNote}</p></div>
      </div>`;
    const results = body.querySelector('[data-results]');
    const input = (name) => body.querySelector(`[name="${name}"]`);
    const list = () => {
      model.query = input('query').value;
      const q = model.query.trim().toLowerCase();
      const pool = model.type ? venues.filter((v) => v.type === model.type) : venues;
      const hits = q.length < 2 && !model.type ? [] : pool.filter((v) => `${v.name} ${v.address}`.toLowerCase().includes(q)).slice(0, 5);
      results.innerHTML = hits.length
        ? hits.map((v) => `<div class="card card-row biz-row"><div><strong>${esc(v.name)}</strong><p class="muted small">${t.placeTypes[v.type]} · ${esc(v.cuisine)} · ${esc(v.address)}</p></div><button class="btn btn-small btn-primary" type="button" data-pick="${esc(v.id)}">${b.onboarding.pick}</button></div>`).join('')
        : `<p class="muted small">${q.length < 2 && !model.type ? '' : b.onboarding.noResults}</p>`;
    };
    input('query').addEventListener('input', list);
    body.querySelector('[data-clear-type]')?.addEventListener('click', () => {
      model.type = null;
      body.querySelector('[data-type-note]').remove();
      list();
    });
    list();
    results.addEventListener('click', (event) => {
      const id = event.target.closest('[data-pick]')?.dataset.pick;
      if (!id) return;
      model.name = input('name').value.trim();
      model.email = input('email').value.trim();
      if (!model.name || !/^\S+@\S+\.\S+$/.test(model.email)) {
        showToast(t.business.venue.invalid);
        (model.name ? input('email') : input('name')).focus();
        return;
      }
      model.venue = venues.find((v) => v.id === id);
      model.step = 2;
      draw();
    });
    body.querySelector('[data-demo]').addEventListener('click', () => {
      createBusiness(venues.find((v) => v.id === 'amsterdam-restaurant-1') ?? venues[0], 'demo');
      navigate('/zakelijk');
    });
  }

  function stepVerify(body) {
    body.innerHTML = `
      <div class="card narrow"><h2>${b.onboarding.verifyTitle}</h2><p class="muted small">${b.onboarding.verifySub(esc(model.email))}</p>
        <label class="field"><span class="field-label">${b.onboarding.code}</span><input name="code" inputmode="numeric" value="${DEMO_CODE}" /></label>
        <p class="text-error small" data-error hidden>${b.onboarding.wrongCode}</p>
        <div class="sheet-actions"><button class="btn" type="button" data-back>${b.onboarding.back}</button><button class="btn btn-primary" type="button" data-ok>${b.onboarding.verify}</button></div></div>`;
    body.querySelector('[data-back]').addEventListener('click', () => ((model.step = 1), draw()));
    body.querySelector('[data-ok]').addEventListener('click', () => {
      if (body.querySelector('[name="code"]').value.trim() !== DEMO_CODE) {
        body.querySelector('[data-error]').hidden = false;
        return;
      }
      model.step = 3;
      draw();
    });
  }

  function stepStart(body) {
    body.innerHTML = `
      <div class="card narrow"><h2>${b.onboarding.planTitle}</h2><p class="muted small">${b.onboarding.planSub}</p>
        <div class="sheet-actions stack"><button class="btn btn-primary btn-large" type="button" data-trial>${icon('check')} ${b.onboarding.startTrial}</button>
        <button class="btn" type="button" data-basis>${b.onboarding.startBasis}</button></div></div>`;
    const finish = (basis) => {
      const state = createBusiness(model.venue, 'trial', { name: model.name, email: model.email });
      if (basis) Object.assign(state.subscription, { plan: 'basis', status: 'active', trial_ends_at: null });
      saveState(state);
      showToast(b.onboarding.welcome(model.name.split(' ')[0]));
      navigate('/zakelijk');
    };
    body.querySelector('[data-trial]').addEventListener('click', () => finish(false));
    body.querySelector('[data-basis]').addEventListener('click', () => finish(true));
  }

  draw();
}

function stepper(current) {
  return `<ol class="steps">${b.onboarding.steps.map((label, i) => `<li class="step ${i + 1 === current ? 'on' : i + 1 < current ? 'done' : ''}" ${i + 1 === current ? 'aria-current="step"' : ''}><b>${i + 1}</b>${label}</li>`).join('')}</ol>`;
}
