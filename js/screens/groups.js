// Groups overview: search, sort, group cards, and the "Nieuwe groep" button.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { openGroupForm } from '../ui/group-form.js';
import { demoButtonHtml, wireDemoButtons } from '../ui/demo.js';
import { navigate } from '../router.js';
import { listGroups, newGroup, saveGroup } from '../data/groups.js';
import { listPeople, ensureSelf } from '../data/people.js';

const SORTS = {
  recent: () => 0, // listGroups() already returns most recent first
  members: (a, b) => b.members.length - a.members.length,
  name: (a, b) => a.name.localeCompare(b.name, 'nl'),
};

export async function renderGroups(container) {
  const [groups, people] = await Promise.all([listGroups(), listPeople()]);
  const peopleById = new Map(people.map((p) => [p.id, p]));

  container.innerHTML = `
    <section class="screen">
      <header class="screen-header">
        <h1 class="gradient-text">${t.groups.title}</h1>
      </header>
      ${groups.length ? toolbar() : ''}
      <div data-list></div>
      <button class="fab" type="button" data-new>${icon('plus')}<span>${t.groups.fab}</span></button>
    </section>`;

  const list = container.querySelector('[data-list]');

  const renderList = () => {
    if (!groups.length) {
      list.innerHTML = emptyState();
      wireDemoButtons(list, () => renderGroups(container));
      return;
    }
    const query = container.querySelector('[data-search]').value.trim().toLowerCase();
    const sort = SORTS[container.querySelector('[data-sort]').value];
    const visible = groups.filter((g) => g.name.toLowerCase().includes(query)).sort(sort);

    list.innerHTML = visible.length
      ? visible.map((g) => groupCard(g, peopleById)).join('')
      : `<p class="muted empty-inline">${t.search.noResults(esc(query))}</p>`;
  };

  if (groups.length) {
    container.querySelector('[data-search]').addEventListener('input', renderList);
    container.querySelector('[data-sort]').addEventListener('change', renderList);
  }
  renderList();

  container.querySelector('[data-new]').addEventListener('click', createGroupFlow);
}

// Shared with the new-appointment flow: ask for a name, save, and return the new group.
export async function createGroupFlow({ openAfter = true } = {}) {
  const values = await openGroupForm({ title: t.groups.fab });
  if (!values) return null;
  const group = await saveGroup(newGroup({ ...values, owner: await ensureSelf() }));
  if (openAfter) navigate(`/groepen/${group.id}`);
  return group;
}

function toolbar() {
  return `
    <div class="toolbar">
      <label class="input-icon grow">${icon('search')}
        <input type="search" data-search placeholder="${t.groups.search}" aria-label="${t.groups.search}" />
      </label>
      <select data-sort aria-label="${t.groups.sortLabel}">
        <option value="recent">${t.groups.sortRecent}</option>
        <option value="members">${t.groups.sortMembers}</option>
        <option value="name">${t.groups.sortName}</option>
      </select>
    </div>`;
}

export function groupCard(group, peopleById, href = `#/groepen/${group.id}`) {
  const members = group.members.map((m) => peopleById.get(m.user_id)).filter(Boolean);
  return `
    <a class="card card-link" href="${href}">
      <div class="card-row">
        <div>
          <div class="card-title">${esc(group.name)}</div>
          <div class="muted small">${t.groups.memberCount(members.length)}${group.description ? ` · ${esc(group.description)}` : ''}</div>
        </div>
        <div class="avatar-stack">${members.slice(0, 4).map((p) => avatar(p, 32)).join('')}</div>
      </div>
    </a>`;
}

function emptyState() {
  return `
    <div class="card empty-state">
      ${icon('users')}
      <h2>${t.groups.empty}</h2>
      <p class="muted">${t.groups.emptyHint}</p>
      ${demoButtonHtml()}
    </div>`;
}
