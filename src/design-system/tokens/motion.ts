/**
 * motion.ts — AttendWise Design Token: Animation & Transition
 *
 * Duration and easing tokens for all transitions/animations.
 * All values respect prefers-reduced-motion — components should
 * use the CSS custom properties which are overridden in the
 * @media (prefers-reduced-motion: reduce) block in index.css.
 *
 * CSS custom properties:
 *   --duration-{key}, --easing-{key}
 */

/**
 * Duration scale in milliseconds.
 * Named semantically (instant, fast, moderate, slow, xslow) for intent clarity.
 */
export const duration = {
  /** 0ms — no transition, immediate (reduced-motion fallback) */
  instant:  '0ms',
  /** 100ms — micro-interactions (button press, toggle flick) */
  fast:     '100ms',
  /** 200ms — standard UI transitions (hover, focus ring) */
  base:     '200ms',
  /** 300ms — content transitions (card expand, status change) */
  moderate: '300ms',
  /** 500ms — complex transitions (page transitions, progress rings) */
  slow:     '500ms',
  /** 250ms — BottomSheet slide animation */
  sheet:    '250ms',
} as const;

/**
 * Easing curves.
 * Named after their physical behaviour rather than CSS function name.
 */
export const easing = {
  /** Standard Material-style deceleration — entering elements */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Standard acceleration — exiting elements */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Standard — elements that move without entering/exiting */
  standard:   'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Spring-like — BottomSheet slide, expressive moments */
  spring:     'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Linear — progress bars, loading indicators */
  linear:     'linear',
} as const;

export type DurationKey = keyof typeof duration;
export type EasingKey   = keyof typeof easing;

/**
 * CSS custom property names.
 */
export const motionCssVars = {
  durationInstant:  '--duration-instant',
  durationFast:     '--duration-fast',
  durationBase:     '--duration-base',
  durationModerate: '--duration-moderate',
  durationSlow:     '--duration-slow',
  durationSheet:    '--duration-sheet',

  easingDecelerate: '--easing-decelerate',
  easingAccelerate: '--easing-accelerate',
  easingStandard:   '--easing-standard',
  easingSpring:     '--easing-spring',
  easingLinear:     '--easing-linear',
} as const;
