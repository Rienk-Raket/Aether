import { describe, it, expect } from 'vitest';
import {
  dayKey,
  combine,
  isPastDay,
  monthGrid,
  nextWeekdayAt,
  suggestions,
  formatDuration,
  formatTime,
  addMinutes,
} from '../js/core/dates.js';

// Saturday 3 October 2026, 22:00 local time
const saturdayEvening = new Date(2026, 9, 3, 22, 0);

describe('day keys', () => {
  it('formats and combines local dates', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    const date = combine('2026-10-09', 17, 30);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 9, 9, 17, 30]);
  });

  it('detects days in the past (today is allowed)', () => {
    expect(isPastDay('2026-10-02', saturdayEvening)).toBe(true);
    expect(isPastDay('2026-10-03', saturdayEvening)).toBe(false);
    expect(isPastDay('2026-10-04', saturdayEvening)).toBe(false);
  });
});

describe('monthGrid', () => {
  it('starts on Monday and covers whole weeks', () => {
    const grid = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(grid.length % 7).toBe(0);
    expect(grid[0].key).toBe('2026-09-28'); // Monday before
    expect(grid[3]).toEqual({ key: '2026-10-01', day: 1, inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it('uses 6 rows when needed', () => {
    expect(monthGrid(2026, 7)).toHaveLength(42); // August 2026 starts on a Saturday
  });
});

describe('suggestions', () => {
  it('finds the next Friday 17:00, Sunday 14:00 and Wednesday 12:30, soonest first', () => {
    const keys = suggestions(saturdayEvening).map((d) => `${dayKey(d)} ${formatTime(d)}`);
    expect(keys).toEqual(['2026-10-04 14:00', '2026-10-07 12:30', '2026-10-09 17:00']);
  });

  it('skips to next week when today’s time has passed', () => {
    const fridayLate = new Date(2026, 9, 9, 18, 0);
    expect(dayKey(nextWeekdayAt(5, 17, 0, fridayLate))).toBe('2026-10-16');
  });
});

describe('formatting', () => {
  it('formats durations and end times', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1 uur');
    expect(formatDuration(150)).toBe('2 u 30 min');
    expect(formatTime(addMinutes(new Date(2026, 9, 9, 23, 30), 90))).toBe('01:00');
  });
});
