// Small labels that tell where data came from, and the notice shown when we are offline.

import { t } from '../i18n/nl.js';

// source: 'live' | 'cache' | 'stale' | 'estimate' (see services/routing.js and services/places.js)
export function sourceBadge(source, provider) {
  const text = source === 'estimate' ? t.sources.estimate : `${provider} · ${t.sources[source]}`;
  const good = source === 'live' || source === 'cache';
  return `<span class="badge ${good ? '' : 'badge-demo'}">${text}</span>`;
}

// Notice for when we had to use old or local data.
export const offlineNotice = (source) => (source === 'stale' || source === 'estimate' ? `<p class="notice" role="status">${t.offline.notice}</p>` : '');
