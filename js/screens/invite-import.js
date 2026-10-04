// Opening an invitation link: show what is inside and, after a tap, add the group to this device.
// Route: #/uitnodiging?d=<code>. The code comes from anybody, so it is checked before use.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { transportIcon, transportLabel } from '../ui/transport.js';
import { showToast } from '../ui/toast.js';
import { navigate } from '../router.js';
import { parseInvite } from '../core/invite.js';
import { hashKey } from '../core/hash.js';
import { nearestAddress } from '../services/geocode.js';
import { ensureSelf, newPerson, addLocation, savePerson } from '../data/people.js';
import { listGroups, newGroup, addMember, saveGroup } from '../data/groups.js';
import { logActivity } from '../data/activity.js';

export async function renderInviteImport(container, _params, query) {
  const code = query.get('d') ?? '';
  const parsed = parseInvite(code);

  if (!parsed.ok) {
    container.innerHTML = `
      <section class="screen">
        <div class="card empty-state">
          ${icon('close')}
          <h2>${t.importInvite.errors[parsed.reason] ?? t.importInvite.errors.unreadable}</h2>
          <a class="btn" href="#/overzicht">${t.common.back}</a>
        </div>
      </section>`;
    return;
  }

  const importId = hashKey(code);
  const existing = (await listGroups()).find((g) => g.imported_from === importId);

  container.innerHTML = `
    <section class="screen wizard">
      <div class="eyebrow">${t.importInvite.title}</div>
      <h1 class="section-gap">${esc(parsed.name)}</h1>
      <p class="sub">${t.importInvite.sub}</p>
      <div class="card list-card section-gap">
        ${parsed.members.map((m) => `
          <div class="list-row">
            ${avatar({ id: m.name, name: m.name })}
            <div class="grow">
              <div>${esc(m.name)}</div>
              <div class="muted small">${transportLabel(m.mode)}</div>
            </div>
            <span class="transport-icon">${transportIcon(m.mode)}</span>
          </div>`).join('')}
      </div>
      <p class="muted small section-gap">${t.importInvite.members(parsed.members.length)} · ${t.importInvite.privacy}</p>
      <div class="flow-actions">
        ${
          existing
            ? `<p class="muted">${t.importInvite.already}</p> <a class="btn btn-primary" href="#/groepen/${existing.id}">${t.importInvite.open}</a>`
            : `<button type="button" class="btn btn-primary btn-large" data-import>${icon('check')} ${t.importInvite.button}</button>`
        }
      </div>
    </section>`;

  container.querySelector('[data-import]')?.addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    const self = await ensureSelf();
    const group = { ...newGroup({ name: parsed.name, owner: self }), imported_from: importId };

    for (const m of parsed.members) {
      const person = newPerson({ name: m.name });
      const near = await nearestAddress({ lat: m.lat, lng: m.lng });
      addLocation(person, {
        label: t.form.defaultLabel,
        place: { address: t.importInvite.nearby(near?.city ?? '?'), lat: m.lat, lng: m.lng },
        transport: m.mode,
      });
      await savePerson(person);
      addMember(group, person.id, 'link');
    }
    await saveGroup(group);
    await logActivity('group', t.activity.importedGroup(group.name, parsed.members.length), '', `#/groepen/${group.id}`);
    showToast(t.importInvite.imported(group.name));
    navigate(`/groepen/${group.id}`);
  });
}
