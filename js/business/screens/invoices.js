// Zakelijk → Facturen: fictional invoices built from the subscription. "PDF" opens a printable page.

import { t } from '../../i18n/nl.js';
import { esc } from '../../ui/dom.js';
import { guard, noRight } from './guard.js';
import { buildInvoices } from '../core/billing.js';
import { pageHead, statusPill, dateLabel } from '../ui/widgets.js';

const b = t.business;
const TONE = { paid: 'ok', planned: 'wait', open: 'bad' };

export async function render(container) {
  const ctx = guard();
  if (!ctx) return;
  if (!ctx.can('invoices')) {
    container.innerHTML = noRight();
    return;
  }
  const { sub, state } = ctx;
  const invoices = buildInvoices(sub);
  const bill = state.business.billing;
  const describe = (inv) => (b.invoices.desc[inv.kind] ?? (inv.kind === 'renewal' ? b.invoices.descRenewal : b.invoices.descPeriod)(b.plans[sub.plan], sub.billing_period));

  container.innerHTML = `
    <section class="screen">
      ${pageHead(b.invoices.eyebrow, b.invoices.title, b.invoices.sub)}
      ${ctx.banner}
      <div class="biz-grid cols-2">
        <div class="card">${invoices.length ? `<div class="table-wrap"><table class="table"><thead><tr>${Object.values(b.invoices.cols).map((c) => `<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>
          ${invoices.map((inv, i) => `<tr><td class="mono">${inv.number}</td><td>${dateLabel(inv.issued_at)}</td><td>${esc(describe(inv))}</td><td class="mono">${b.eur(inv.total)}</td><td>${statusPill(b.invoices.statuses[inv.status], TONE[inv.status])}</td><td class="actions">${inv.status === 'paid' ? `<button class="btn btn-small" type="button" data-pdf="${i}">${b.invoices.pdf}</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>` : `<p class="muted">${b.invoices.empty}</p>`}</div>
        <div class="biz-stack">
          <div class="card"><h2>${b.invoices.detailsTitle}</h2><p class="small muted">${esc(bill.company)}<br>KvK ${esc(bill.kvk)} · btw ${esc(bill.vat)}<br>${esc(bill.email)}</p></div>
          <div class="card"><h2>${b.invoices.methodTitle}</h2><p class="small muted">${b.invoices.method}<br>${b.invoices.iban}</p></div>
        </div>
      </div>
      <p class="demo-note">${b.demoNote}</p>
    </section>`;

  container.querySelectorAll('[data-pdf]').forEach((el) =>
    el.addEventListener('click', () => {
      const inv = invoices[Number(el.dataset.pdf)];
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(b.invoices.pdfTitle(inv.number))}</title><body style="font:16px/1.5 sans-serif;max-width:560px;margin:40px auto"><h1>${esc(b.invoices.pdfTitle(inv.number))}</h1><p>${esc(state.business.name)} · ${esc(dateLabel(inv.issued_at))}</p><p>${esc(describe(inv))}</p><p><strong>${esc(b.invoices.vatLine(inv.amount_ex_vat, inv.vat, inv.total))}</strong></p><p style="color:#b26a00">${esc(b.invoices.pdfNote)}</p><script>print()</script>`);
      win.document.close();
    }),
  );
}
