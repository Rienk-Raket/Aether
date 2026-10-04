import { describe, it, expect } from 'vitest';
import { buildIcs, icsDate, icsText, foldLine } from '../js/core/ics.js';

const event = {
  id: 'abc-123',
  title: 'Vrijdagborrel, bij Keuken Kade',
  start: new Date(Date.UTC(2026, 9, 9, 15, 0, 0)),
  durationMinutes: 90,
  location: 'Duinroosstraat 78, Amsterdam',
  description: 'Met Anna; Bram\nTot dan!',
};
const now = new Date(Date.UTC(2026, 9, 5, 12, 0, 0));

describe('icsDate', () => {
  it('formats UTC dates the way calendars expect', () => {
    expect(icsDate(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe('20260102T030405Z');
  });
});

describe('icsText', () => {
  it('escapes special characters', () => {
    expect(icsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:kort')).toBe('SUMMARY:kort');
  });
  it('splits long lines into pieces of at most 75 bytes', () => {
    const folded = foldLine(`DESCRIPTION:${'é'.repeat(100)}`);
    const pieces = folded.split('\r\n');
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) expect(new TextEncoder().encode(piece).length).toBeLessThanOrEqual(75);
    expect(pieces.slice(1).every((p) => p.startsWith(' '))).toBe(true);
    expect(folded.replaceAll('\r\n ', '')).toBe(`DESCRIPTION:${'é'.repeat(100)}`);
  });
});

describe('buildIcs', () => {
  const text = buildIcs(event, [60, 1440], now);

  it('is a valid calendar with CRLF line endings', () => {
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(text.replaceAll('\r\n', '').includes('\n')).toBe(false);
  });

  it('has start, end and details', () => {
    expect(text).toContain('DTSTART:20261009T150000Z');
    expect(text).toContain('DTEND:20261009T163000Z');
    expect(text).toContain('SUMMARY:Vrijdagborrel\\, bij Keuken Kade');
    expect(text).toContain('DESCRIPTION:Met Anna\\; Bram\\nTot dan!');
    expect(text).toContain('UID:abc-123@aether.local');
  });

  it('adds one alarm per reminder', () => {
    expect(text.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(text).toContain('TRIGGER:-PT60M');
    expect(text).toContain('TRIGGER:-PT1440M');
  });

  it('works without reminders', () => {
    expect(buildIcs(event, [], now)).not.toContain('VALARM');
  });
});
