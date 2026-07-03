/**
 * spacing.ts — AttendWise Design Token: Spacing Scale
 *
 * 4px base unit. Maps to CSS custom properties --space-{n}.
 * Usage: var(--space-4) = 16px, var(--space-6) = 24px, etc.
 *
 * Convention: the number is the multiplier × 4px.
 * So --space-1 = 4px, --space-2 = 8px, --space-4 = 16px, --space-16 = 64px.
 */

export const BASE_UNIT = 4; // px

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  7:  '28px',
  8:  '32px',
  9:  '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Named semantic aliases used in layouts.
 * These map to the same underlying scale values.
 */
export const spacingAlias = {
  /** Card padding (24px) */
  cardPadding:    spacing[6],
  /** Section gutter / gap between cards (24px) */
  gutter:         spacing[6],
  /** Horizontal page margin on small screens (16px) */
  pagePaddingSm:  spacing[4],
  /** Horizontal page margin on large screens (48px = 12*4) */
  pagePaddingLg:  '48px',
  /** Minimum interactive touch target (44px) */
  touchTarget:    spacing[11],
  /** Bottom sheet inner padding (24px) */
  sheetPadding:   spacing[6],
  /** Gap between form fields (20px) */
  formFieldGap:   spacing[5],
} as const;

/**
 * CSS custom property names for spacing tokens.
 * These are the var(--space-N) names set in :root in index.css.
 */
export const spacingCssVars = {
  space1:  '--space-1',
  space2:  '--space-2',
  space3:  '--space-3',
  space4:  '--space-4',
  space5:  '--space-5',
  space6:  '--space-6',
  space7:  '--space-7',
  space8:  '--space-8',
  space9:  '--space-9',
  space10: '--space-10',
  space11: '--space-11',
  space12: '--space-12',
  space14: '--space-14',
  space16: '--space-16',
} as const;
