// The fairness slider: from "Efficiënt" (shortest total travel) to "Eerlijk" (equal travel times).

import { t } from '../i18n/nl.js';

// onInput(alpha 0–1) fires continuously while dragging; onChange(alpha) when released.
export function createFairnessSlider(container, { value, onInput, onChange }) {
  container.innerHTML = `
    <div class="fairness-slider">
      <div class="fairness-labels">
        <span class="label-efficient">${t.fairness.efficient}</span>
        <output class="mono" data-out></output>
        <span class="label-fair">${t.fairness.fair}</span>
      </div>
      <input type="range" min="0" max="100" step="1" aria-label="${t.fairness.sliderLabel}" data-range />
    </div>`;

  const range = container.querySelector('[data-range]');
  const out = container.querySelector('[data-out]');

  const show = () => {
    out.textContent = `${range.value}% ${t.fairness.fair.toLowerCase()}`;
    // Fill the track up to the thumb (used by the CSS gradient).
    range.style.setProperty('--fill', `${range.value}%`);
  };

  range.value = Math.round(value * 100);
  show();

  range.addEventListener('input', () => {
    show();
    onInput?.(Number(range.value) / 100);
  });
  range.addEventListener('change', () => onChange?.(Number(range.value) / 100));

  return { get value() { return Number(range.value) / 100; } };
}
