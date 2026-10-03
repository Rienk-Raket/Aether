// Dashboard: upcoming appointments. In M0 this only shows the empty state.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { showToast } from '../ui/toast.js';

export function renderAppointments(container) {
  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.appointments.title}</h1>
      </header>
      <div class="card empty-state">
        ${icon('calendar')}
        <h2>${t.appointments.empty}</h2>
        <p class="muted">${t.appointments.emptyHint}</p>
      </div>
      <button class="fab" type="button">${icon('plus')}<span>${t.appointments.fab}</span></button>
    </section>
  `;

  container.querySelector('.fab').addEventListener('click', () => showToast(t.common.comingSoon));
}
