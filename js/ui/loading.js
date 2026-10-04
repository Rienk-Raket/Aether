// Loading state for screens that wait for a (simulated) online answer.

import { t } from '../i18n/nl.js';

// Shows a loading card after a short delay (so quick, cached answers do not flash).
// Returns a function that cancels the delayed card; call it when the data has arrived.
export function loadingFor(container, label = t.loading.default, delayMs = 150) {
  const timer = setTimeout(() => {
    container.innerHTML = `
      <section class="screen" aria-busy="true">
        <div class="card loading-card" role="status">
          <span class="spinner" aria-hidden="true"></span>
          <p>${label}</p>
        </div>
      </section>`;
  }, delayMs);
  return () => clearTimeout(timer);
}

export const loadingBlock = (label) => `<div class="loading-card" role="status"><span class="spinner" aria-hidden="true"></span><p>${label}</p></div>`;
