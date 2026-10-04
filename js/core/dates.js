// Pure date helpers. A "day key" is a local date string "YYYY-MM-DD".

const pad = (n) => String(n).padStart(2, '0');

export function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Local date + time → Date (stored later as UTC ISO string).
export function combine(key, hour, minute) {
  const date = parseDayKey(key);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function isPastDay(key, today = new Date()) {
  return key < dayKey(today);
}

// Days to show for a month view: starts on Monday, whole weeks (5 or 6 rows of 7).
// Returns [{ key, day, inMonth }]
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(year, month, i - offset + 1);
    return { key: dayKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
}

// Next occurrence of a weekday (0 = Sunday) at a time, strictly after "from".
export function nextWeekdayAt(weekday, hour, minute, from = new Date()) {
  const date = new Date(from);
  date.setHours(hour, minute, 0, 0);
  const days = (weekday - from.getDay() + 7) % 7;
  date.setDate(date.getDate() + days);
  if (date <= from) date.setDate(date.getDate() + 7);
  return date;
}

// The suggestion chips from the spec: Friday 17:00, Sunday 14:00, Wednesday 12:30.
export function suggestions(from = new Date()) {
  return [
    nextWeekdayAt(5, 17, 0, from),
    nextWeekdayAt(0, 14, 0, from),
    nextWeekdayAt(3, 12, 30, from),
  ].sort((a, b) => a - b);
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} u ${m} min` : `${h} uur`;
}
