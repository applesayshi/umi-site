export type EmbedProvider = 'spotify' | 'youtube' | 'soundcloud';

export interface Embed {
  provider: EmbedProvider;
  src: string;
  /** Fixed player height in px (audio players), or undefined for 16:9 video. */
  height?: number;
  label: string;
}

/** Turns a normal share link into a privacy-friendly embed URL. Returns null for unsupported links. */
export function toEmbed(url?: string | null): Embed | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');

  if (host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return {
      provider: 'spotify',
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`,
      height: m[1] === 'track' || m[1] === 'episode' ? 152 : 352,
      label: 'Spotify',
    };
  }

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    const id =
      host === 'youtu.be'
        ? u.pathname.slice(1)
        : u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
    if (!id) return null;
    return {
      provider: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
      label: 'YouTube',
    };
  }

  if (host === 'soundcloud.com' || host === 'on.soundcloud.com') {
    return {
      provider: 'soundcloud',
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5a2b&auto_play=true&hide_related=true&show_comments=false&visual=false`,
      height: 166,
      label: 'SoundCloud',
    };
  }

  return null;
}
