// Small DOM helpers.

// Makes text safe to put inside HTML. Use this for EVERY value a user typed (names, addresses, notes),
// otherwise text like "<b>" would be read as HTML.
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Builds an element from an HTML string (one root element).
export function fromHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// "Anna de Vries" → "AV", "Anna" → "A"
export function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : (parts[0]?.[0] ?? '?');
  return letters.toUpperCase();
}

// Same name → same neon hue, so a person keeps their color everywhere.
export function hueFor(text) {
  let hash = 0;
  for (const char of String(text)) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function avatar(person, size = 40) {
  const hue = hueFor(person.id ?? person.name);
  return `<span class="avatar" style="--size:${size}px;--hue:${hue}" aria-hidden="true">${esc(initials(person.name))}</span>`;
}
