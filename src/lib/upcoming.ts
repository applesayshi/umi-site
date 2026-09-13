/**
 * The "Upcoming events" lists (home page and Events page) only cover the next three weeks:
 * events that haven't ended and start between today and 21 days from today, by Vancouver date.
 * Later events stay on the calendar. Shared by the build and the browser, so a page can re-check
 * its list on load and stay right between daily rebuilds.
 */
import { vancouverToday } from './calendar';

export const UPCOMING_DAYS = 21;

/** The last Vancouver day key ("2026-10-04") the upcoming lists include. */
export function upcomingUntil(now = new Date()) {
  const [year, month, day] = vancouverToday(now).key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + UPCOMING_DAYS)).toISOString().slice(0, 10);
}

/** Whether an event starting on `startDay` (a Vancouver day key) and ending at `end` belongs in the lists now. */
export function inUpcomingWindow(startDay: string, end: Date | string, now = new Date(), until = upcomingUntil(now)) {
  return new Date(end).valueOf() > now.valueOf() && startDay <= until;
}
