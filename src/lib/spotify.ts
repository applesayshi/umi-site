/**
 * Cover art from a song's Spotify link, through Spotify's public oEmbed endpoint.
 * No API key and no runtime cost: this runs at build time, and the artwork is then
 * optimised like any other image (the hosts are allowed in astro.config.mjs).
 */

/** Spotify track or album links, including the localised /intl-xx/ form. */
const TRACK = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:track|album)\/[A-Za-z0-9]+/;

/** oEmbed hands back the 300px sleeve; the same image id at this prefix is 640px. */
const SMALL = 'ab67616d00001e02';
const LARGE = 'ab67616d0000b273';

const seen = new Map<string, string | null>();

export async function spotifyArtwork(url?: string): Promise<string | undefined> {
  if (!url || !TRACK.test(url)) return undefined;
  const cached = seen.get(url);
  if (cached !== undefined) return cached ?? undefined;

  let art: string | null = null;
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = (await res.json()) as { thumbnail_url?: string };
      if (data.thumbnail_url) art = data.thumbnail_url.replace(SMALL, LARGE);
    }
  } catch {
    /* Spotify being slow or down must not fail a build: the song falls back to its uploaded cover or the logo sleeve. */
  }

  seen.set(url, art);
  return art ?? undefined;
}
