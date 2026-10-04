// Activiteit: a feed of what happened in the app (newest first). Opening it marks everything as seen.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { timeAgo } from '../core/dates.js';
import { listActivity, lastSeen, markActivitySeen } from '../data/activity.js';

const TYPE_ICONS = {
  group: ['group', ''],
  member: ['users', ''],
  appointment: ['calendar', 'blue'],
  place: ['pin', ''],
  demo: ['leaf', 'orange'],
  system: ['settings', 'orange'],
};

export async function renderActivity(container) {
  const items = await listActivity();
  const seen = lastSeen();

  container.innerHTML = `
    <section class="screen">
      <div class="eyebrow">${t.nav.activity}</div>
      <h1 class="section-gap">${t.activity.title}</h1>
      <p class="sub">${t.activity.sub}</p>
      <div class="card section-gap">
        ${
          items.length
            ? items.map((item) => feedItem(item, item.at > seen)).join('')
            : `<div class="empty-state">${icon('activity')}<h2>${t.activity.empty}</h2><p class="muted">${t.activity.emptyHint}</p></div>`
        }
      </div>
    </section>`;

  markActivitySeen();
}

function feedItem(item, isNew) {
  const [iconName, tone] = TYPE_ICONS[item.type] ?? TYPE_ICONS.system;
  const inner = `
    <span class="feed-icon ${tone}">${icon(iconName)}</span>
    <span class="grow">
      <span class="feed-title">${esc(item.title)}</span><br />
      <span class="muted small">${item.detail ? `${esc(item.detail)} · ` : ''}${esc(timeAgo(item.at))}</span>
    </span>
    ${isNew ? `<span class="feed-new" title="${t.activity.new}"></span><span class="visually-hidden">${t.activity.new}</span>` : ''}`;
  return item.href ? `<a class="feed-item" href="${esc(item.href)}">${inner}</a>` : `<div class="feed-item">${inner}</div>`;
}
