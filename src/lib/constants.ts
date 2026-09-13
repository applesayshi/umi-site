/** Shared option lists. Keep in sync with the select widgets in public/admin/config.yml. */
export const EVENT_TYPES = ['show', 'open-mic', 'workshop', 'social', 'members-only', 'community'] as const;

export const DEPARTMENTS = [
  'Presidential',
  'Internal',
  'External',
  'Events',
  'Sound',
  'Performance',
  'Marketing',
  'Finance',
  'Education',
] as const;

export const SPONSOR_TIERS = ['headliner', 'support', 'opener', 'member-perk'] as const;
