// Builds an iCalendar (.ics) file for one appointment, so it can be added to any calendar app.
// Pure text building: no browser needed. See RFC 5545 for the format.

const pad = (n) => String(n).padStart(2, '0');

// 2026-10-09T15:00:00Z → "20261009T150000Z" (calendars want UTC in this format)
export function icsDate(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

// Commas, semicolons, backslashes and line breaks have a special meaning and must be escaped.
export const icsText = (value) =>
  String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replace(/\r?\n/g, '\\n');

// Lines may be at most 75 bytes: longer ones continue on the next line, starting with a space.
export function foldLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74; // continuation lines lose one byte to the leading space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

// event: { id, title, start: Date, durationMinutes, location, description }
// reminders: minutes before the start, for example [60, 1440]
export function buildIcs(event, reminders = [60], now = new Date()) {
  const end = new Date(event.start.getTime() + event.durationMinutes * 60000);
  const alarms = reminders.flatMap((minutes) => [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(event.title)}`,
    `TRIGGER:-PT${minutes}M`,
    'END:VALARM',
  ]);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aether//Meet in the middle//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@aether.local`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText(event.location)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    ...alarms,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
