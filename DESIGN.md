# UMI design system: "Blue Hour Riso"

The brief: *elegant*, drawing on indie sleaze graphics, Wong Kar-wai's **Chungking Express** and rock/indie record sleeves. The club's moodboard added risograph gig posters, glitch and pixel-sort collages, halftone zines, glowing tracklist posters and ransom-note lettering. The UMI logo sets the colours: navy, white and a scratchy periwinkle clef.

The resolution: UMI's navy and periwinkle printed like a riso zine at night. Two riso inks, cobalt and fluorescent orange, do most of the work, while photos stay in their natural colour, pasted up as prints. The collage layer (marker scribbles, glitch strips, tape, UI windows) stays in the margins. Layout, spacing and type stay precise, which is what keeps it elegant.

**Clarity beats flourish** wherever people need information: section titles say what the section is ("Upcoming events", "Become a member"), and events, prices and people use the same plain, legible rows everywhere.

The moodboard artworks are copyrighted, so the site recreates their *techniques* (halftone, misregistration, glow type, tracklists) and never uses the images themselves.

## Principles

1. **Night, paper, ink.** Sections alternate between *night* (the show), *paper* (the liner notes) and solid *cobalt* for calls to action, like the front, back and insert of a sleeve.
2. **Two inks, spot colours sparingly.** Cobalt and orange carry the page. Pink, mint and sun yellow appear once per view at most, as a scribble or a sticker.
3. **One idea per detail.** Tape holds a print down, a date stamp says when a photo was taken, a scribble circles the thing that matters. Nothing is decoration for its own sake.
4. **Motion is smooth and quiet.** Headlines fade and rise or wipe in once, prints drift, lights glide. Nothing steps or stutters: an early version used a low-frame-rate "step-print" effect, and on real page loads it read as lag, not style.
5. **Show, don't sell.** The home page leads with the club's own art and photos, not slogans or scrolling taglines.
6. **Readable first.** Every text pairing meets WCAG AA. Content is visible without JavaScript. Reduced-motion users get the final state immediately.

## Colour (`src/styles/tokens.css`)

| Token | Hex | Use |
| --- | --- | --- |
| `--night-950` | `#070b1f` | Primary background (blue-black) |
| `--navy` | `#01114b` | The logo files' navy: `theme-navy` (the ProduceUMI section), logo tiles, icons |
| `--peri` | `#93a3e6` | Logo periwinkle: subtitles, glows, focus rings. 8:1 on night |
| `--cobalt` / `--cobalt-deep` | `#2c52e0` / `#2446c4` | Riso ink 1: CTA bands, rate sheets, links on paper. White text only (5.5:1 / 6.8:1) |
| `--orange` / `--orange-ink` | `#ff5a2b` / `#ad2d0b` | Riso ink 2: primary buttons, track numbers, marker scribbles. Night text on orange; `--orange-ink` for text on paper |
| `--pink` · `--mint` · `--sun` | `#ff7cc2` · `#9ef0c9` · `#ffe45e` | Spot colours for stickers and scribbles |
| `--chalk` / `--mist` | `#eef1fa` / `#a9b1d6` | Text / muted text on night (17.3:1 / 9.2:1) |
| `--paper-50` | `#ebe9e1` | Paper sections |
| `--ink` / `--ink-soft` | `#0a0f26` / `#454b66` | Text / muted text on paper (15.6:1 / 7:1) |
| `--sodium` | `#ff8a4c` | Camera date stamps (decorative) |

Sections declare a theme class that remaps the semantic tokens `--bg`, `--fg`, `--fg-muted`, `--accent`, `--hot`, `--line` and `--focus`. Components only use semantic tokens.

| Theme | Surface | Accent | Notes |
| --- | --- | --- | --- |
| `theme-night` | night-950 | orange | Default |
| `theme-navy` | navy | orange | |
| `theme-paper` | paper-50 | cobalt-deep, hot `--orange-ink` | |
| `theme-cobalt` | cobalt-deep | night, hot sun | White text only; muted text `#dde3ff` (5.6:1) |
| `theme-peri` | periwinkle | night | Night text only |
| `theme-orange` | orange | night | Thin bars and stickers only |

## Type

| Role | Font | Notes |
| --- | --- | --- |
| Display | **Archivo Expanded** 800/900 (`wdth` 125) | Wide heavy capitals like the logo. `.display` class, `line-height` .84–.95. |
| Serif | **Instrument Serif** (+ italic) | Subtitles in periwinkle, pull quotes, the manifesto. |
| Sans | **Archivo** 400/600 | Body copy and UI. |
| Mono | **IBM Plex Mono** 400/500 | Eyebrows, tickets, timecodes, buttons. `.tracked` is the lowercase, wide-spaced record-back tracklist style. |

