/**
 * Content model. Every collection here is editable in the CMS at /admin
 * (see public/admin/config.yml, which mirrors these fields).
 *
 * Conventions
 * - All content files live exactly two folders below src/, so CMS image paths
 *   are always written as ../../assets/uploads/<file>.
 * - `sample: true` marks placeholder content shipped with the site. It renders a
 *   small "Sample" stamp so it is obvious what still needs real content.
 */
import { defineCollection, reference, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DEPARTMENTS, EVENT_TYPES, SPONSOR_TIERS } from './lib/constants';

/* The CMS writes empty strings for cleared optional fields. Treat them as missing. */
const blank = (value: unknown) => (value === '' || value === null ? undefined : value);
const optionalText = z.preprocess(blank, z.string().optional());
const optionalUrl = z.preprocess(blank, z.url().optional());
const optionalLink = z.preprocess(blank, z.string().optional()); // accepts URLs or site paths like /join
const optionalEmail = z.preprocess(blank, z.email().optional());
/*
 * "Crop position" from the CMS: the part of a photo to keep in view when it's cropped, saved as a
 * CSS object-position like "50% 30%". Anything else counts as unset (centred) rather than failing the build.
 */
const FOCUS = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/;
const optionalFocus = z.preprocess((value) => (typeof value === 'string' && FOCUS.test(value.trim()) ? value.trim() : undefined), z.string().optional());
/*
 * Date-only fields (photo dates, album dates, feature weeks) are calendar days, not instants.
 * YAML parses "2025-02-11" as UTC midnight, which is the previous evening in Vancouver, so
 * pin those to 12:00 UTC: the same calendar day everywhere from Honolulu to Tokyo.
 * Event start/end times are real instants and never go through this.
 */
const toCalendarDay = (value: unknown) => {
  const date = value instanceof Date ? value : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!date || Number.isNaN(date.valueOf())) return value;
  const isMidnightUtc = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  return isMidnightUtc ? new Date(date.valueOf() + 12 * 60 * 60 * 1000) : date;
};
const calendarDay = z.preprocess(toCalendarDay, z.coerce.date());
const optionalDate = z.preprocess((v) => toCalendarDay(blank(v)), z.coerce.date().optional());

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      type: z.enum(EVENT_TYPES).default('show'),
      start: z.coerce.date(),
      end: z.preprocess(blank, z.coerce.date().optional()),
      hideTime: z.boolean().default(false),
      venue: z.string(),
      address: optionalText,
      summary: z.string().max(240),
      cover: z.preprocess(blank, image().optional()),
      coverFocus: optionalFocus,
      coverAlt: optionalText,
      priceMember: optionalText,
      priceGeneral: optionalText,
      ticketUrl: optionalUrl,
      performerUrl: optionalUrl,
      sample: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: calendarDay,
      event: z.preprocess(blank, reference('events').optional()),
      cover: image(),
      coverFocus: optionalFocus,
      coverAlt: z.string(),
      photographer: optionalText,
      showOnHome: z.boolean().default(true),
      photos: z
        .array(
          z.object({
            src: image(),
            focus: optionalFocus,
            alt: optionalText,
            caption: optionalText,
          }),
        )
        .min(1),
      sample: z.boolean().default(false),
    })
    // Uploading a whole roll shouldn't be blocked by alt text: fall back to a generic description.
    .transform((album) => ({
      ...album,
      photos: album.photos.map((photo, i) => ({ ...photo, alt: photo.alt ?? `Photo ${i + 1} from ${album.title}` })),
    })),
});

/* Songs made through ProduceUMI, UMI's songwriting and production workshop, shown as an artist showcase. */
const songs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/songs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      artist: z.string(),
      /** When the song was added in the CMS. Songs not yet placed in the ProduceUMI page's song order follow, oldest first. */
      added: z.preprocess(blank, z.coerce.date().optional()),
      genre: optionalText,
      cover: z.preprocess(blank, image().optional()),
      coverFocus: optionalFocus,
      coverAlt: optionalText,
      summary: z.preprocess(blank, z.string().max(200).optional()),
      producers: optionalText,
      listenUrl: optionalUrl,
      /** The song on Spotify: shown as a Spotify icon on every song, and used for the player when there's no listen link. */
      spotifyUrl: optionalUrl,
      /** A short audio clip in public/audio/snippets/ that plays when someone clicks the record, e.g. /audio/snippets/blue-hour.mp3 */
      snippet: z.preprocess(
        blank,
        z
          .string()
          .regex(/^\/audio\/snippets\/[^/]+\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i, 'Upload the snippet as an audio file (MP3 works in every browser).')
          .optional(),
      ),
      sample: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      department: z.enum(DEPARTMENTS),
      /** Presidents and VPs: shown in the main exec grid. Everyone appears in their department's list. */
      lead: z.boolean().default(false),
      order: z.number().default(100),
      photo: z.preprocess(blank, image().optional()),
      photoFocus: optionalFocus,
      pronouns: optionalText,
      program: optionalText,
      plays: optionalText,
      onRepeat: optionalText,
      email: optionalEmail,
      bio: optionalText,
      active: z.boolean().default(true),
      sample: z.boolean().default(false),
    }),
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sponsors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tier: z.enum(SPONSOR_TIERS),
      logo: z.preprocess(blank, image().optional()),
      url: optionalUrl,
      perk: optionalText,
      order: z.number().default(100),
      active: z.boolean().default(true),
      sample: z.boolean().default(false),
    }),
});

