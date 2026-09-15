# UBC Music Initiative (UMI) website

The website for UMI, UBC's student-run music club. A fast static site built with [Astro](https://astro.build), edited through a browser-based content manager ([Decap CMS](https://decapcms.org)), and hosted on [Netlify](https://www.netlify.com).

- **For execs editing content:** read [Editing the site](#editing-the-site).
- **For whoever launches it:** read [Going live](#going-live) and the [launch checklist](#launch-checklist).
- **For developers:** read [Development](#development) and [DESIGN.md](DESIGN.md).

---

## Editing the site

Open **`https://www.ubcmusicinitiative.com/admin/`** and log in with GitHub. You need to be a collaborator on the GitHub repository; ask the current webmaster to add you.

| Section in the CMS | What it controls |
| --- | --- |
| **Events** | Every show, open mic, workshop and social. Every event is on the Events page calendar. The "Upcoming events" lists on the home page and Events page show only the next three weeks, so a new event appears there once it's three weeks away. Once an event ends it moves to the "Past shows" dropdown at the bottom of the Events page by itself. |
| **Gallery albums** | Photo albums. Link an album to its event and the two pages point to each other. Newer albums fill the film strip on the home page. **Upload photos** (above the photo list) adds a whole roll at once: choose or drop as many photos as you like and they're resized for the web before uploading. |
| **ProduceUMI songs** | The ProduceUMI artist showcase. Arrange the order under **Pages → ProduceUMI page → Song order** by dragging songs up and down; the first three appear on the home page. New songs show at the end, in the order they were added, until you place them in that list. Paste the song's **Spotify link** to add a Spotify button everywhere the song is listed (and a Spotify player on its page). Upload a 15–30 second MP3 as the **Song snippet** and clicking the record plays it; one snippet plays at a time. **Listen link** is optional, for a SoundCloud or YouTube player instead. |
| **Exec team** | The About page. Turn on **President or VP** to give someone a full card under "Meet the execs"; everyone is listed in their department's dropdown. Switch off **Current exec** for people who have moved on instead of deleting them. |
| **Sponsors & partners** | Logos and member perks on the Sponsors page. |
| **Pages** | Headings, paragraphs, photos, prices, FAQs and steps on Home, ProduceUMI, About, Join, Booking & Rentals, Lessons, Sponsors and Contact. On the Home page, **Ribbon photos** are the prints drifting under the hero; leave the list empty to use gallery photos and covers automatically. |
| **Site settings** | Email, office, social links, membership and newsletter links, the announcement bar, the land acknowledgement and an optional logo. |

Press **Publish → Publish now** to save. The live site updates about a minute later.

**Every Publish rebuilds the site, and each rebuild uses Netlify credits** (15 of the free plan's 300 a month, so roughly 20 publishes a month; if the credits run out, Netlify pauses the site until the next month). For a big round of edits, batch them: in Netlify, go to *Project configuration → Build & deploy → Continuous deployment → Build settings → Configure* and set **Build status** to **Stopped builds**, then make all your edits in the CMS (they're saved to GitHub, but the live site doesn't change). When you're done, set it back to **Active builds** and press *Deploys → Trigger deploy* once. (While builds are stopped, Trigger deploy is unavailable, so reactivate first.)

### Tips

- **Photos:** JPG or PNG, about 2400px on the long edge, under 3 MB. The site automatically makes small, fast versions for phones. Always fill in the photo **description** so screen-reader users know what's in it.
- **Crop position:** where a photo is shown cropped (cards, prints, the film strip), the **Crop position** field under it shows the whole photo with a bright box for each shape the site uses. Drag the box over the part to keep; the dimmed part is cut off. **Centre** resets it.
- **Times:** the time picker uses your device's time zone. Enter event times in Vancouver time.
- **Emphasis:** in the home page's big statement, wrap one word in `*asterisks*` to set it in bold capitals circled in marker.
- **Long titles are fine:** headings shrink to fit their column, so a long word in an event or song title won't break mid-word.
- **"Sample" stamps:** anything marked **Sample entry** shows a small orange "Sample" stamp on the site. That's placeholder content shipped with the site; replace it, then switch the toggle off (or delete the entry). In the Events list, use **Filter by → Sample entries to replace**.
- **Hide something without deleting it:** events have a **Hide from the site (draft)** toggle.

---

## Launch checklist

Content that is currently placeholder and needs to be real before launch:

- [x] **Logos:** the UMI and ProduceUMI logos are in `src/assets/brand/`. If vector versions (SVG, AI or PDF) exist, send them over for sharper results.
- [ ] **Photos:** replace the generated placeholder images (everything in `src/assets/uploads/placeholders/`) with real event photos: home page hero and about photo, page hero photos, event covers, album photos, exec portraits and song cover art.
- [ ] **Upcoming events:** all Fall 2026 events are samples. Replace them with the real calendar.
- [ ] **Exec team:** every exec is a sample ("Your Name"). Add real names, roles, photos and bios, and delete sample roles you don't have.
- [ ] **ProduceUMI:** all six songs are fictional samples. Add real songs from this year and last year, and set the sign-up link on the ProduceUMI page. The sample songs' snippets are synthesized placeholder loops (`public/audio/snippets/`) and their Spotify links are only Spotify searches: delete them with the samples.
- [ ] **Gallery albums:** the three albums use placeholder photos.
- [ ] **Lessons page:** pricing, locations, intake dates and sign-up links are placeholders.
- [ ] **Sponsors:** confirm the member-perk partners (Tapestry Music, Storagebox, OVO Medi Spa, taken from the old site) are current, and set the real sponsorship tiers.
- [ ] **About timeline:** add the founding year and story. Past events from 2021–2025 were taken from the old site; times weren't listed there, so they're hidden. Check the details.
- [ ] Search the project for `sample: true` to confirm nothing is left.

---

## Going live

These are one-time steps, about 30–45 minutes in total.

1. **Put the code on GitHub.** Create a repository (for example `umi-site`) on a club-owned GitHub account or organisation, and push this folder to it.
2. **Point the CMS at the repository.** In `public/admin/config.yml`, set `backend.repo` to `your-account/umi-site`, then commit.
3. **Create the Netlify site.** Netlify → *Add new site → Import an existing project* → choose the repository. The build settings are read from `netlify.toml` automatically.
4. **Turn on CMS login.**
   1. On GitHub, go to *Settings → Developer settings → OAuth Apps → New OAuth App*.
   2. Set the callback URL to `https://api.netlify.com/auth/done`.
   3. In Netlify, go to *Site configuration → Access & security → OAuth → Install provider → GitHub* and paste the client ID and secret.
5. **Invite editors.** Add each exec as a collaborator on the GitHub repository. They log in at `/admin/` with their own GitHub account.
6. **Contact form emails.** In Netlify, go to *Forms*, enable form detection, then add an email notification to `ubcmusicinitiative@gmail.com`. Messages also appear in the Netlify dashboard.
7. **Connect the domain.** The club already owns `ubcmusicinitiative.com` (managed in Squarespace, where the old site lives), so there's nothing to buy.
   1. Netlify → *Domain management → Add a domain* → `www.ubcmusicinitiative.com`, and let it add `ubcmusicinitiative.com` too. Make `www` the primary domain (it matches `site` in `astro.config.mjs`).
   2. In Squarespace → *Domains → ubcmusicinitiative.com → DNS*, delete the Squarespace defaults (the four `A` records for `@` and the `www` `CNAME` to `ext-sq.squarespace.com`), then add the records Netlify shows: an `A` record for `@` pointing to Netlify's load balancer, and a `CNAME` for `www` pointing to `ubcmusicinitiative.netlify.app`.
   3. Wait for Netlify to verify the DNS and issue the HTTPS certificate (usually under an hour, sometimes up to a day). The domain has no email (MX) records, so nothing else is affected.
   4. The old Squarespace site stops showing once DNS switches, so cancel its website plan afterwards, but keep the domain registration (it renews in September 2027).
   Old Squarespace links such as `/joinus` and `/pastevents` already redirect to the new pages.
8. **Rebuilds.** Don't schedule automatic daily rebuilds on the free plan: 30 rebuilds a month is 450 credits, more than the 300 included, and Netlify would pause the site. They aren't needed anyway: the upcoming lists and "Past shows" correct themselves in visitors' browsers between deploys. `.github/workflows/daily-rebuild.yml` only runs when started by hand (GitHub → *Actions → Rebuild the site → Run workflow*), after adding a Netlify build hook URL as the `NETLIFY_BUILD_HOOK` repository secret.

Once live, submit `https://www.ubcmusicinitiative.com/sitemap-index.xml` in Google Search Console.

---

## Development

Requires Node 22.12 or newer (24 recommended).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run check      # type-check .astro and .ts files
```

**Edit content locally without GitHub:** run `npm run cms` in one terminal and `npm run dev` in another, then open `http://localhost:4321/admin/index.html` and click **Login**. Changes are written straight to the files in `src/content/`.

**Regenerate generated assets:**

```bash
npm run placeholders   # placeholder photos, portraits and cover art
npm run brand          # cleaned-up logos (src/assets/brand/), favicons + social share images (public/)
npm run art            # backdrop stencils (src/assets/backdrops/) from the Brechella art in src/assets/Art/
npm run textures       # film grain + paper speckle tiles
```

### Project map

```
src/
  content/           Everything editable in the CMS (Markdown + YAML)
  content.config.ts  Content schema; public/admin/config.yml mirrors it
  assets/uploads/    Images uploaded through the CMS
  pages/             Routes (/, /about, /events, /events/[slug], /gallery, ...)
  assets/brand/      Logo originals (UMI.PNG, PRODUCEUMI.PNG) and the cleaned-up versions the site uses
  components/        home/, events/, gallery/, produce/, about/, layout/, ui/
  layouts/           BaseLayout (SEO, fonts, header, footer)
  lib/               Content helpers, dates (Vancouver time), iCal, icons, headline fitting
  scripts/           Client scripts: reveals, hero canvas
  styles/            tokens.css, base.css, components.css, motion.css
integrations/        cms-media: serves original uploads for CMS thumbnails
public/admin/        Decap CMS
scripts/             Asset generators (placeholders, brand, backdrop art, textures)
```

### How a few things work

- **Images:** content references images relative to the content file (`../../assets/uploads/photo.jpg`). Astro turns each into responsive AVIF/WebP at build time. Every content file lives exactly two folders below `src/`, which keeps those paths valid.
- **Upcoming vs. past:** decided at build time, then corrected in the browser, so the site stays right between deploys without rebuilding. The upcoming lists cover the next 21 days by Vancouver date (`UPCOMING_DAYS` in `src/lib/upcoming.ts`); later events are rendered hidden so the browser can roll the list forward. "Past shows" is built with every event and shows only the ones that have ended, and each event page carries both its upcoming and "This show has wrapped" states.
- **CMS widgets:** `public/admin/widgets.js` adds two widgets to Decap: `photos` (a list with bulk upload) and `focus` (crop position). Crop positions are CSS `object-position` values stored next to each photo (`focus`, `coverFocus`, `photoFocus`) and applied with `Photo`'s `position` prop or `cropStyle()` from `src/lib/content.ts`. The widgets use Decap internals, so re-test them after upgrading Decap.
- **Calendar:** `/calendar.ics` is a live feed people can subscribe to, and each event has its own `.ics` file plus a Google Calendar link.
- **Contact form:** Netlify Forms. No server code is needed; locally the form shows its "couldn't send" fallback.
- **Embeds:** Spotify, SoundCloud and YouTube players don't load until someone presses play, so there are no third-party scripts or cookies on page load.
