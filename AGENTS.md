## Project

UBC Music Initiative (UMI) club website. Astro 7 static site + Decap CMS, deployed on Netlify.
Read `README.md` (editing, launch, structure) and `DESIGN.md` (design system) before changing anything visual.

- Content lives in `src/content/` and is edited through `/admin` (Decap). `src/content.config.ts` and `public/admin/config.yml` must stay in sync.
- Content files sit exactly two folders below `src/`, so CMS image paths are `../../assets/uploads/...`. Don't nest content deeper.
- Styling is vanilla CSS with tokens in `src/styles/tokens.css`; components use semantic tokens (`--fg`, `--bg`, `--accent`, `--hot`) set by `theme-night` / `theme-navy` / `theme-paper` / `theme-cobalt` / `theme-peri` / `theme-orange`.
- Display headings that show CMS text use `fitStyle()` from `src/lib/fit.ts` plus a `container-type: inline-size` column, so long words shrink instead of breaking (see DESIGN.md).
- Single-column grids use `minmax(0, 1fr)`; check new layouts at 320px for sideways overflow.
- Internal page links end with `/` (`/events/`, `/contact/?topic=…`): pages build as folders, and Netlify redirects the slashless form. Pass links typed into the CMS through `pageHref()` from `src/lib/site.ts`.
- Don't name a component prop `as`: astro check stops reading that component's `Props` interface.
- Logos: `src/assets/brand/umi-logo.png` and `produceumi-logo.png` are generated from the club's originals (`UMI.PNG`, `PRODUCEUMI.PNG`) by `npm run brand`. Regenerate rather than hand-editing them.
- Backdrop art: `src/assets/backdrops/*.png` are stencils generated from the club's art in `src/assets/Art/` by `npm run art`, and `ui/ArtBackdrop.astro` prints them into page backgrounds (see DESIGN.md › Backdrop art). The `Art` folder name is capitalised: keep import paths' case exact, because Netlify builds on a case-sensitive filesystem.
- Dates display in Vancouver time via `src/lib/dates.ts`. Date-only fields are pinned to 12:00 UTC in the schema.
- Motion must respect `prefers-reduced-motion`, and photo flashes stay rate-limited (see `src/scripts/reveal.ts`).
- `compressHTML: true` is deliberate (Astro 7's JSX whitespace rules drop spaces around inline elements).
- Scoped styles don't reach child components: use `.parent :global(.child-class)`.
- Photos stay in natural colour: no filters or tints over them (the club had the old duotone removed). Cropped images take their CMS "Crop position" (`focus` / `coverFocus` / `photoFocus`) through `Photo`'s `position` prop or `cropStyle()`.
- `public/admin/widgets.js` defines the `photos` (bulk upload) and `focus` (crop position) CMS widgets on top of Decap internals; re-test both after changing the pinned Decap version.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.
Local CMS: `npm run cms` then open `http://localhost:4321/admin/index.html`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
