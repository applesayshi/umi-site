export interface NavItem {
  label: string;
  href: string;
  /** Short line shown in the full-screen menu. */
  note?: string;
}

/** Shown in the header bar on large screens. */
export const primaryNav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'ProduceUMI', href: '/produceumi' },
  { label: 'Gallery', href: '/gallery' },
];

/** Everything, shown in the full-screen menu and footer. Track numbers mimic a record sleeve. */
export const fullNav: NavItem[] = [
  { label: 'Home', href: '/', note: 'Side A starts here' },
  { label: 'About', href: '/about', note: 'Execs, history, mission' },
  { label: 'Events', href: '/events', note: 'Calendar & past shows' },
  { label: 'ProduceUMI', href: '/produceumi', note: 'Songs made with UMI' },
  { label: 'Gallery', href: '/gallery', note: 'Photos from the floor' },
  { label: 'Lessons', href: '/lessons', note: 'Learn from students' },
  { label: 'Booking & Rentals', href: '/booking', note: 'Hire acts, borrow gear' },
  { label: 'Sponsors', href: '/sponsors', note: 'Partner with UMI' },
  { label: 'Join', href: '/join', note: '$10 for UBC students' },
  { label: 'Contact', href: '/contact', note: 'Say hello' },
];

export const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** "A1", "A2" ... "B1" — a track number for each position, five tracks per side. */
export const trackNumber = (index: number) => `${index < 5 ? 'A' : 'B'}${(index % 5) + 1}`;
