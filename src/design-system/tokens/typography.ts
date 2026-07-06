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
  display:  '"Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body:     '"Sora", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:     '"JetBrains Mono", "Cascadia Code", "Fira Code", "Courier New", monospace',
} as const;

export const typeScale = {
  hero: {
    size:     '2.5rem',
    weight:   '800',
    line:     '1.1',
    tracking: '-0.02em',
    family:   'display',
  },
  h1: {
    size:     '1.75rem',
    weight:   '700',
    line:     '1.2',
    tracking: '-0.01em',
    family:   'display',
  },
  h2: {
    size:     '1.375rem',
    weight:   '600',
    line:     '1.3',
    tracking: '0',
    family:   'display',
  },
  h3: {
    size:     '1.125rem',
    weight:   '600',
    line:     '1.4',
    tracking: '0',
    family:   'display',
  },
  body: {
    size:     '0.938rem',
    weight:   '400',
    line:     '1.5',
    tracking: '0',
    family:   'body',
  },
  sm: {
    size:     '0.813rem',
    weight:   '400',
    line:     '1.5',
    tracking: '0',
    family:   'body',
  },
  xs: {
    size:     '0.75rem',
    weight:   '600',
    line:     '1.4',
    tracking: '0',
    family:   'body',
  },
  data: {
    size:     '0.75rem',
    weight:   '500',
    line:     '1.3',
    tracking: '0',
    family:   'mono',
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
