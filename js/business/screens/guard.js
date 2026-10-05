// Shared start of every business screen: is there a business account, who is looking, and
// what is the situation of the subscription (trial, late, paused, cancelled)?

import { t } from '../../i18n/nl.js';
import { navigate } from '../../router.js';
import { getState, currentUser } from '../data/store.js';
import { effectivePlan } from '../core/entitlements.js';
import { roleCan } from '../core/roles.js';
import { dateLabel } from '../ui/widgets.js';
import { esc } from '../../ui/dom.js';

const b = t.business;

// Returns { state, sub, plan, user, can(action), banner } or null (after sending the visitor to sign-up).
export function guard() {
  const state = getState();
  if (!state) {
    navigate('/zakelijk/aansluiten');
    return null;
  }
  const user = currentUser(state);
  return { state, sub: state.subscription, plan: effectivePlan(state.subscription), user, can: (action) => roleCan(user.role, action), banner: banner(state.subscription) };
}

function banner(sub) {
  let text = '';
  if (sub.status === 'trial') {
    const days = Math.max(0, Math.ceil((new Date(sub.trial_ends_at) - new Date()) / 86400000));
    text = days > 0 ? b.trialBanner(days) : '';
  } else if (sub.status === 'past_due') text = b.pastDueBanner;
  else if (sub.status === 'paused') text = b.pausedBanner;
  else if (sub.status === 'cancelled') text = b.cancelledBanner(dateLabel(sub.cancel_at));
  return text ? `<div class="notice biz-banner" role="status">${esc(text)} <a href="#/zakelijk/abonnement">${b.nav.subscription}</a></div>` : '';
}

export const noRight = () => `<section class="screen"><div class="card"><p>${b.noRight}</p></div></section>`;
