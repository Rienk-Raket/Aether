// Rules for reserving at a venue through one of the (fictional) booking sites in partners/.
// Pure functions: building the link to the partner page, reading what comes back, a reference
// number, the cancellation policy and the text used when sharing the booking.

export const MIN_PERSONS = 1;
export const MAX_PERSONS = 30;
export const MAX_REQUEST_LENGTH = 200;

// Cancellation policy per partner (the texts are in the booking strings of js/i18n).
const POLICIES = { tafelaar: 'free24', overnachter: 'free48', zaalmeester: 'free72', samenzijn: 'quote', direct: 'contact' };
export const cancelPolicy = (partnerId) => POLICIES[partnerId] ?? 'contact';

export const clampPersons = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(MAX_PERSONS, Math.max(MIN_PERSONS, n)) : MIN_PERSONS;
};

// Same appointment and partner always give the same reference, e.g. "TAF-7K2Q9".
export function makeReference(partnerId, appointmentId) {
  let hash = 7;
  for (const char of `${partnerId}:${appointmentId}`) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return `${partnerId.slice(0, 3).toUpperCase()}-${hash.toString(36).toUpperCase().padStart(5, '0').slice(-5)}`;
}

// Link to the fictional partner page (a static file, relative to the app).
export function partnerUrl(partnerId, { appointmentId, venueName, startIso, persons, requests }) {
  const query = new URLSearchParams({
    afspraak: appointmentId,
    plek: venueName,
    start: startIso,
    n: String(clampPersons(persons)),
    wens: String(requests ?? '').slice(0, MAX_REQUEST_LENGTH),
    ref: makeReference(partnerId, appointmentId),
  });
  return `partners/${encodeURIComponent(partnerId)}.html?${query}`;
}

// What the partner page sends back: #/bevestigd?afspraak=…&partner=…&ref=…&n=…&wens=…
// Returns null when something is missing or looks wrong.
export function parseReturn(query, knownPartnerIds) {
  const partner = query.get('partner');
  const appointmentId = query.get('afspraak');
  const reference = query.get('ref');
  if (!partner || !appointmentId || !reference || !knownPartnerIds.includes(partner)) return null;
  if (reference !== makeReference(partner, appointmentId)) return null; // not produced by our partner pages
  return {
    appointmentId,
    partner,
    reference,
    persons: clampPersons(query.get('n')),
    requests: String(query.get('wens') ?? '').slice(0, MAX_REQUEST_LENGTH),
  };
}

// The text that is shared with the group: plain, readable in any messaging app.
export function shareText({ groupName, venueName, address, startText, persons, partnerName, reference }) {
  return [
    `${groupName}: ${venueName}`,
    `${startText} · ${persons} personen`,
    address,
    `Gereserveerd via ${partnerName} (ref. ${reference})`,
  ].join('\n');
}
