// A generated "photo" for a fictional venue: colors from the venue data, with a symbol for its
// type. No real photos are used or loaded.

import { iconPath } from './icons.js';
import { esc } from './dom.js';
import { t } from '../i18n/nl.js';

export function venueArt(venue) {
  const [h1, h2, h3, h4] = venue.photos;
  const gradientId = `art-${venue.id.replace(/[^a-z0-9]/gi, '')}`;
  return `
    <svg class="venue-art" viewBox="0 0 320 180" role="img" aria-label="${esc(t.venueCard.artAlt(venue.name))}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${h1} 60% 52%)" />
          <stop offset="1" stop-color="hsl(${h2} 52% 24%)" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#${gradientId})" />
      <circle cx="255" cy="38" r="72" fill="hsl(${h3} 70% 62% / 0.35)" />
      <circle cx="55" cy="155" r="92" fill="hsl(${h4} 65% 45% / 0.35)" />
      <path d="M0 142 Q80 112 160 136 T320 126 V180 H0 Z" fill="rgba(0,0,0,0.25)" />
      <g transform="translate(121 45) scale(3.3)" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${iconPath(venue.type)}</g>
    </svg>`;
}
