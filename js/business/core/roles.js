// What each role in a venue's team may do (see docs/zakelijk spec §4).

export const ROLES = ['owner', 'admin', 'viewer'];

const ALLOWED = {
  owner: ['profile', 'requests', 'stats', 'team', 'subscription', 'invoices'],
  admin: ['profile', 'requests', 'stats', 'invite'],
  viewer: ['stats'],
};

export const roleCan = (role, action) => (ALLOWED[role] ?? []).includes(action);
