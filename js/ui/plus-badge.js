// "Plus" is only a demo label: the feature works for everyone, nothing is paid.

import { t } from '../i18n/nl.js';

export const plusBadge = () => `<span class="badge badge-demo plus-badge" title="${t.plus.demoHint}">${t.plus.label} · demo</span>`;
