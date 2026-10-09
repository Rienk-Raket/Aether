// The "Locaties importeren" card of the Kaart screen: upload the guide (.md) or load the example,
// and the venues are created in the demo. Also lists what has been imported and removes it again.

import { t } from '../i18n/nl.js';
import { esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { showToast } from '../ui/toast.js';
import { simulateLatency, loadBundledText } from '../services/mock/network.js';
import { parseGuide, MAX_GUIDE_BYTES } from '../core/guide-import.js';
import { saveImported, clearImported, importSummary } from '../data/imported-venues.js';

const EXAMPLE = 'data/gids_locaties_nederland.md';
const L = t.landmap;

// places: data/nl-places.json; onChange(): called after venues were added or removed.
export async function mountImport(el, { places, onChange, message = '' }) {
  const summary = await importSummary();
  el.innerHTML = `
    <details class="card landmap-import" ${summary.length && !message ? '' : 'open'}>
      <summary><h2>${L.importTitle}</h2><span class="muted small">${summary.length ? L.importedLine(summary.reduce((n, s) => n + s.count, 0), summary.reduce((n, s) => n + s.cities, 0)) : ''}</span></summary>
      <p class="muted small">${L.importText}</p>
      <div class="drop" data-drop>
        <label class="btn btn-primary" data-choose>${icon('plus')} ${L.importChoose}
          <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" data-file class="visually-hidden" /></label>
        <span class="muted small">${L.importDrop}</span>
        <button type="button" class="btn" data-example>${L.importExample}</button>
      </div>
      <p class="notice" role="status" data-import-status hidden></p>
      <div data-imported>${summary.length
        ? `<h3 class="section-title">${L.importedTitle}</h3>${summary.map((s) => `<div class="card-row imported-row"><span>${esc(L.importedLine(s.count, s.cities))}</span></div>`).join('')}<button type="button" class="btn btn-small btn-danger" data-remove>${icon('trash')} ${L.importRemove}</button>`
        : `<p class="muted small">${L.importNone}</p>`}</div>
    </details>`;

  const status = el.querySelector('[data-import-status]');
  const show = (text, bad = false) => {
    status.hidden = !text;
    status.textContent = text;
    status.classList.toggle('bad', bad);
  };

  async function run(readText, label) {
    show(L.importBusy);
    try {
      const [text] = await Promise.all([readText(), simulateLatency(350, 700)]);
      const result = parseGuide(text, places, 'gids');
      if (!result.venues.length) return show(L.importNothing, true);
      await saveImported(result.venues, label);
      const kinds = Object.entries(result.counts).map(([k, n]) => `${n} ${L.importKindNames[k]}`).join(', ');
      const skipped = result.skipped.length ? ` ${L.importSkipped(result.skipped.join(', '))}` : '';
      showToast(L.importDone(result.venues.length, result.cityCount));
      await onChange(`${L.importDone(result.venues.length, result.cityCount)} (${kinds}).${skipped}`);
    } catch {
      show(L.importError, true);
    }
  }

  function fromFile(file) {
    if (!file) return;
    if (file.size > MAX_GUIDE_BYTES) return show(L.importTooBig, true);
    if (!/\.(md|markdown|txt)$/i.test(file.name) && !file.type.startsWith('text/')) return show(L.importWrongType, true);
    run(() => file.text(), file.name);
  }

  el.querySelector('[data-file]').addEventListener('change', (event) => {
    fromFile(event.target.files[0]);
    event.target.value = '';
  });
  el.querySelector('[data-example]').addEventListener('click', () => run(() => loadBundledText(EXAMPLE), 'Voorbeeldgids'));
  const drop = el.querySelector('[data-drop]');
  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.classList.remove('over');
    fromFile(event.dataTransfer.files[0]);
  });
  el.querySelector('[data-remove]')?.addEventListener('click', async () => {
    const count = await clearImported();
    showToast(L.importRemoved(count));
    await onChange('');
  });
}
