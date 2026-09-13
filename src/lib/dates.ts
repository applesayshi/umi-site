/** All event times are shown in Vancouver time, regardless of the visitor's or build server's zone. */
export const TIME_ZONE = 'America/Vancouver';

const cache = new Map<string, Intl.DateTimeFormat>();
function formatter(options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(options);
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, ...options });
    cache.set(key, fmt);
  }
  return fmt;
}

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  weekday: string; // "Fri"
}

export function dateParts(date: Date): DateParts {
  const parts = formatter({
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: get('weekday'),
  };
}

/** "Friday, October 9, 2026" */
export const longDate = (d: Date) => formatter({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);

/** "Fri, Oct 9" */
export const shortDate = (d: Date) => formatter({ weekday: 'short', month: 'short', day: 'numeric' }).format(d);

/** "Oct 9, 2026" */
export const mediumDate = (d: Date) => formatter({ month: 'short', day: 'numeric', year: 'numeric' }).format(d);

/** "October 2026" */
export const monthYear = (d: Date) => formatter({ month: 'long', year: 'numeric' }).format(d);

/** "OCT" */
export const monthShort = (d: Date) => formatter({ month: 'short' }).format(d).toUpperCase();

/** "FRI" */
export const weekdayShort = (d: Date) => formatter({ weekday: 'short' }).format(d).toUpperCase();

/** "09" */
export const dayPadded = (d: Date) => String(dateParts(d).day).padStart(2, '0');

/** "7:00 PM" (ICU inserts a narrow no-break space before the meridiem; normalise it). */
export const time = (d: Date) =>
  formatter({ hour: 'numeric', minute: '2-digit' })
    .format(d)
    .replace(/[  ]/g, ' ');

/** "7:00 – 10:00 PM" (or with both meridiems when they differ) */
export function timeRange(start: Date, end?: Date) {
  if (!end) return time(start);
  const a = time(start);
  const b = time(end);
  const [aTime, aMer] = a.split(' ');
  const [bTime, bMer] = b.split(' ');
  return aMer === bMer ? `${aTime} – ${bTime} ${bMer}` : `${a} – ${b}`;
}

/** Camera date-back stamp: "'26 10 09" */
export function stamp(d: Date) {
  const p = dateParts(d);
  return `'${String(p.year).slice(-2)} ${String(p.month).padStart(2, '0')} ${String(p.day).padStart(2, '0')}`;
}

/** Machine-readable ISO string for <time datetime>. */
export const iso = (d: Date) => d.toISOString();

export function sameDay(a: Date, b: Date) {
  const x = dateParts(a);
  const y = dateParts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/** Key used to bucket events by calendar day in Vancouver: "2026-10-09" */
export function dayKey(d: Date) {
  const p = dateParts(d);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
