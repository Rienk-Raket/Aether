import { describe, it, expect } from 'vitest';
import {
  shortlist,
  simulatedChoice,
  createPoll,
  arrivedVotes,
  tally,
  leader,
  castVote,
  progress,
  closePoll,
} from '../js/core/poll.js';
import { encodeInvite, parseInvite, inviteUrl, fitsInQr, cleanName, MAX_MEMBERS } from '../js/core/invite.js';
import { areaSelection } from '../js/core/selection.js';

const ranked = [
  { id: 'a', name: 'Plek A', lat: 52, lng: 5, fairness: 0.9, stats: { mean: 30 } },
  { id: 'b', name: 'Plek B', lat: 52.1, lng: 5.1, fairness: 0.7, stats: { mean: 25 } },
  { id: 'c', name: 'Plek C', lat: 52.2, lng: 5.2, fairness: 0.5, stats: { mean: 20 } },
  { id: 'd', name: 'Plek D', lat: 52.3, lng: 5.3, fairness: 0.4, stats: { mean: 40 } },
];

describe('shortlist', () => {
  it('takes the top 3 with the facts needed later', () => {
    const list = shortlist(ranked);
    expect(list.map((o) => o.id)).toEqual(['a', 'b', 'c']);
    expect(list[0]).toEqual({ id: 'a', name: 'Plek A', lat: 52, lng: 5, fairness: 0.9, mean: 30 });
  });
});

describe('simulated voters', () => {
  it('prefer what is short for themselves', () => {
    expect(simulatedChoice('p1', { a: 10, b: 60, c: 90 })).toBe('a');
    expect(simulatedChoice('p2', { a: 90, b: 60, c: 10 })).toBe('c');
  });

  it('always vote the same way for the same person', () => {
    const times = { a: 40, b: 42, c: 41 };
    expect(simulatedChoice('p9', times)).toBe(simulatedChoice('p9', times));
  });
});

describe('poll', () => {
  const options = shortlist(ranked);
  const people = [{ id: 'me', name: 'Ik' }, { id: 'p1', name: 'Anna' }, { id: 'p2', name: 'Bram' }, { id: 'p3', name: 'Cem' }];
  const times = {
    p1: { a: 10, b: 50, c: 80 },
    p2: { a: 80, b: 50, c: 10 },
    p3: { a: 12, b: 55, c: 90 },
  };
  const start = new Date('2026-10-05T12:00:00Z');
  const poll = createPoll({ id: 'poll1', options, participants: people, selfId: 'me', times, createdAt: start });

  it('gives every other participant a vote that arrives later', () => {
    expect(Object.keys(poll.votes).sort()).toEqual(['p1', 'p2', 'p3']);
    for (const vote of Object.values(poll.votes)) {
      const delay = new Date(vote.at) - start;
      expect(delay).toBeGreaterThanOrEqual(4000);
      expect(delay).toBeLessThanOrEqual(13000);
      expect(vote.simulated).toBe(true);
    }
  });

  it('only counts votes that have arrived', () => {
    expect(Object.keys(arrivedVotes(poll, new Date(start.getTime() + 1000)))).toEqual([]);
    expect(Object.keys(arrivedVotes(poll, new Date(start.getTime() + 60000))).sort()).toEqual(['p1', 'p2', 'p3']);
    expect(progress(poll, 4, new Date(start.getTime() + 1000))).toEqual({ voted: 0, total: 4 });
  });

  it('tallies and finds the leader', () => {
    const later = new Date(start.getTime() + 60000);
    expect(tally(poll, later).a.sort()).toEqual(['p1', 'p3']);
    expect(tally(poll, later).c).toEqual(['p2']);
    expect(leader(poll, later).id).toBe('a');
  });

  it('lets me vote and change my vote', () => {
    const later = new Date(start.getTime() + 60000);
    let voted = castVote(poll, 'me', 'c', later);
    expect(tally(voted, later).c.sort()).toEqual(['me', 'p2']);
    voted = castVote(voted, 'me', 'b', later);
    expect(tally(voted, later).c).toEqual(['p2']);
    expect(tally(voted, later).b).toEqual(['me']);
  });

  it('settles a tie in favour of the fairest option', () => {
    const later = new Date(start.getTime() + 60000);
    const tied = castVote({ ...poll, votes: { p1: poll.votes.p1, p2: poll.votes.p2 } }, 'me', 'c', later);
    // a: p1, c: p2 + me → c leads. Remove me and p3: a and c tie 1–1 → fairest (a) wins.
    const oneEach = { ...tied, votes: { p1: poll.votes.p1, p2: poll.votes.p2 } };
    expect(leader(oneEach, later).id).toBe('a');
  });

  it('closes with a winner and then ignores new votes', () => {
    const later = new Date(start.getTime() + 60000);
    const closed = closePoll(poll, later);
    expect(closed.winner_id).toBe('a');
    expect(closed.closed_at).toBe(later.toISOString());
    expect(castVote(closed, 'me', 'c', later)).toBe(closed);
  });

  it('rejects an unknown option', () => {
    expect(() => castVote(poll, 'me', 'zzz')).toThrow();
  });
});

