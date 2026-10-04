import { describe, it, expect } from 'vitest';
import { makeReference, partnerUrl, parseReturn, clampPersons, cancelPolicy, shareText } from '../js/core/booking.js';

const partners = ['tafelaar', 'overnachter', 'direct'];

describe('makeReference', () => {
  it('is stable and looks like a booking number', () => {
    expect(makeReference('tafelaar', 'abc')).toBe(makeReference('tafelaar', 'abc'));
    expect(makeReference('tafelaar', 'abc')).toMatch(/^TAF-[0-9A-Z]{5}$/);
  });
  it('differs per appointment and partner', () => {
    expect(makeReference('tafelaar', 'abc')).not.toBe(makeReference('tafelaar', 'abd'));
    expect(makeReference('tafelaar', 'abc').slice(4)).not.toBe(makeReference('overnachter', 'abc').slice(4));
  });
});

describe('clampPersons', () => {
  it('keeps the number between 1 and 30', () => {
    expect(clampPersons(0)).toBe(1);
    expect(clampPersons(99)).toBe(30);
    expect(clampPersons('6')).toBe(6);
    expect(clampPersons('abc')).toBe(1);
  });
});

describe('partnerUrl', () => {
  it('points to the partner page and carries the details', () => {
    const url = partnerUrl('tafelaar', { appointmentId: 'a1', venueName: 'Keuken Kade', startIso: '2026-10-09T15:00:00.000Z', persons: 5, requests: 'Raam' });
    expect(url.startsWith('partners/tafelaar.html#')).toBe(true);
    const query = new URLSearchParams(url.split('#')[1]);
    expect(query.get('plek')).toBe('Keuken Kade');
    expect(query.get('n')).toBe('5');
    expect(query.get('ref')).toBe(makeReference('tafelaar', 'a1'));
  });
});

describe('parseReturn', () => {
  const good = () => new URLSearchParams({ afspraak: 'a1', partner: 'tafelaar', ref: makeReference('tafelaar', 'a1'), n: '4', wens: 'Raam' });

  it('reads what a partner page sends back', () => {
    expect(parseReturn(good(), partners)).toEqual({ appointmentId: 'a1', partner: 'tafelaar', reference: makeReference('tafelaar', 'a1'), persons: 4, requests: 'Raam' });
  });
  it('rejects unknown partners, wrong references and missing data', () => {
    const unknown = good();
    unknown.set('partner', 'nepbank');
    expect(parseReturn(unknown, partners)).toBeNull();
    const wrong = good();
    wrong.set('ref', 'TAF-00000');
    expect(parseReturn(wrong, partners)).toBeNull();
    expect(parseReturn(new URLSearchParams(), partners)).toBeNull();
  });
});

describe('cancelPolicy', () => {
  it('has a policy for every partner, and a safe default', () => {
    expect(cancelPolicy('tafelaar')).toBe('free24');
    expect(cancelPolicy('onbekend')).toBe('contact');
  });
});

describe('shareText', () => {
  it('lists place, time, address and reference', () => {
    const text = shareText({ groupName: 'Borrel', venueName: 'Keuken Kade', address: 'Duinroosstraat 78', startText: 'vr 9 okt 17:00', persons: 5, partnerName: 'Tafelaar', reference: 'TAF-12345' });
    expect(text.split('\n')).toHaveLength(4);
    expect(text).toContain('Keuken Kade');
    expect(text).toContain('TAF-12345');
  });
});
