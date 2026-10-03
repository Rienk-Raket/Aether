// Groups overview. In M0 this only shows the empty state.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { showToast } from '../ui/toast.js';

export function renderGroups(container) {
  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.groups.title}</h1>
      </header>
      <div class="card empty-state">
        ${icon('users')}
        <h2>${t.groups.empty}</h2>
        <p class="muted">${t.groups.emptyHint}</p>
      </div>
      <button class="fab" type="button">${icon('plus')}<span>${t.groups.fab}</span></button>
    </section>
  `;

  container.querySelector('.fab').addEventListener('click', () => showToast(t.common.comingSoon));
}
