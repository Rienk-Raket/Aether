// Werkomgeving → Plekken: venues that suit the work profile (kind of meeting, group size, budget
// and wishes), best first, with the option to see the same selection on the Kaart.

import { t } from '../../i18n/nl.js';
import { loadingFor } from '../../ui/loading.js';
import { navigate } from '../../router.js';
import { loadWork, hasWorkProfile, OfflineError } from '../data.js';
import { recommend, KIND_TYPES } from '../../core/work-match.js';
import { offlineCard } from '../../business/ui/widgets.js';
import { pageHead, venueRow } from '../ui.js';
import { homeOf } from '../data.js';

const W = t.work;

export async function renderWorkPlaces(container, _params, query) {
  const stop = loadingFor(container, W.places.loading);
  let data;
  try {
    data = await loadWork();
  } catch (error) {
    stop();
    if (!(error instanceof OfflineError)) throw error;
    container.innerHTML = `<section class="screen">${pageHead(W.places.title)}${offlineCard()}</section>`;
    return;
  }
  stop();

  const { profile, work, venues, places } = data;
  const cityOf = (v) => places.find((p) => p.id === v.area_id)?.name;
  const centres = new Map(places.map((p) => [p.id, p]));
  // The visitor may look at another kind of meeting than the profile says.
  const kind = KIND_TYPES[query?.get('soort')] ? query.get('soort') : work?.meeting_kind ?? null;
  const matches = work ? recommend(venues, { ...work, meeting_kind: kind }, { from: homeOf(profile), centreOf: (v) => centres.get(v.area_id) ?? null, limit: 40 }) : [];

  container.innerHTML = `
    <section class="screen work">
      ${pageHead(W.places.title, hasWorkProfile(profile) ? W.places.sub(kind ? W.places.meetingKinds[kind] : '') : W.places.none,
        work ? `<button type="button" class="btn" data-map>${W.places.onMap}</button>` : `<a class="btn btn-primary" href="#/profiel/nieuw?opnieuw=1">${W.setup}</a>`)}
      ${work ? `<div class="chips biz-toolbar" role="group" aria-label="${W.places.kindFilter}">
        ${Object.keys(KIND_TYPES).map((k) => `<button type="button" class="chip" data-kind="${k}" aria-pressed="${k === kind}">${W.places.meetingKinds[k]}</button>`).join('')}</div>` : ''}
      <div class="work-list">${matches.length ? matches.map((m) => venueRow(m, cityOf)).join('') : `<div class="card"><p class="muted">${work ? W.places.empty : W.places.none}</p></div>`}</div>
    </section>`;

  container.querySelectorAll('[data-kind]').forEach((btn) => btn.addEventListener('click', () => navigate(`/werk/plekken?soort=${btn.dataset.kind}`)));
  container.querySelector('[data-map]')?.addEventListener('click', async () => {
    const { openMapWithWork } = await import('../open-map.js');
    openMapWithWork({ ...work, meeting_kind: kind });
    navigate('/kaart');
  });
}
