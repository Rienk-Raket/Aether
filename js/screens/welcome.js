// First-run welcome: 3 swipeable slides. Slide 2 is a live fairness-slider demo with the
// worked example from the plan (Anna, Bram, Cem and two places).

import { t } from '../i18n/nl.js';
import { esc } from '../ui/dom.js';
import { renderMap2d } from '../ui/map2d.js';
import { createFairnessSlider } from '../ui/fairness-slider.js';
import { navigate } from '../router.js';
import { rankCandidates } from '../core/fairness.js';

export const ONBOARDED_KEY = 'aether.onboarded';

const DEMO_PEOPLE = [
  { id: 'demo-anna', name: 'Anna', location: { lat: 52.0, lng: 5.0 } },
  { id: 'demo-bram', name: 'Bram', location: { lat: 52.13, lng: 5.16 } },
  { id: 'demo-cem', name: 'Cem', location: { lat: 51.96, lng: 5.25 } },
];

const DEMO_PLACES = [
  { id: 'a', name: 'Plek A', lat: 52.012, lng: 5.025, times: [5, 20, 26] },
  { id: 'b', name: 'Plek B', lat: 52.035, lng: 5.135, times: [25, 27, 29] },
];

export function renderWelcome(container) {
  container.innerHTML = `
    <section class="welcome">
      <span class="welcome-progress mono" data-progress>1/3</span>
      <div class="slides" data-slides>
        <div class="slide">
          <h1 class="welcome-title gradient-text">${t.welcome.title}</h1>
          <p class="welcome-sub">${t.welcome.subtitle}</p>
          <div class="chips welcome-badges">${t.welcome.badges.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
          <p class="muted small">${t.welcome.swipe}</p>
        </div>
        <div class="slide">
          <h2>${t.welcome.demoTitle}</h2>
          <div class="card map-card" data-demo-map></div>
          <p class="mono small" data-demo-result></p>
          <div data-demo-slider></div>
          <p class="muted small">${t.welcome.demoHint}</p>
        </div>
        <div class="slide">
          <h2 class="welcome-title gradient-text">${t.welcome.readyTitle}</h2>
          <p class="welcome-sub">${t.welcome.readySub}</p>
          <button type="button" class="btn btn-primary btn-large" data-start>${t.welcome.start}</button>
        </div>
      </div>
      <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
    </section>`;

  const slides = container.querySelector('[data-slides]');
  const dots = container.querySelectorAll('.dots span');

  // Swiping (scroll-snap) updates "1/3" and the dots.
  const onScroll = () => {
    const index = Math.round(slides.scrollLeft / slides.clientWidth);
    container.querySelector('[data-progress]').textContent = `${index + 1}/3`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };
  slides.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  dots.forEach((dot, i) => dot.addEventListener('click', () => slides.scrollTo({ left: i * slides.clientWidth, behavior: 'smooth' })));

  const showDemo = (alpha) => {
    const ranked = rankCandidates(DEMO_PLACES, alpha);
    const best = ranked[0];
    renderMap2d(container.querySelector('[data-demo-map]'), { participants: DEMO_PEOPLE, candidates: ranked, selectedId: best.id });
    container.querySelector('[data-demo-result]').innerHTML = t.welcome.demoResult(
      esc(best.name),
      DEMO_PEOPLE.map((p, i) => `${esc(p.name)} ${best.times[i]}′`).join(' · '),
    );
  };
  createFairnessSlider(container.querySelector('[data-demo-slider]'), { value: 0.3, onInput: showDemo });
  showDemo(0.3);

  container.querySelector('[data-start]').addEventListener('click', () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    navigate('/nieuw');
  });
}
