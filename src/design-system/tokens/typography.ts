/**
 * typography.ts — AttendWise Design Token: Type Scale
 *
 * Implements display/headline/title/body/label/caption tiers.
 * Uses clamp() for fluid sizing on headline tiers.
 *
 * CSS custom properties generated:
 *   --text-{tier}-size, --text-{tier}-weight, --text-{tier}-line, --text-{tier}-tracking
 *
 * Font stacks:
 *   - Display / Headline / Body: "Sora" (Google Fonts), fallback → system-ui, -apple-system, sans-serif
 *   - Monospace / Label:         "JetBrains Mono" (Google Fonts), fallback → "Cascadia Code", "Fira Code", monospace
 */

export const fontFamily = {
  display:  '"Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body:     '"Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:     '"JetBrains Mono", "Cascadia Code", "Fira Code", "Courier New", monospace',
} as const;

/**
 * Type scale tiers.
 * clamp(min, preferred, max) gives fluid sizing between breakpoints.
 *
 * Preferred value uses vw units: e.g. 2.5vw means it scales with viewport width.
 * At 375px viewport: 2.5vw ≈ 9.4px (but clamped to min)
 * At 1440px viewport: 2.5vw ≈ 36px (but clamped to max)
 */
export const typeScale = {
  /** Large display — hero numbers, epoch time */
  displayLg: {
    size:     'clamp(2.5rem, 5vw, 4rem)',    // 40px → 64px
    weight:   '700',
    line:     '1.15',
    tracking: '-0.03em',
    family:   'display',
  },
  /** Standard headline — section titles */
  headlineLg: {
    size:     'clamp(1.5rem, 3vw, 2rem)',    // 24px → 32px
    weight:   '600',
    line:     '1.25',
    tracking: '-0.01em',
    family:   'display',
  },
  /** Sub-headline — card headers, sheet titles */
  headlineMd: {
    size:     'clamp(1.125rem, 2vw, 1.5rem)', // 18px → 24px
    weight:   '600',
    line:     '1.333',
    tracking: '-0.005em',
    family:   'display',
  },
  /** Title — bento grid panel headers */
  titleMd: {
    size:     '1rem',      // 16px — fixed, no fluid scaling needed
    weight:   '600',
    line:     '1.5',
    tracking: '0',
    family:   'display',
  },
  /** Body text — descriptions, messages */
  bodyLg: {
    size:     '1rem',      // 16px
    weight:   '400',
    line:     '1.5',
    tracking: '0',
    family:   'body',
  },
  bodySm: {
    size:     '0.875rem',  // 14px
    weight:   '400',
    line:     '1.428',
    tracking: '0',
    family:   'body',
  },
  /** Monospace label — the dominant type in this terminal-themed UI */
  labelCaps: {
    size:     '0.75rem',   // 12px
    weight:   '500',
    line:     '1.333',
    tracking: '0.1em',
    family:   'mono',
  },
  labelSm: {
    size:     '0.625rem',  // 10px
    weight:   '500',
    line:     '1.2',
    tracking: '0.1em',
    family:   'mono',
  },
  /** Caption — timestamps, metadata */
  caption: {
    size:     '0.75rem',   // 12px
    weight:   '400',
    line:     '1.333',
    tracking: '0',
    family:   'body',
  },
} as const;

export type TypeScaleKey = keyof typeof typeScale;

/**
 * CSS custom property names for type scale.
 * Each tier gets four properties: -size, -weight, -line, -tracking.
 */
export const typeCssVars = {
  displayLgSize:     '--text-display-lg-size',
  displayLgWeight:   '--text-display-lg-weight',
  displayLgLine:     '--text-display-lg-line',
  displayLgTracking: '--text-display-lg-tracking',

  headlineLgSize:     '--text-headline-lg-size',
  headlineLgWeight:   '--text-headline-lg-weight',
  headlineLgLine:     '--text-headline-lg-line',
  headlineLgTracking: '--text-headline-lg-tracking',

  headlineMdSize:     '--text-headline-md-size',
  headlineMdWeight:   '--text-headline-md-weight',
  headlineMdLine:     '--text-headline-md-line',
  headlineMdTracking: '--text-headline-md-tracking',

  titleMdSize:     '--text-title-md-size',
  titleMdWeight:   '--text-title-md-weight',
  titleMdLine:     '--text-title-md-line',
  titleMdTracking: '--text-title-md-tracking',

  bodyLgSize:     '--text-body-lg-size',
  bodyLgWeight:   '--text-body-lg-weight',
  bodyLgLine:     '--text-body-lg-line',

  bodySmSize:     '--text-body-sm-size',
  bodySmWeight:   '--text-body-sm-weight',
  bodySmLine:     '--text-body-sm-line',

  labelCapsSize:     '--text-label-caps-size',
  labelCapsWeight:   '--text-label-caps-weight',
  labelCapsLine:     '--text-label-caps-line',
  labelCapsTracking: '--text-label-caps-tracking',

  labelSmSize:     '--text-label-sm-size',
  labelSmWeight:   '--text-label-sm-weight',
  labelSmLine:     '--text-label-sm-line',
  labelSmTracking: '--text-label-sm-tracking',

  captionSize:   '--text-caption-size',
  captionWeight: '--text-caption-weight',
  captionLine:   '--text-caption-line',
} as const;
