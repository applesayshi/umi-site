import type { APIRoute } from 'astro';
import { eventEnd, getEvents } from '../lib/content';
import { buildCalendar } from '../lib/ics';

/** Subscribable feed of every UMI event (webcal://…/calendar.ics). */
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://www.ubcmusicinitiative.com');
  const events = await getEvents();
  const body = buildCalendar(
    events.map((e) => ({
      uid: `${e.id}@ubcmusicinitiative.com`,
      title: e.data.title,
      start: e.data.start,
      end: eventEnd(e),
      description: e.data.summary,
      location: [e.data.venue, e.data.address].filter(Boolean).join(', '),
      url: new URL(`/events/${e.id}`, base).href,
    })),
    { name: 'UBC Music Initiative (UMI)' },
  );
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
