// Nieuwe afspraak — Stap 1: choose a group (most recent first). A click goes straight to step 2.

import { t } from '../../i18n/nl.js';
import { icon } from '../../ui/icons.js';
import { navigate } from '../../router.js';
import { listGroups } from '../../data/groups.js';
import { listPeople } from '../../data/people.js';
import { groupCard, createGroupFlow } from '../groups.js';
import { startDraft, stepHeader } from './flow.js';

export async function renderStepGroup(container, _params, query) {
  // Coming from a group's "Plan afspraak" button: skip this step.
  const preselected = query.get('groep');
  if (preselected) {
    startDraft(preselected);
    location.replace('#/nieuw/wanneer');
    return;
  }

  const [groups, people] = await Promise.all([listGroups(), listPeople()]);
  const peopleById = new Map(people.map((p) => [p.id, p]));

  container.innerHTML = `
    <section class="screen">
      ${stepHeader(1, t.newAppointment.stepGroup)}
      <div class="section-head">
        <h2 class="section-title">${t.newAppointment.chooseGroup}</h2>
        <button type="button" class="icon-btn" data-new-group aria-label="${t.groups.fab}">${icon('plus')}</button>
      </div>
      ${groups.map((g) => groupCard(g, peopleById, `#/nieuw?groep=${g.id}`)).join('')}
      <p class="center section-gap"><button type="button" class="link-btn" data-new-group>${t.newAppointment.noGroup}</button></p>
    </section>`;

  container.querySelectorAll('[data-new-group]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const group = await createGroupFlow({ openAfter: false });
      // A new group only has you in it: add members first.
      if (group) navigate(`/groepen/${group.id}`);
    }),
  );
}
