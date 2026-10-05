// Zakelijk → Team & rechten: who may do what. The demo lets you view the portal as any role.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { showToast } from '../../ui/toast.js';
import { openSheet } from '../../ui/modal.js';
import { inviteUser, OfflineError } from '../services/business-api.js';
import { update } from '../data/store.js';
import { guard } from './guard.js';
import { limit } from '../core/entitlements.js';
import { ROLES } from '../core/roles.js';
import { pageHead, dateLabel } from '../ui/widgets.js';

const b = t.business;
const TONE = { owner: '', admin: 'blue', viewer: 'orange' };

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  const { state, sub } = ctx;
  const max = limit(sub, 'users');
  const full = state.users.length >= max;
  const mayManage = ctx.can('team');
  const mayInvite = ctx.can('invite');

  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.team.eyebrow, b.team.title, b.team.sub(state.users.length, max), mayInvite ? `<button class="btn btn-primary" type="button" data-invite>${b.team.invite}</button>` : '')}
      ${ctx.banner}
      ${full ? `<div class="notice">${b.team.full}</div>` : ''}
      <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>${b.team.cols.name}</th><th>${b.team.cols.email}</th><th>${b.team.cols.role}</th><th>${b.team.cols.active}</th><th></th></tr></thead><tbody>
        ${state.users.map((u) => `<tr><td><strong>${esc(u.name)}</strong>${u.id === ctx.user.id ? ` <small class="muted">(${b.team.you})</small>` : ''}</td><td>${esc(u.email)}</td>
          <td>${mayManage && u.id !== ctx.user.id ? `<select data-role="${u.id}" aria-label="${b.team.cols.role}">${ROLES.map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${b.roles[r]}</option>`).join('')}</select>` : `<span class="plan-pill ${TONE[u.role]}">${b.roles[u.role]}</span>`}</td>
          <td>${u.last_active ? dateLabel(u.last_active, { day: 'numeric', month: 'short' }) : b.team.never}</td>
          <td class="actions">${mayManage && u.id !== ctx.user.id ? `<button class="btn btn-small" type="button" data-remove="${u.id}">${b.team.remove}</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="biz-grid cols-3">${ROLES.map((r) => `<div class="card"><h3>${b.roles[r]}</h3><p class="small muted">${b.roleHelp[r]}</p></div>`).join('')}</div>
      <div class="card"><h2>${b.team.viewAs}</h2><p class="muted small">${b.team.viewAsHint}</p>
        <div class="chips" role="group">${state.users.map((u) => `<button type="button" class="chip" data-as="${u.id}" aria-pressed="${u.id === ctx.user.id}">${esc(u.name.split(' ')[0])} · ${b.roles[u.role]}</button>`).join('')}</div></div>
    </section>`;

  container.querySelectorAll('[data-as]').forEach((el) => el.addEventListener('click', () => {
    update((s) => { s.current_user = el.dataset.as; });
    render(container);
    document.dispatchEvent(new CustomEvent('aether:business'));
  }));
  container.querySelectorAll('[data-role]').forEach((el) => el.addEventListener('change', () => {
    const owners = state.users.filter((u) => u.role === 'owner').length;
    const target = state.users.find((u) => u.id === el.dataset.role);
    if (target.role === 'owner' && el.value !== 'owner' && owners < 2) {
      showToast(b.team.lastOwner);
      render(container);
      return;
    }
    update((s) => { s.users.find((u) => u.id === el.dataset.role).role = el.value; });
  }));
  container.querySelectorAll('[data-remove]').forEach((el) => el.addEventListener('click', () => {
    const target = state.users.find((u) => u.id === el.dataset.remove);
    if (target.role === 'owner' && state.users.filter((u) => u.role === 'owner').length < 2) {
      showToast(b.team.lastOwner);
      return;
    }
    update((s) => { s.users = s.users.filter((u) => u.id !== el.dataset.remove); });
    showToast(b.team.removed);
    render(container);
  }));
  container.querySelector('[data-invite]')?.addEventListener('click', () => (full ? showToast(b.team.full) : openInvite(container)));
}

function openInvite(container) {
  openSheet({
    title: b.team.invite,
    body: `<form class="biz-form" novalidate>
      <label class="field"><span class="field-label">${b.team.inviteName}</span><input name="name" /></label>
      <label class="field"><span class="field-label">${b.team.inviteEmail}</span><input name="email" type="email" /></label>
      <label class="field"><span class="field-label">${b.team.inviteRole}</span><select name="role">${ROLES.filter((r) => r !== 'owner').map((r) => `<option value="${r}">${b.roles[r]}</option>`).join('')}</select></label>
      <div class="sheet-actions"><button class="btn btn-primary" type="submit">${b.team.send}</button></div></form>`,
    setup(el, close) {
      el.querySelector('form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const f = event.target.elements;
        if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value)) {
          showToast(b.venue.invalid);
          return;
        }
        try {
          await inviteUser(f.name.value.trim(), f.email.value.trim(), f.role.value);
          close(true);
          showToast(b.team.invited(f.name.value.trim()));
          render(container);
        } catch (error) {
          if (!(error instanceof OfflineError)) throw error;
          showToast(b.offlineAction);
        }
      });
    },
  });
}
