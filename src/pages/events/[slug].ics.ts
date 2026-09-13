import type { APIRoute, GetStaticPaths } from 'astro';
import { eventEnd, getEvents, type EventEntry } from '../../lib/content';
import { buildCalendar } from '../../lib/ics';

export const getStaticPaths = (async () => {
  const events = await getEvents();
  return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

/** Single-event .ics file for "Add to Apple Calendar / Outlook". */
export const GET: APIRoute = async ({ props, site }) => {
  const { event } = props as { event: EventEntry };
  const base = site ?? new URL('https://www.ubcmusicinitiative.com');
  const body = buildCalendar([
    {
      uid: `${event.id}@ubcmusicinitiative.com`,
      title: event.data.title,
      start: event.data.start,
      end: eventEnd(event),
      description: event.data.summary,
      location: [event.data.venue, event.data.address].filter(Boolean).join(', '),
      url: new URL(`/events/${event.id}/`, base).href,
    },
  ]);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.id}.ics"`,
    },
  });
};
