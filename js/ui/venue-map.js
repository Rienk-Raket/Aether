// "Zakenkaart": a geographically correct map of the venues around the selected area.
// Each venue is a colored marker (color = kind of business); tapping one selects it.

import { createProjection, spreadPoints } from '../core/projection.js';
import { esc } from './dom.js';
import { iconPath } from './icons.js';
import { t } from '../i18n/nl.js';
import { VENUE_TYPES } from '../core/venues.js';

const WIDTH = 400;
const HEIGHT = 280;

// area: { name, lat, lng }; venues: list with distance_km; selectedId: id or null
export function renderVenueMap(container, { area, venues, selectedId, radiusKm, onSelect }) {
  if (!venues.length) {
    container.innerHTML = '';
    return;
  }

  const project = createProjection([area, ...venues], { width: WIDTH, height: HEIGHT, padding: 30 });
  const centre = project(area);
  // Venues on the same street would hide each other: nudge them apart a little.
  const positions = spreadPoints(venues.map(project), 24, { width: WIDTH, height: HEIGHT, margin: 18 });

  const markers = venues
    .map((v, i) => {
      const { x, y } = positions[i];
      const selected = v.id === selectedId;
      return `
        <g class="vm-marker ${v.type} ${selected ? 'selected' : ''}" data-venue="${esc(v.id)}" role="button" tabindex="0"
           aria-label="${esc(t.venueMap.label(v.name, t.placeTypes[v.type]))}">
          <circle class="halo" cx="${x}" cy="${y}" r="17" />
          <circle class="dot" cx="${x}" cy="${y}" r="11" />
          <g class="glyph" transform="translate(${x - 7} ${y - 7}) scale(0.58)">${iconPath(v.type)}</g>
          ${selected ? `<text x="${x}" y="${y - 20}">${esc(v.name)}</text>` : ''}
        </g>`;
    })
    .join('');

  const legend = VENUE_TYPES.filter((type) => venues.some((v) => v.type === type))
    .map((type) => `<span class="vm-legend ${type}"><i></i>${t.placeTypes[type]}</span>`)
    .join('');

  container.innerHTML = `
    <div class="map-wrap">
      <svg class="map2d" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="group" aria-label="${esc(t.venueMap.mapLabel(area.name))}">
        <g class="grid">${gridLines()}</g>
        <g class="vm-centre">
          <circle cx="${centre.x}" cy="${centre.y}" r="26" />
          <path d="M${centre.x} ${centre.y - 7} l7 7 l-7 7 l-7 -7 z" />
          <text x="${centre.x}" y="${centre.y + 42}">${esc(t.venueMap.centre(area.name))}</text>
        </g>
        ${markers}
      </svg>
    </div>
    <div class="vm-legends">${legend}</div>
    <p class="map-legend">${t.venueMap.legend(radiusKm)}</p>`;

  container.querySelectorAll('[data-venue]').forEach((el) => {
    const select = () => onSelect?.(el.dataset.venue);
    el.addEventListener('click', select);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
  });
}

function gridLines() {
  const lines = [];
  for (let x = 20; x < WIDTH; x += 40) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" />`);
  for (let y = 20; y < HEIGHT; y += 40) lines.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" />`);
  return lines.join('');
}
