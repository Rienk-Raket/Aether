// Aether Zakelijk plans (all amounts are demo amounts, excluding VAT). One source of truth for
// prices, the comparison screen and access control. Nothing here is really charged.

export const PLAN_ORDER = ['basis', 'start', 'growth', 'pro', 'chain'];
export const YEAR_MONTHS = 10; // pay 10 months, use 12

const F = (...names) => Object.fromEntries(names.map((n) => [n, true]));
const NONE = Infinity;

export const PLANS = {
  basis: {
    id: 'basis', monthly: 0, support: 'help',
    features: F('listing', 'profile', 'times_chosen'),
    limits: { requests: 0, users: 1, locations: 1, photos: 3, featured_weeks: 0, history_days: 30 },
  },
  start: {
    id: 'start', monthly: 19, support: 'mail3',
    features: F('listing', 'profile', 'times_chosen', 'requests', 'stats_fairness', 'stats_size'),
    limits: { requests: 25, users: 2, locations: 1, photos: 10, featured_weeks: 0, history_days: 90 },
  },
  growth: {
    id: 'growth', monthly: 49, support: 'mail1',
    features: F('listing', 'profile', 'times_chosen', 'requests', 'stats_fairness', 'stats_size', 'stats_origin', 'stats_why', 'benchmark', 'featured', 'deals'),
    limits: { requests: 100, users: 5, locations: 1, photos: 25, featured_weeks: 4, history_days: 90 },
  },
  pro: {
    id: 'pro', monthly: 99, support: 'chat',
    features: F('listing', 'profile', 'times_chosen', 'requests', 'stats_fairness', 'stats_size', 'stats_origin', 'stats_why', 'benchmark', 'featured', 'deals', 'csv_export', 'api', 'meeting_module'),
    limits: { requests: NONE, users: 15, locations: 3, photos: 50, featured_weeks: 12, history_days: 365 },
  },
  chain: {
    id: 'chain', monthly: 249, custom: true, support: 'manager',
    features: F('listing', 'profile', 'times_chosen', 'requests', 'stats_fairness', 'stats_size', 'stats_origin', 'stats_why', 'benchmark', 'featured', 'deals', 'csv_export', 'api', 'meeting_module', 'pos_link', 'custom_reports'),
    limits: { requests: NONE, users: NONE, locations: NONE, photos: NONE, featured_weeks: 26, history_days: 730 },
  },
};

// Extras that can be added to any paid plan. `unit` is what one purchase adds to the limit.
export const ADDONS = {
  locations: { price: 15, per: 'month', unit: 1 },
  users: { price: 5, per: 'month', unit: 1 },
  featured_weeks: { price: 25, per: 'once', unit: 1 },
  requests: { price: 12, per: 'month', unit: 50 },
};

// What "Gepauzeerd" etc. look like to the visitor (see entitlements.js for what they unlock).
export const STATUSES = ['trial', 'active', 'past_due', 'paused', 'cancelled'];
export const TRIAL_DAYS = 30;

// The cheapest plan that has a feature, e.g. 'benchmark' → 'growth'.
export const requiredPlan = (feature) => PLAN_ORDER.find((id) => PLANS[id].features[feature]);
