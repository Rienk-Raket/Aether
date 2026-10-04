// Shows what the resolved requirements of an appointment come down to, as two lists of chips:
// requirements (venues that do not fit are removed) and wishes (only change the order).

import { t } from '../i18n/nl.js';
import { esc } from './dom.js';
import { hasRequirements } from '../core/requirements.js';

const WISH_LABELS = { terrace: 'terrace', kid_friendly: 'kidFriendly', dog_friendly: 'dogFriendly', quiet: 'quiet' };
const wishLabel = (key) => t.profile.dining[WISH_LABELS[key]];
const dietLabel = (diet) => t.profile.dining.dietOptions[diet];

// → { hard: [{ label, source }], soft: [{ label }] }
export function describeRequirements(req) {
  const { hard, soft, sources } = req;
  return {
    hard: [
      ...hard.diets.map((d) => ({ label: dietLabel(d), source: sources.diets })),
      ...hard.allergies.map((a) => ({ label: `${t.profile.dining.allergies}: ${t.profile.dining.allergyOptions[a]}`, source: sources.allergies })),
      ...hard.accessibility.map((a) => ({ label: t.profile.travel.accessibilityOptions[a], source: sources.accessibility })),
      ...Object.keys(hard.wishes).map((k) => ({ label: wishLabel(k), source: sources[k] })),
    ],
    soft: [
      ...soft.diets.map((d) => ({ label: dietLabel(d) })),
      ...Object.keys(soft.cuisines).map((c) => ({ label: c })),
      ...Object.keys(soft.wishes).map((k) => ({ label: wishLabel(k) })),
      ...(soft.maxPrice ? [{ label: t.apptPrefs.price(soft.maxPrice) }] : []),
    ],
  };
}

const chip = ({ label, source }) =>
  `<span class="badge req-chip">${esc(label)}${source ? ` <small>· ${t.apptPrefs.from[source]}</small>` : ''}</span>`;

export function requirementsSummary(req) {
  if (!hasRequirements(req) && !req.soft.maxPrice) return `<p class="muted">${t.apptPrefs.summaryNone}</p>`;
  const { hard, soft } = describeRequirements(req);
  const group = (title, items) => (items.length ? `<div class="req-group"><strong>${title}</strong><div class="chips">${items.map(chip).join('')}</div></div>` : '');
  return group(t.apptPrefs.requirements, hard) + group(t.apptPrefs.wishes, soft);
}

export const ruleTitle = (rule) => t.apptPrefs.rules[rule].title;
