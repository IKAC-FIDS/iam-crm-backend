export const LOOKUP_GROUPS = [
  'teams',
  'departments',
  'seniority-levels',
  'persona-tags',
  'contact-types',
  'person-social-platforms',
  'company-sources',
] as const;

export type LookupGroup = (typeof LOOKUP_GROUPS)[number];