Fonts are self-hosted by Astro's Fonts API with metric-matched fallbacks. Body text uses the fluid scale `--step--2` to `--step-7`. Expanded capitals run about twice as wide as body text, so display type has its own scale: `--display-s` to `--display-2xl`.

**Headline fitting.** CMS titles can contain long words ("PRODUCTION", "MISTLETOE") that won't fit a narrow column. `fitStyle(text)` in `src/lib/fit.ts` measures the widest word from the font's real glyph widths and sets `--fit`; the heading's column is a size container, and the heading caps its size with `font-size: min(var(--display-xl), 100cqi / var(--fit, 0.01))`. Short titles stay at the design size and long words shrink just enough, with no mid-word breaks. Use this for any display heading that shows CMS text.

## Print effects

- **Natural-colour photos.** An earlier duotone treatment (grayscale photos under two ink layers that developed into colour on hover) was removed at the club's request: don't put colour filters or tints over photos.
- **Misregistration:** an orange plate offset behind a print (`Photo misregister`) or a wordmark (share image).
- **Glow type** (`.glow-title` + `data-text`): a blurred periwinkle copy of the headline behind it, like a glowing poster title. The copy is hidden from screen readers.
- **Grain and paper:** fixed film grain over everything, and toner speckle on paper sections (`/textures/`).

## Signature components

- **Photo** (`ui/Photo.astro`): responsive AVIF/WebP, print border, tape, tilt, misregistration, orange LCD date stamp, a flash "develop" reveal and a gentle zoom on hover. `position` takes the photo's "Crop position" from the CMS; other cropped images use `cropStyle()`.
- **Scribble** (`ui/Scribble.astro`): hand-drawn marker marks (circle, underline, arrow, star, loop, vine, burst and more) that draw themselves in when revealed.
- **GlitchStrip** (`ui/GlitchStrip.astro`): seeded pixel-sort colour bars that close page heroes and the footer.
- **UiWindow** (`ui/UiWindow.astro`): a small "program window" frame (title bar + body) for status boxes.
- **DataRail** (`ui/DataRail.astro`): vertical mono text with tick marks along hero edges (desktop).
- **Countdown** (`ui/Countdown.astro`): a seven-segment countdown window to the next show, rolling forward by itself.
- **EventRow** (`events/EventRow.astro`): the one way upcoming events are listed, on the Events page and the home page: date block, type, title, time, venue, prices. Both "Upcoming events" lists only show the next three weeks (`lib/upcoming.ts`); later dates live on the calendar.
- **Past shows** (`pages/events/index.astro`): one closed `<details>` dropdown under the upcoming list, styled like ExecDepartments, holding a compact one-line-per-show archive grouped by season.
- **TicketStub** (`events/TicketStub.astro`): an event as an admission ticket with a perforated stub and barcode.
- **ProduceUMI** (`home/ProduceUMI.astro`, `produce/SongCard.astro`, `pages/produceumi/`): the workshop's logo on navy, with its songs as record sleeves grouped by school year. Each song can have a Spotify icon and an audio snippet.
- **SnippetButton** (`produce/SnippetButton.astro`, `scripts/snippets.ts`): plays a song's snippet. Over a record sleeve (`cover`) the whole record is the button and an orange badge sits in the corner; in lists it's a small round button. One shared `<audio>` means only one snippet plays at a time. While playing, the nearest `[data-snippet-root]` gets `.is-playing`: the disc slides out and spins, and a ring around the badge shows progress. Records without a snippet keep linking to the song page.
- **Vinyl** (`ui/Vinyl.astro`): a sleeve with the record sliding out; spins only while on screen. Used for song pages.
- **Membership** (`home/Membership.astro`): perks, paper price cards and the join button on cobalt.
- **ExecDepartments** (`about/ExecDepartments.astro`): one `<details>` dropdown per department listing every exec; presidents and VPs also get full cards.
- **ContactSheet** (`home/ContactSheet.astro`): a 35mm film strip of photo frames with sprocket holes.
- **PhotoRibbon** (`home/PhotoRibbon.astro`): an endless, slowly drifting row of tilted prints under the home hero. Decorative, pauses on hover or with its button, moves only while on screen, and stays still for reduced motion.
- **Menu**: a full-screen "tracklist" (Side A / Side B) built on `<dialog>`.
- **EditPin / EditorBar** (`ui/EditPin.astro`, `layout/EditorBar.astro`): for editors logged in to the CMS in this browser only. Sun-yellow pencils (mint plus for "add") float in a section's top-right corner or sit inline in a row; the label slides out on hover or focus. The Editor button folds away in the bottom-left corner. For visitors both are `display: none`, so they never affect layout. Keep pencils out of links (a pencil inside a card link is invalid HTML): put them beside the link in the card's positioned parent.

