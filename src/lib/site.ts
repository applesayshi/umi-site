export interface NavItem {
  label: string;
  href: string;
  /** Short line shown in the full-screen menu. */
  note?: string;
}

/**
 * Internal links end with "/": every page is built as a folder (about/index.html), and without the slash
 * Netlify answers with a redirect before the page. Write fixed links that way; pass links typed into the CMS
 * through pageHref(), which adds the slash and leaves external links, anchors, email links and files alone.
 */
export function pageHref(href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const [, path, rest] = href.match(/^([^?#]*)(.*)$/) ?? ['', href, ''];
  if (path.endsWith('/') || /\.[a-z0-9]+$/i.test(path)) return href;
  return `${path}/${rest}`;
}

/** Shown in the header bar on large screens. */
export const primaryNav: NavItem[] = [
  { label: 'About', href: '/about/' },
  { label: 'Events', href: '/events/' },
  { label: 'ProduceUMI', href: '/produceumi/' },
  { label: 'Gallery', href: '/gallery/' },
];

/** Everything, shown in the full-screen menu and footer. Track numbers mimic a record sleeve. */
export const fullNav: NavItem[] = [
  { label: 'Home', href: '/', note: 'Side A starts here' },
  { label: 'About', href: '/about/', note: 'Execs, history, mission' },
  { label: 'Events', href: '/events/', note: 'Calendar & past shows' },
  { label: 'ProduceUMI', href: '/produceumi/', note: 'Songs made with UMI' },
  { label: 'Gallery', href: '/gallery/', note: 'Photos from the floor' },
  { label: 'Lessons', href: '/lessons/', note: 'Learn from students' },
  { label: 'Booking & Rentals', href: '/booking/', note: 'Hire acts, borrow gear' },
  { label: 'Sponsors', href: '/sponsors/', note: 'Partner with UMI' },
  { label: 'Join', href: '/join/', note: '$10 for UBC students' },
  { label: 'Contact', href: '/contact/', note: 'Say hello' },
];

/** Whether a nav link points at the current page or one of its sub-pages. `pathname` has no trailing slash. */
export const isActive = (pathname: string, href: string) => {
  const target = href.replace(/\/$/, '') || '/';
  return target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(`${target}/`);
};

/** "A1", "A2" ... "B1" — a track number for each position, five tracks per side. */
export const trackNumber = (index: number) => `${index < 5 ? 'A' : 'B'}${(index % 5) + 1}`;
