// Startmenu: shown after the opening screen. Continue with the current profile, edit it,
// create a new one or pick another profile that lives on this device.

import { t } from '../i18n/nl.js';
import { icon } from '../ui/icons.js';
import { esc, avatar } from '../ui/dom.js';
import { actionSheet } from '../ui/modal.js';
import { navigate } from '../router.js';
import { activeProfile, listProfiles, switchProfile, profileKind } from '../data/profiles.js';

export async function renderStartMenu(container) {
  const [self, profiles] = await Promise.all([activeProfile(), listProfiles()]);
  const canChoose = profiles.length > 1;

  container.innerHTML = `
    <section class="screen start">
      <div class="eyebrow">${t.start.eyebrow}</div>
      <h1 class="section-gap">${t.start.title(esc(self.name))}</h1>

      <div class="card card-row start-profile">
        <div class="list-row">
          ${avatar(self, 56)}
          <div>
            <div class="card-title">${esc(self.name)}</div>
            <div class="muted small">${t.start.activeProfile}</div>
          </div>
        </div>
      </div>

      <div class="start-actions">
        ${action('continue', 'home', t.start.continueAs(esc(self.name)), t.start.continueHint, 'primary')}
        ${action('edit', 'edit', t.start.edit, t.start.editHint)}
        ${action('create', 'plus', t.start.create, t.start.createHint)}
        ${action('choose', 'users', t.start.choose, t.start.chooseHint(profiles.length), '', !canChoose)}
      </div>
    </section>`;

  const on = (name, handler) => container.querySelector(`[data-action=${name}]`).addEventListener('click', handler);

  on('continue', () => navigate('/overzicht'));
  on('edit', () => navigate('/profiel'));
  on('create', () => navigate('/profiel/nieuw'));
  on('choose', async () => {
    const id = await actionSheet(
      t.start.chooseTitle,
      profiles.map((p) => ({ label: `${p.name} · ${t.deck.kindBadge[profileKind(p)]}${p.id === self.id ? ` (${t.start.activeMark})` : ''}`, value: p.id, icon: profileKind(p) === 'business' ? 'restaurant' : 'user' })),
    );
    if (!id) return;
    await switchProfile(id);
    renderStartMenu(container);
  });
}

function action(name, iconName, title, hint, variant = '', disabled = false) {
  return `
    <button type="button" class="card start-action ${variant}" data-action="${name}" ${disabled ? 'disabled' : ''}>
      <span class="start-icon">${icon(iconName)}</span>
      <span class="start-text"><strong>${title}</strong><small>${hint}</small></span>
      <span class="start-go">${icon('chevron')}</span>
    </button>`;
}
