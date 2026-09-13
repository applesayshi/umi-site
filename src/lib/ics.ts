/** Minimal RFC 5545 iCalendar writer for event feeds and "add to calendar" files. */

export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  url?: string;
  updated?: Date;
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets must be folded with CRLF + space. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length;
    if (size + charSize > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += charSize;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function buildCalendar(events: IcsEvent[], { name = 'UBC Music Initiative' } = {}) {
  const now = utc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UBC Music Initiative//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    'X-WR-TIMEZONE:America/Vancouver',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${e.updated ? utc(e.updated) : now}`,
      `DTSTART:${utc(e.start)}`,
      `DTEND:${utc(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Google Calendar "create event" link (no account data leaves the page until the visitor clicks). */
export function googleCalendarUrl(e: IcsEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${utc(e.start)}/${utc(e.end)}`,
    details: [e.description, e.url].filter(Boolean).join('\n\n'),
    location: e.location ?? '',
    ctz: 'America/Vancouver',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
