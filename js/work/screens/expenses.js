// Werkomgeving → Declaraties: appointments with a chosen venue and an estimate of the cost,
// with a CSV export for the bookkeeping. Estimates only: this is a demo.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { showToast } from '../../ui/toast.js';
import { loadWork } from '../data.js';
import { expenseRows, expensesToCsv } from '../../core/work-match.js';
import { pageHead, euro, date } from '../ui.js';

const W = t.work;
const TONE = { confirmed: 'ok', draft: 'wait', pending: 'wait', cancelled: 'bad' };

export async function renderWorkExpenses(container) {
  const { appointments } = await loadWork({ withVenues: false });
  const rows = expenseRows(appointments);
  const total = rows.reduce((s, r) => s + (r.cost ?? 0), 0);

  container.innerHTML = `
    <section class="screen work">
      ${pageHead(W.expenses.title, W.expenses.sub, rows.length ? `<button type="button" class="btn btn-primary" data-export>${icon('share')} ${W.expenses.export}</button>` : '')}
      <div class="card">${rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr>${Object.values(W.expenses.cols).map((c) => `<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${esc(date(r.date))}</td><td><strong>${esc(r.place)}</strong><br><small class="muted">${esc(r.address ?? '')}</small></td><td class="mono">${r.people}</td><td class="mono">${r.cost ? euro(r.cost) : '–'}</td>
            <td><span class="status ${TONE[r.status] ?? 'wait'}">${W.expenses.statuses[r.status] ?? r.status}</span></td><td class="actions"><a class="btn btn-small" href="#/ontdek?afspraak=${r.id}">${W.expenses.open}</a></td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="3"><strong>${W.expenses.total}</strong></td><td class="mono"><strong>${euro(total)}</strong></td><td colspan="2"></td></tr></tfoot></table></div>`
        : `<p class="muted">${W.expenses.empty}</p>`}</div>
      <p class="demo-note">${W.expenses.note}</p>
    </section>`;

  container.querySelector('[data-export]')?.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([expensesToCsv(rows)], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: W.expenses.fileName }).click();
    URL.revokeObjectURL(url);
    showToast(W.expenses.exported);
  });
}
