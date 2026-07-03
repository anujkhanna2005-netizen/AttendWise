/**
 * radius.ts — AttendWise Design Token: Border Radius Scale
 *
 * A 6-step radius system replacing the previous ad-hoc 3-value system
 * (rounded, rounded-xl, rounded-2xl scattered inconsistently).
 *
 * CSS custom properties: --radius-{tier}
 */

export const radius = {
  /** 4px — tight corners, badges, terminal-style chips */
  xs:   '4px',
  /** 8px — buttons, small cards */
  sm:   '8px',
  /** 12px — standard cards, inputs */
  md:   '12px',
  /** 16px — large cards, modals */
  lg:   '16px',
  /** 24px — bottom sheets, FABs, prominent CTAs */
  xl:   '24px',
  /** 9999px — pill badges, circular avatars, status dots */
  full: '9999px',
} as const;

export type RadiusKey = keyof typeof radius;

/**
 * Semantic radius aliases: map component roles to scale values.
 * Using these lets Phase 3 change a whole category by updating one alias.
 */
export const radiusAlias = {
  /** Inline status badge (SAFE / WARN / DANGER chips) → xs */
  badge:       radius.xs,
  /** Standard interactive buttons → sm */
  button:      radius.sm,
  /** Text inputs and form fields → md */
  input:       radius.md,
  /** Standard content cards → md */
  card:        radius.md,
  /** BottomSheet container → lg (top corners only via CSS) */
  sheet:       radius.lg,
  /** Prominent CTAs (Setup Wizard button, Save button) → xl */
  ctaButton:   radius.xl,
  /** Color picker circles → full */
  colorSwatch: radius.full,
} as const;

/**
 * CSS custom property names.
 */
export const radiusCssVars = {
  xs:   '--radius-xs',
  sm:   '--radius-sm',
  md:   '--radius-md',
  lg:   '--radius-lg',
  xl:   '--radius-xl',
  full: '--radius-full',
} as const;
