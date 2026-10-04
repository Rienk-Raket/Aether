// Flat 2D map (SVG): participants as glowing avatars, candidate places as markers sized by
// fairness. Lines show everyone's trip to the selected place.

import { createProjection } from '../core/projection.js';
import { esc, initials, hueFor } from './dom.js';
import { t } from '../i18n/nl.js';

const WIDTH = 400;
const HEIGHT = 280;

// participants: [{ id, name, location }]
// candidates: ranked best-first, each { id, name, lat, lng, fairness }
export function renderMap2d(container, { participants, candidates, selectedId, onSelect }) {
  const project = createProjection([...participants.map((p) => p.location), ...candidates], {
    width: WIDTH,
    height: HEIGHT,
    padding: 30,
  });
  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];
  const target = selected && project(selected);

  const grid = [];
  for (let x = 20; x < WIDTH; x += 40) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" />`);
  for (let y = 20; y < HEIGHT; y += 40) grid.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" />`);

  const lines = target
    ? participants
        .map((p) => {
          const from = project(p.location);
          return `<line class="trip" style="--hue:${hueFor(p.id)}" x1="${from.x}" y1="${from.y}" x2="${target.x}" y2="${target.y}" />`;
        })
        .join('')
    : '';

  // Draw the best places last so they sit on top.
  const markers = [...candidates]
    .reverse()
    .map((c) => {
      const { x, y } = project(c);
      const rank = candidates.indexOf(c) + 1;
      const r = 4 + 8 * c.fairness;
      const isSelected = c.id === selected?.id;
      return `
        <g class="marker ${isSelected ? 'selected' : ''} ${rank === 1 ? 'best' : ''}" data-candidate="${esc(c.id)}"
           role="button" tabindex="0" aria-label="${esc(t.results.markerLabel(rank, c.name))}">
          <circle class="halo" cx="${x}" cy="${y}" r="${r + 6}" />
          <circle class="dot" cx="${x}" cy="${y}" r="${r}" />
          ${rank === 1 || isSelected ? `<text x="${x}" y="${y - r - 6}">${esc(c.name)}</text>` : ''}
        </g>`;
    })
    .join('');

  const people = participants
    .map((p) => {
      const { x, y } = project(p.location);
      return `
        <g class="person" style="--hue:${hueFor(p.id)}">
          <circle cx="${x}" cy="${y}" r="11" />
          <text x="${x}" y="${y + 4}">${esc(initials(p.name))}</text>
        </g>`;
    })
    .join('');

  container.innerHTML = `
    <div class="map-wrap">
      <svg class="map2d" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${t.results.mapLabel}">
        <g class="grid">${grid.join('')}</g>
        <g>${lines}</g>
        <g>${markers}</g>
        <g>${people}</g>
      </svg>
    </div>
    <p class="map-legend"><span class="legend-dot"></span>${selected ? esc(t.results.legend(selected.name, participants.length)) : ''}</p>`;

  container.querySelectorAll('[data-candidate]').forEach((el) => {
    const select = () => onSelect?.(el.dataset.candidate);
    el.addEventListener('click', select);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
  });
}
