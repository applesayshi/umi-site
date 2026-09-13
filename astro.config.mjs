// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cmsMedia from './integrations/cms-media.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ubcmusicinitiative.com',

  // Astro 7 defaults to JSX whitespace rules, which silently drop the space
  // between a line of text and an inline element on the next line. Content
  // editors and future maintainers will write normal HTML, so keep HTML rules.
  compressHTML: true,

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/contact/thanks'),
    }),
    cmsMedia(),
  ],

  devToolbar: {
    enabled: false,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  image: {
    // Keep generated widths modest: most photos render at <= 1400 CSS px.
    breakpoints: [360, 540, 720, 960, 1280, 1600, 2000],
  },

  fonts: [
    {
      // Extended heavy grotesque for headlines, matching the wide lettering of the UMI logo.
      // Served from Google Fonts pinned to the 125% width instance, so only the expanded cut downloads.
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-display',
      weights: [800, 900],
      styles: ['normal'],
      fallbacks: ['Arial Black', 'Helvetica Neue', 'sans-serif'],
      options: {
        experimental: {
          variableAxis: { wdth: ['125'] },
        },
      },
    },
    {
      // The elegant counter-voice: subtitles, pull quotes, emphasis.
      provider: fontProviders.fontsource(),
      name: 'Instrument Serif',
      cssVariable: '--font-serif',
      weights: [400],
      styles: ['normal', 'italic'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Workhorse grotesque for body copy and UI.
      provider: fontProviders.fontsource(),
      name: 'Archivo',
      cssVariable: '--font-sans',
      // Two static cuts (~20 KB each) instead of the ~90 KB variable font.
      weights: [400, 600],
      styles: ['normal'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    },
    {
      // Ticket stubs, timecodes, labels.
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