## Motion rules

- Durations: `--dur-fast 180ms` (hover), `--dur-base 280ms` (state), `--dur-slow 560ms` (reveal), `--dur-slower 900ms` (headline).
- Easing: `--ease-out` for entrances and state changes, `--ease-in` for exits, `linear` only for the photo ribbon's constant drift. Never `steps()` for movement.
- Page-load entrances use the shared `rise-in` keyframes (opacity and transform only, so the browser can run them off the main thread). Scroll reveals wipe in with `data-reveal="stutter"` (the name is historical; it's smooth now).
- Page-to-page navigation is a short crossfade.
- Only `transform`, `opacity`, `clip-path` and SVG stroke offsets animate on scroll.
- **Flashes:** the photo flash reveal is queued at least 400ms apart site-wide (never more than three per second, per WCAG 2.3.1).
- **Hero canvas:** renders at half resolution and 30fps with time-based movement, pauses off-screen and in background tabs, and shows a still frame for reduced motion or data-saver.
- `prefers-reduced-motion: reduce` removes loops, parallax, draw-ins and reveals, leaving content in its final state.

## Layout rules

- Single-column grids use `grid-template-columns: minmax(0, 1fr)` so one long word or chip can't widen the page on phones.
- Prints, tape and marquee bands may bleed off the edges; `main` clips horizontal overflow so phones never pan sideways.
- Wide content (calendar, film strip) scrolls inside its own container.

## Brand assets

The club's logos live in `src/assets/brand/`. The originals (`UMI.PNG`, `PRODUCEUMI.PNG`) are small JPEGs on flat navy, so `npm run brand` (`scripts/generate-brand.mjs`) redraws them as clean transparent masters about 3x larger (`umi-logo.png`, `produceumi-logo.png`): white lettering and a flat periwinkle clef with smooth edges. The site uses the masters in the header, home hero, footer and on ProduceUMI pages.

The same script builds the home-screen icons and share images (`og-default.jpg`, `og-produceumi.jpg`) from the logos. The 16px favicon keeps a simplified "UMI" wordmark drawn from Archivo Expanded outlines, because the full logo is unreadable that small. If vector logos turn up, drop them in as the masters and rerun the script.

### Backdrop art

The club's "Brechella" xerox graphics live in `src/assets/Art/` (a mixing desk, a crowd, a guitar and a scratched disc with dancers). They're small halftones, so `npm run art` (`scripts/generate-art.mjs`) upscales and re-thresholds each into a crisp white-on-transparent stencil in `src/assets/backdrops/` (the disc is cut round), plus a `-soft` copy with its edges faded out for blending. **ArtBackdrop** (`ui/ArtBackdrop.astro`) prints stencils through CSS masks as a fine halftone screen in one ink (peri on night, cobalt on paper) with a faint orange misprint, and fades them into the page. It's decorative and hidden from assistive tech, and it loads after the page (then fades in) so it never slows the real content.

Where it's used:

- **Gallery:** all four soft copies blended into one borderless print, fixed behind the whole page (`placement="page"`). The hero drops its glow (`glow={false}`) and the hero and album sections are see-through.
- **About hero:** the disc, behind the photo print (replacing the glow).
- **Events hero:** the crowd.
- **Lessons "What you can learn":** the guitar.
- **Booking "Rent equipment":** the mixing desk, cobalt on paper.

Rules: keep single prints on the side away from the text, keep `strength` low (about 0.2–0.35) wherever body copy sits on top, and give content after a section print `position: relative`. On phones a single hero print moves to the top, behind the title. The club felt the disc clashed with the round ProduceUMI logo, so keep circular art away from that logo.

## Accessibility checklist (built in)

Skip link · visible focus rings (`--focus`) · landmark and heading structure · 44px touch targets · `aria-current` navigation · dialog-based menu and lightbox (focus contained, Esc closes, focus returns) · calendar as a real table with an agenda list on phones · form labels, inline errors and a linked error summary · decorative SVGs and glows hidden from assistive tech · exec departments in native `<details>` dropdowns · alt text required in the CMS (with a fallback for bulk gallery uploads) · a pause control on the marquee · link text matches accessible names.
