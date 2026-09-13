/**
 * Month-grid rendering shared by the server (first paint) and the browser (month navigation),
 * so both produce identical markup. Pure string templating, no dependencies.
 */

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  /** Calendar day in Vancouver, "2026-10-09" */
  day: string;
  time: string;
  href: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY = 86_400_000;

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const key = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

export const monthLabel = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`;

/** Today's date in Vancouver as { year, month, key }. */
export function vancouverToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const year = Number(get('year'));
  const month = Number(get('month'));
  return { year, month, key: `${year}-${get('month')}-${get('day')}` };
}

export function renderMonth(year: number, month: number, events: CalendarEvent[], todayKey: string) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first.valueOf() - first.getUTCDay() * DAY);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((first.getUTCDay() + daysInMonth) / 7);
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = byDay.get(e.day) ?? [];
    list.push(e);
    byDay.set(e.day, list);
  }

  let rows = '';
  for (let w = 0; w < weeks; w++) {
    let cells = '';
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.valueOf() + (w * 7 + d) * DAY);
      const k = key(date);
      const inMonth = date.getUTCMonth() === month - 1;
      if (!inMonth) {
        // Days from neighbouring months stay blank: they belong to another page of the calendar.
        cells += '<td class="cal__cell is-out"></td>';
        continue;
      }
      const dayEvents = byDay.get(k) ?? [];
      const classes = ['cal__cell', k === todayKey && 'is-today', k < todayKey && 'is-past', dayEvents.length && 'has-events']
        .filter(Boolean)
        .join(' ');
      const items = dayEvents
        .map(
          (e) =>
            `<li class="cal__event type-${esc(e.type)}" data-event-type="${esc(e.type)}"><a href="${esc(e.href)}"><span class="cal__event-time">${esc(e.time)}</span><span class="cal__event-title">${esc(e.title)}</span></a></li>`,
        )
        .join('');
      cells += `<td class="${classes}"${k === todayKey ? ' aria-current="date"' : ''}><span class="cal__num">${date.getUTCDate()}</span>${items ? `<ul class="cal__events" role="list">${items}</ul>` : ''}</td>`;
    }
    rows += `<tr>${cells}</tr>`;
  }

  const head = WEEKDAYS.map((name) => `<th scope="col"><abbr title="${name}">${name.slice(0, 3)}</abbr></th>`).join('');
  const inMonth = events
    .filter((e) => e.day.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    .sort((a, b) => a.day.localeCompare(b.day));
  const agenda = inMonth.length
    ? inMonth
        .map((e) => {
          const [, , dd] = e.day.split('-');
          return `<li class="cal__agenda-item type-${esc(e.type)}" data-event-type="${esc(e.type)}"><span class="cal__agenda-day">${Number(dd)}</span><a href="${esc(e.href)}"><span class="cal__agenda-title">${esc(e.title)}</span><span class="cal__agenda-meta">${esc(e.typeLabel)}${e.time ? ` · ${esc(e.time)}` : ''}</span></a></li>`;
        })
        .join('')
    : '';

  return {
    label: monthLabel(year, month),
    grid: `<table class="cal__grid"><caption class="visually-hidden">UMI events in ${monthLabel(year, month)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`,
    agenda: agenda
      ? `<ol class="cal__agenda" role="list">${agenda}</ol>`
      : `<p class="cal__empty">Nothing on the calendar for ${MONTHS[month - 1]} yet.</p>`,
  };
}
