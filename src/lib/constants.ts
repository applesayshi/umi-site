/** Shared option lists. Keep in sync with the select widgets in public/admin/config.yml. */
export const EVENT_TYPES = ['show', 'open-mic', 'workshop', 'social', 'members-only', 'community'] as const;

/** The club's departments, in the order the About page lists them. */
export const DEPARTMENTS = [
  'Admin',
  'Finance',
  'Events',
  'Sound',
  'Marketing',
  'Performance',
  'External',
  'Internal',
  'Education',
  'Engagement',
] as const;

export const SPONSOR_TIERS = ['headliner', 'support', 'opener', 'member-perk'] as const;
