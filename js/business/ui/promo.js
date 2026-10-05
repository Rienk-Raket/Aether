// Card on the main overview that leads to Aether Zakelijk (the business portal).

import { t } from '../../i18n/nl.js';
import { icon } from '../../ui/icons.js';

export const businessPromoHtml = () => `
  <aside class="card business-promo" aria-labelledby="biz-promo-title">
    <div class="card-row">
      <div>
        <div class="eyebrow">${t.business.promo.eyebrow}</div>
        <h2 id="biz-promo-title" class="section-gap">${t.business.promo.title}</h2>
        <p class="muted">${t.business.promo.text}</p>
      </div>
      <a class="btn btn-primary" href="#/zakelijk">${icon('restaurant')} ${t.business.promo.action}</a>
    </div>
  </aside>`;