/* ------------------------------------------------------------ singletons */
const photoField = (image: ImageFunction) => z.object({ src: image(), focus: optionalFocus, alt: z.string(), date: optionalDate });

const faq = z.array(z.object({ question: z.string(), answer: z.string() })).default([]);
const steps = z.array(z.object({ title: z.string(), text: z.string() })).default([]);

const settings = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      siteName: z.string(),
      shortName: z.string(),
      tagline: z.string(),
      description: z.string(),
      logo: z.preprocess(blank, image().optional()),
      logoAlt: optionalText,
      email: z.email(),
      office: z.object({
        building: z.string(),
        address: z.string(),
        mapUrl: optionalUrl,
        hours: optionalText,
      }),
      socials: z.object({
        instagram: optionalUrl,
        facebook: optionalUrl,
        tiktok: optionalUrl,
        youtube: optionalUrl,
        spotify: optionalUrl,
      }),
      links: z.object({
        membership: optionalUrl,
        newsletter: optionalUrl,
        campusbase: optionalUrl,
        constitution: optionalUrl,
      }),
      announcement: z.object({
        enabled: z.boolean().default(false),
        text: optionalText,
        linkLabel: optionalText,
        url: optionalLink,
      }),
      landAcknowledgement: z.string(),
    }),
});

const home = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      seoTitle: optionalText,
      hero: z.object({
        timecode: z.string(),
        subtitle: z.string(),
        photos: z.array(photoField(image)).min(1).max(3),
      }),
      /** The strip of prints drifting under the hero. Empty: gallery photos and covers are picked automatically. */
      ribbon: z.array(z.object({ src: image(), focus: optionalFocus })).default([]),
      manifesto: z.object({
        eyebrow: z.string(),
        statement: z.string(),
        body: z.string(),
        stats: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
        photo: photoField(image),
      }),
      shows: z.object({ title: z.string(), intro: optionalText }),
      produce: z.object({ title: z.string(), text: z.string() }),
      gallery: z.object({ title: z.string(), intro: optionalText }),
      sideB: z.object({ title: z.string(), intro: optionalText }),
      join: z.object({ title: z.string(), text: z.string() }),
    }),
});

const produce = defineCollection({
  loader: glob({ pattern: 'produce.md', base: './src/content/pages' }),
  schema: () =>
    z.object({
      title: z.string(),
      intro: z.string(),
      status: z.enum(['open', 'waitlist', 'closed']),
      statusNote: optionalText,
      signupUrl: optionalUrl,
      /** Song file names (ids) in the order the showcase lists them, arranged by dragging in the CMS. */
      songOrder: z.preprocess((ids) => (Array.isArray(ids) ? ids.filter((id) => typeof id === 'string' && id.trim() !== '') : []), z.array(z.string())),
      steps,
      faq,
      sample: z.boolean().default(false),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      heroPhoto: photoField(image),
      mission: z.string(),
      pillars: z.array(z.object({ title: z.string(), text: z.string() })),
      execsIntro: z.string(),
      storyTitle: z.string(),
      timeline: z.array(z.object({ when: z.string(), title: z.string(), text: z.string(), sample: z.boolean().default(false) })),
      storyPhotos: z.array(photoField(image)).max(3).default([]),
    }),
});

const join = defineCollection({
  loader: glob({ pattern: 'join.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      heroPhoto: photoField(image),
      term: z.string(),
      prices: z.array(z.object({ audience: z.string(), price: z.string() })),
      benefits: z.array(z.object({ title: z.string(), text: z.string() })),
      steps,
      faq,
    }),
});

const booking = defineCollection({
  loader: glob({ pattern: 'booking.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      heroPhoto: photoField(image),
      performers: z.object({
        title: z.string(),
        text: z.string(),
        freeNote: z.string(),
        rates: z.array(z.object({ length: z.string(), price: z.string() })),
        requestUrl: optionalLink,
      }),
      rentals: z.object({
        title: z.string(),
        text: z.string(),
        gear: z.array(z.string()),
        ratesUrl: optionalUrl,
        agreementUrl: optionalUrl,
        requestUrl: optionalUrl,
      }),
      steps,
    }),
});

const lessons = defineCollection({
  loader: glob({ pattern: 'lessons.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      heroPhoto: photoField(image),
      status: z.enum(['open', 'waitlist', 'closed']),
      statusNote: optionalText,
      instruments: z.array(z.string()),
      steps,
      learners: z.object({ title: z.string(), text: z.string(), signupUrl: optionalUrl }),
      instructors: z.object({ title: z.string(), text: z.string(), signupUrl: optionalUrl }),
      faq,
      sample: z.boolean().default(false),
    }),
});

const sponsorsPage = defineCollection({
  loader: glob({ pattern: 'sponsors.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      intro: z.string(),
      heroPhoto: photoField(image),
      stats: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
      reasons: z.array(z.object({ title: z.string(), text: z.string() })),
      tiers: z.array(z.object({ name: z.string(), price: z.string(), perks: z.array(z.string()) })),
      contactText: z.string(),
      sample: z.boolean().default(false),
    }),
});

const contact = defineCollection({
  loader: glob({ pattern: 'contact.md', base: './src/content/pages' }),
  schema: () =>
    z.object({
      title: z.string(),
      intro: z.string(),
      topics: z.array(z.string()).min(1),
      responseNote: optionalText,
    }),
});

export const collections = {
  events,
  gallery,
  songs,
  team,
  sponsors,
  settings,
  home,
  produce,
  about,
  join,
  booking,
  lessons,
  sponsorsPage,
  contact,
};
