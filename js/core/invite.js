// Inviting people without a server: the group travels inside a link (and a QR code of that link).
// The part after "#" never goes to a server, so the data stays between the two phones.
//
// Payload (before encoding): { v: 1, n: "Vrijdagborrel", m: [["Anna", 52.37301, 4.89245, 0], ...] }
// where each member is [name, lat, lng, transport index].

import { TRANSPORT_MODES } from './travel-estimate.js';

const MODES = Object.keys(TRANSPORT_MODES); // walk, bike, car, transit
export const MAX_MEMBERS = 30;
export const MAX_NAME_LENGTH = 40;
const MAX_PAYLOAD_CHARS = 6000;
// Phone cameras read QR codes reliably up to roughly this many characters.
export const QR_MAX_CHARS = 1000;

// Names come from other people: remove control characters, trim, and cut to length.
const isControlChar = (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127;

export const cleanName = (value) =>
  [...String(value)]
    .filter((char) => !isControlChar(char))
    .join('')
    .trim()
    .slice(0, MAX_NAME_LENGTH);

const toBase64Url = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const fromBase64Url = (code) => {
  const binary = atob(code.replaceAll('-', '+').replaceAll('_', '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

// members: [{ name, lat, lng, mode }]
export function encodeInvite(groupName, members) {
  const payload = {
    v: 1,
    n: cleanName(groupName),
    m: members.map((m) => [cleanName(m.name), Number(m.lat.toFixed(5)), Number(m.lng.toFixed(5)), MODES.indexOf(m.mode)]),
  };
  return toBase64Url(JSON.stringify(payload));
}

// Returns { ok: true, name, members: [{ name, lat, lng, mode }] } or { ok: false, reason }.
// Everything is checked: the text may come from anybody.
export function parseInvite(code) {
  if (typeof code !== 'string' || code.length === 0) return { ok: false, reason: 'empty' };
  if (code.length > MAX_PAYLOAD_CHARS) return { ok: false, reason: 'too_large' };

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(code));
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  if (!payload || payload.v !== 1) return { ok: false, reason: 'version' };

  const name = cleanName(payload.n ?? '');
  if (!name) return { ok: false, reason: 'no_name' };
  if (!Array.isArray(payload.m) || payload.m.length < 1 || payload.m.length > MAX_MEMBERS) return { ok: false, reason: 'members' };

  const members = [];
  for (const entry of payload.m) {
    if (!Array.isArray(entry) || entry.length !== 4) return { ok: false, reason: 'members' };
    const [memberName, lat, lng, modeIndex] = entry;
    const cleaned = typeof memberName === 'string' ? cleanName(memberName) : '';
    const validPlace = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (!cleaned || !validPlace || !Number.isInteger(modeIndex) || !MODES[modeIndex]) return { ok: false, reason: 'members' };
    members.push({ name: cleaned, lat, lng, mode: MODES[modeIndex] });
  }
  return { ok: true, name, members };
}

// base: the app's own address without "#", for example "https://example.org/Aether/".
export const inviteUrl = (base, code) => `${base}#/uitnodiging?d=${code}`;
export const fitsInQr = (url) => url.length <= QR_MAX_CHARS;
