// "Uitnodigen": share the group as a link and QR code (no server), or invite a simulated person.

import qrcode from '../../vendor/qrcode.js';
import { t } from '../i18n/nl.js';
import { icon } from './icons.js';
import { esc } from './dom.js';
import { openSheet } from './modal.js';
import { showToast } from './toast.js';
import { encodeInvite, inviteUrl, fitsInQr, cleanName } from '../core/invite.js';
import { hashKey } from '../core/hash.js';
import { newPerson, savePerson, defaultLocation } from '../data/people.js';
import { addMember, saveGroup } from '../data/groups.js';
import { logActivity } from '../data/activity.js';

// people: the persons in the group (with their locations). Resolves when the sheet closes.
export function openInviteSheet(group, people) {
  const located = people.filter((p) => defaultLocation(p));
  const members = located.map((p) => {
    const loc = defaultLocation(p);
    return { name: p.name, lat: loc.lat, lng: loc.lng, mode: loc.transport_mode };
  });
  const url = members.length ? inviteUrl(`${location.origin}${location.pathname}`, encodeInvite(group.name, members)) : '';

  return openSheet({
    title: t.invite.title,
    body: `
      <div class="section-title">${t.invite.shareTitle}</div>
      ${url ? shareView(url) : `<p class="notice">${t.invite.noMembers}</p>`}
      <div class="section-title section-gap">${t.invite.demoTitle}</div>
      <form class="form" data-demo-invite novalidate>
        <p class="muted small">${t.invite.demoHint}</p>
        <label class="field">
          <span class="field-label">${t.invite.demoName}</span>
          <input name="name" maxlength="40" autocomplete="off" placeholder="${t.form.namePlaceholder}" />
        </label>
        <p class="form-error" role="alert" data-error></p>
        <button type="submit" class="btn btn-primary">${icon('group')} ${t.invite.demoSubmit}</button>
      </form>`,
    setup(el, close) {
      el.querySelector('[data-copy]')?.addEventListener('click', () => copyLink(url));
      el.querySelector('[data-share]')?.addEventListener('click', () => navigator.share({ title: group.name, url }).catch(() => {}));
      el.querySelector('[data-link]')?.addEventListener('focus', (event) => event.target.select());

      el.querySelector('[data-demo-invite]').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = cleanName(event.target.elements.name.value);
        if (!name) {
          el.querySelector('[data-error]').textContent = t.form.nameRequired;
          return;
        }
        await inviteSimulated(group, name);
        showToast(t.invite.demoInvited(name));
        close(true);
      });
    },
  });
}

function shareView(url) {
  const qr = fitsInQr(url) ? makeQr(url) : '';
  return `
    ${qr ? `<div class="qr-box" role="img" aria-label="${t.invite.qrAlt}">${qr}</div>` : `<p class="notice">${t.invite.tooBig}</p>`}
    <label class="field">
      <span class="field-label">${t.invite.linkLabel}</span>
      <input readonly value="${esc(url)}" data-link />
    </label>
    <div class="hero-buttons">
      <button type="button" class="btn" data-copy>${icon('copy')} ${t.invite.copy}</button>
      ${navigator.share ? `<button type="button" class="btn" data-share>${icon('share')} ${t.invite.share}</button>` : ''}
    </div>
    <p class="muted small">${t.invite.shareHint}</p>`;
}

function makeQr(url) {
  const qr = qrcode(0, 'L');
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast(t.invite.copied);
  } catch {
    showToast(t.invite.copyFailed);
  }
}

// Adds a member without a start location; services/simulation.js fills it in after a few seconds.
async function inviteSimulated(group, name) {
  const person = { ...newPerson({ name }), demo: true };
  person.pending_until = Date.now() + 6000 + (parseInt(hashKey(`wait:${name}`), 36) % 8) * 1000;
  await savePerson(person);
  addMember(group, person.id, 'link');
  await saveGroup(group);
  await logActivity('invite', t.activity.invited(name), group.name, `#/groepen/${group.id}`);
  document.dispatchEvent(new CustomEvent('aether:data'));
}
