import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { dayKey } from './dates';
import { inUpcomingWindow } from './upcoming';

export type EventEntry = CollectionEntry<'events'>;
export type AlbumEntry = CollectionEntry<'gallery'>;
export type SongEntry = CollectionEntry<'songs'>;
export type TeamEntry = CollectionEntry<'team'>;

export const EVENT_TYPE_LABELS: Record<EventEntry['data']['type'], string> = {
  show: 'Showcase',
  'open-mic': 'Open mic',
  workshop: 'Workshop',
  social: 'Social',
  'members-only': 'Members only',
  community: 'Community',
};

const THREE_HOURS = 3 * 60 * 60 * 1000;

/** Events without an end time are assumed to run three hours. */
export const eventEnd = (e: EventEntry) => e.data.end ?? new Date(e.data.start.valueOf() + THREE_HOURS);

export async function getEvents() {
  const all = await getCollection('events', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.start.valueOf() - b.data.start.valueOf());
}

/** Upcoming = has not ended yet at build time. The page scripts re-check this in the browser. */
export async function getUpcomingEvents(now = new Date()) {
  return (await getEvents()).filter((e) => eventEnd(e) > now);
}

export async function getPastEvents(now = new Date()) {
  return (await getEvents()).filter((e) => eventEnd(e) <= now).reverse();
}

/** Listed under "Upcoming events" right now: hasn't ended and starts within the next three weeks (see lib/upcoming.ts). */
export const isInUpcomingWindow = (e: EventEntry, now = new Date()) => inUpcomingWindow(dayKey(e.data.start), eventEnd(e), now);

export async function getAlbums() {
  const albums = await getCollection('gallery');
  return albums.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAlbumForEvent(eventId: string) {
  return (await getAlbums()).find((a) => a.data.event?.id === eventId);
}

/**
 * ProduceUMI songs in showcase order: as arranged in the CMS (ProduceUMI page → Song order), then songs that
 * haven't been placed there yet, in the order they were added.
 */
export async function getSongs() {
  const [songs, page] = await Promise.all([getCollection('songs', (s) => !s.data.draft), getEntry('produce', 'produce')]);
  const order = page?.data.songOrder ?? [];
  const place = (song: SongEntry) => (order.includes(song.id) ? order.indexOf(song.id) : order.length);
  const added = (song: SongEntry) => song.data.added?.valueOf() ?? 0;
  return songs.sort((a, b) => place(a) - place(b) || added(a) - added(b) || a.data.title.localeCompare(b.data.title));
}

/**
 * A song's snippet URL, but only if the audio file is really in public/ (for example, not deleted from the
 * media library). A missing file skips the play button instead of showing one that can't play.
 */
export function songSnippet(song: SongEntry) {
  const url = song.data.snippet;
  if (!url) return undefined;
  if (existsSync(join(process.cwd(), 'public', decodeURIComponent(url)))) return url;
  console.warn(`[songs] ${song.id}: snippet ${url} isn't in public/, so no play button is shown.`);
  return undefined;
}

export async function getTeam() {
  const team = await getCollection('team', (t) => t.data.active);
  return team.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export async function getSponsors() {
  const sponsors = await getCollection('sponsors', (s) => s.data.active);
  return sponsors.sort((a, b) => a.data.order - b.data.order);
}

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Missing src/content/settings/site.yml');
  return entry.data;
}

/** Fetch a single-page entry (home, about, ...) and fail loudly if it's missing. */
export async function getPage<C extends 'home' | 'produce' | 'about' | 'join' | 'booking' | 'lessons' | 'sponsorsPage' | 'contact'>(
  collection: C,
  id: string,
) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`Missing page content: ${collection}/${id}`);
  return entry as CollectionEntry<C>;
}

/** Inline style for a cropped photo's "Crop position" from the CMS (a CSS object-position). Unset photos stay centred. */
export const cropStyle = (focus?: string) => (focus ? `object-position: ${focus}` : undefined);

/** Light inline Markdown for short CMS strings: *emphasis* and **strong**. Escapes HTML first. */
export function inline(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