describe('invites', () => {
  const members = [
    { name: 'Anna', lat: 52.37301234, lng: 4.89245678, mode: 'transit' },
    { name: 'Bram van Ångström', lat: 51.9225, lng: 4.4792, mode: 'car' },
    { name: 'Cem', lat: 52.0907, lng: 5.1214, mode: 'bike' },
  ];

  it('round-trips a group, including accents', () => {
    const result = parseInvite(encodeInvite('Vrijdagborrel', members));
    expect(result.ok).toBe(true);
    expect(result.name).toBe('Vrijdagborrel');
    expect(result.members).toEqual([
      { name: 'Anna', lat: 52.37301, lng: 4.89246, mode: 'transit' },
      { name: 'Bram van Ångström', lat: 51.9225, lng: 4.4792, mode: 'car' },
      { name: 'Cem', lat: 52.0907, lng: 5.1214, mode: 'bike' },
    ]);
  });

  it('is small enough for a QR code, even with 12 members', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ name: `Deelnemer ${i + 1}`, lat: 52.123456, lng: 5.123456, mode: 'transit' }));
    const url = inviteUrl('https://rienk-raket.github.io/Aether/', encodeInvite('Vrijdagborrel crew', twelve));
    expect(url.length).toBeLessThan(900);
    expect(fitsInQr(url)).toBe(true);
  });

  it('knows when a group is too big for a QR code', () => {
    const many = Array.from({ length: MAX_MEMBERS }, (_, i) => ({ name: `Een heel lange naam nummer ${i + 1}`, lat: 52.123456, lng: 5.123456, mode: 'transit' }));
    expect(fitsInQr(inviteUrl('https://example.org/Aether/', encodeInvite('Grote groep', many)))).toBe(false);
  });

  it('rejects garbage and wrong versions', () => {
    expect(parseInvite('').ok).toBe(false);
    expect(parseInvite('!!!not base64!!!').ok).toBe(false);
    expect(parseInvite(btoa('{"v":2,"n":"x","m":[]}')).reason).toBe('version');
    expect(parseInvite(btoa('not json')).reason).toBe('unreadable');
    expect(parseInvite('a'.repeat(7000)).reason).toBe('too_large');
  });

  it('rejects impossible members', () => {
    const bad = (m) => parseInvite(btoa(JSON.stringify({ v: 1, n: 'G', m })));
    expect(bad([]).ok).toBe(false);
    expect(bad([['Anna', 200, 5, 0]]).ok).toBe(false); // latitude out of range
    expect(bad([['Anna', 52, 5, 9]]).ok).toBe(false); // unknown transport
    expect(bad([['', 52, 5, 0]]).ok).toBe(false); // no name
    expect(bad([['Anna', 52, 5]]).ok).toBe(false); // missing field
    expect(bad([['Anna', '52', 5, 0]]).ok).toBe(false); // text instead of number
  });

  it('cleans names from strangers', () => {
    expect(cleanName('  Anna\u0000\u0007  ')).toBe('Anna');
    expect(cleanName('x'.repeat(100))).toHaveLength(40);
    const result = parseInvite(btoa(JSON.stringify({ v: 1, n: '<b>G</b>', m: [['<img src=x>', 52, 5, 0]] })));
    expect(result.ok).toBe(true);
    expect(result.members[0].name).toBe('<img src=x>'); // kept as text; screens always escape it
  });
});

describe('areaSelection', () => {
  it('stores the area and its numbers', () => {
    const selection = areaSelection({ id: 'x', name: 'X', lat: 52, lng: 5, times: [10, 20, 30] }, 1);
    expect(selection.selected_area).toEqual({ id: 'x', name: 'X', lat: 52, lng: 5 });
    expect(selection.average_travel_time).toBe(20);
    expect(selection.fairness_priority).toBe(1);
    expect(selection.fairness_score).toBeGreaterThan(0.5);
  });
});

import qrcode from '../vendor/qrcode.js';

describe('QR code', () => {
  it('can encode a 12-person invitation link', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ name: `Deelnemer ${i + 1}`, lat: 52.123456, lng: 5.123456, mode: 'transit' }));
    const url = inviteUrl('https://rienk-raket.github.io/Aether/', encodeInvite('Vrijdagborrel crew', twelve));
    const qr = qrcode(0, 'L');
    qr.addData(url);
    qr.make();
    expect(qr.getModuleCount()).toBeLessThanOrEqual(25 * 4 + 17 + 4 * 6); // well within a readable size
    expect(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })).toContain('<svg');
  });
});
