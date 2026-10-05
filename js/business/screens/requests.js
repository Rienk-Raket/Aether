// Zakelijk → Aanvragen: reservation requests from groups. Confirming or declining needs a
// connection (the answer is "sent" to the group through the fictional service).

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { showToast } from '../../ui/toast.js';
import { answerRequest, OfflineError } from '../services/business-api.js';
import { guard, noRight } from './guard.js';
import { can, limit } from '../core/entitlements.js';
import { pageHead, statusPill, lockedFeature, dateTimeLabel } from '../ui/widgets.js';

const b = t.business;
const TONE = { new: 'wait', confirmed: 'ok', declined: 'bad' };
let tab = 'new';

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  if (!ctx.can('requests')) {
    container.innerHTML = noRight();
    return;
  }
  const { requests } = ctx.state;
  const fresh = requests.filter((r) => r.status === 'new').length;

  if (!can(ctx.sub, 'requests')) {
    container.innerHTML = `<section class="screen">${pageHead(b.requests.eyebrow, b.requests.title)}${ctx.banner}${lockedFeature(b.requests.lockedTitle, 'requests', exampleTable())}</section>`;
    return;
  }

  const max = limit(ctx.sub, 'requests');
  const used = requests.filter((r) => r.status !== 'declined').length;
  const rows = requests.filter((r) => r.status === tab).sort((a, c) => new Date(a.datetime) - new Date(c.datetime));
  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.requests.eyebrow, b.requests.title, b.requests.sub(fresh))}
      ${ctx.banner}
      ${used > max ? `<div class="notice">${b.requests.limitSoft(used, max)} <a href="#/zakelijk/abonnement">${b.nav.subscription}</a></div>` : ''}
      <div class="chips biz-toolbar" role="group">${Object.keys(b.requests.tabs).map((k) => `<button type="button" class="chip" data-tab="${k}" aria-pressed="${k === tab}">${b.requests.tabs[k]} · ${requests.filter((r) => r.status === k).length}</button>`).join('')}</div>
      <div class="card">${rows.length ? table(rows, ctx.can('requests')) : `<p class="muted">${b.requests.empty}</p>`}</div>
      <p class="muted small">${b.requests.privacy}</p>
    </section>`;

  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => ((tab = el.dataset.tab), render(container))));
  container.querySelectorAll('[data-answer]').forEach((el) =>
    el.addEventListener('click', async () => {
      el.disabled = true;
      try {
        await answerRequest(el.dataset.id, el.dataset.answer);
        showToast(el.dataset.answer === 'confirmed' ? b.requests.confirmed : b.requests.declined);
        render(container);
      } catch (error) {
        el.disabled = false;
        if (!(error instanceof OfflineError)) throw error;
        showToast(b.offlineAction);
      }
    }),
  );
}

function table(rows) {
  const c = b.requests.cols;
  return `<div class="table-wrap"><table class="table"><thead><tr><th>${c.group}</th><th>${c.when}</th><th>${c.people}</th><th>${c.wishes}</th><th>${c.fairness}</th><th>${c.status}</th><th></th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><strong>${esc(r.group_name)}</strong><br><small class="muted">${esc(b.requests.by(r.requested_by))}</small></td><td>${esc(dateTimeLabel(r.datetime))}</td><td class="mono">${r.people}</td>
      <td>${r.wishes.length ? r.wishes.map((w) => esc(b.requests.wishes[w] ?? w)).join(', ') : b.requests.none}</td><td class="mono">${r.fairness.toFixed(2).replace('.', ',')}</td>
      <td>${statusPill(b.requests.statuses[r.status], TONE[r.status])}</td>
      <td class="actions">${r.status === 'new' ? `<button class="btn btn-small btn-primary" type="button" data-answer="confirmed" data-id="${r.id}">${b.requests.confirm}</button> <button class="btn btn-small" type="button" data-answer="declined" data-id="${r.id}">${b.requests.decline}</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}

const exampleTable = () => table([{ id: 'x', group_name: 'Vrijdagborrel', requested_by: 'Anna', datetime: new Date().toISOString(), people: 6, wishes: ['vegetarian'], fairness: 0.91, status: 'new' }]);
