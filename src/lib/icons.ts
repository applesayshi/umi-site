/**
 * Phosphor icons (MIT), inlined at build time as raw SVG strings.
 * Add an icon: import it below and register it in `icons`.
 */
import arrowLeft from '@phosphor-icons/core/regular/arrow-left.svg?raw';
import arrowRight from '@phosphor-icons/core/regular/arrow-right.svg?raw';
import arrowUpRight from '@phosphor-icons/core/regular/arrow-up-right.svg?raw';
import calendarPlus from '@phosphor-icons/core/regular/calendar-plus.svg?raw';
import calendarBlank from '@phosphor-icons/core/regular/calendar-blank.svg?raw';
import caretDown from '@phosphor-icons/core/regular/caret-down.svg?raw';
import caretLeft from '@phosphor-icons/core/regular/caret-left.svg?raw';
import caretRight from '@phosphor-icons/core/regular/caret-right.svg?raw';
import check from '@phosphor-icons/core/regular/check.svg?raw';
import clock from '@phosphor-icons/core/regular/clock.svg?raw';
import copy from '@phosphor-icons/core/regular/copy.svg?raw';
import envelope from '@phosphor-icons/core/regular/envelope-simple.svg?raw';
import facebook from '@phosphor-icons/core/regular/facebook-logo.svg?raw';
import filmStrip from '@phosphor-icons/core/regular/film-strip.svg?raw';
import graduationCap from '@phosphor-icons/core/regular/graduation-cap.svg?raw';
import guitar from '@phosphor-icons/core/regular/guitar.svg?raw';
import handHeart from '@phosphor-icons/core/regular/hand-heart.svg?raw';
import handshake from '@phosphor-icons/core/regular/handshake.svg?raw';
import headphones from '@phosphor-icons/core/regular/headphones.svg?raw';
import images from '@phosphor-icons/core/regular/images.svg?raw';
import instagram from '@phosphor-icons/core/regular/instagram-logo.svg?raw';
import list from '@phosphor-icons/core/regular/list.svg?raw';
import mapPin from '@phosphor-icons/core/regular/map-pin.svg?raw';
import megaphone from '@phosphor-icons/core/regular/megaphone.svg?raw';
import metronome from '@phosphor-icons/core/regular/metronome.svg?raw';
import microphone from '@phosphor-icons/core/regular/microphone-stage.svg?raw';
import musicNotes from '@phosphor-icons/core/regular/music-notes.svg?raw';
import pause from '@phosphor-icons/core/regular/pause.svg?raw';
import pauseFill from '@phosphor-icons/core/fill/pause-fill.svg?raw';
import pianoKeys from '@phosphor-icons/core/regular/piano-keys.svg?raw';
import play from '@phosphor-icons/core/regular/play.svg?raw';
import playFill from '@phosphor-icons/core/fill/play-fill.svg?raw';
import shareNetwork from '@phosphor-icons/core/regular/share-network.svg?raw';
import soundcloud from '@phosphor-icons/core/regular/soundcloud-logo.svg?raw';
import speaker from '@phosphor-icons/core/regular/speaker-hifi.svg?raw';
import sparkle from '@phosphor-icons/core/regular/sparkle.svg?raw';
import spotify from '@phosphor-icons/core/regular/spotify-logo.svg?raw';
import starFour from '@phosphor-icons/core/regular/star-four.svg?raw';
import ticket from '@phosphor-icons/core/regular/ticket.svg?raw';
import tiktok from '@phosphor-icons/core/regular/tiktok-logo.svg?raw';
import usersThree from '@phosphor-icons/core/regular/users-three.svg?raw';
import vinyl from '@phosphor-icons/core/regular/vinyl-record.svg?raw';
import waveform from '@phosphor-icons/core/regular/waveform.svg?raw';
import x from '@phosphor-icons/core/regular/x.svg?raw';
import youtube from '@phosphor-icons/core/regular/youtube-logo.svg?raw';

export const icons = {
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  'arrow-up-right': arrowUpRight,
  'calendar-plus': calendarPlus,
  calendar: calendarBlank,
  'caret-down': caretDown,
  'caret-left': caretLeft,
  'caret-right': caretRight,
  check,
  clock,
  copy,
  envelope,
  facebook,
  'film-strip': filmStrip,
  'graduation-cap': graduationCap,
  guitar,
  'hand-heart': handHeart,
  handshake,
  headphones,
  images,
  instagram,
  list,
  'map-pin': mapPin,
  megaphone,
  metronome,
  microphone,
  'music-notes': musicNotes,
  pause,
  'pause-fill': pauseFill,
  'piano-keys': pianoKeys,
  play,
  'play-fill': playFill,
  share: shareNetwork,
  soundcloud,
  speaker,
  sparkle,
  spotify,
  'star-four': starFour,
  ticket,
  tiktok,
  users: usersThree,
  vinyl,
  waveform,
  x,
  youtube,
} as const;

export type IconName = keyof typeof icons;
