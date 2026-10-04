// "Vul met demo-data" button, used in empty states and in Profiel.

import { loadDemoData } from '../data/demo-seed.js';
import { showToast } from './toast.js';
import { t } from '../i18n/nl.js';

export const demoButtonHtml = () => `<button type="button" class="btn" data-demo>${t.demo.load}</button>`;

// Wires every [data-demo] button inside container; calls onLoaded() after loading.
export function wireDemoButtons(container, onLoaded) {
  container.querySelectorAll('[data-demo]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const loaded = await loadDemoData();
      showToast(loaded ? t.demo.loaded : t.demo.alreadyLoaded);
      onLoaded();
    }),
  );
}
