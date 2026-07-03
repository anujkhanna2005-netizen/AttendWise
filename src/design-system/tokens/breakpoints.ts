/**
 * breakpoints.ts — AttendWise Design Token: Responsive Breakpoints
 *
 * Matches the Tailwind defaults used in component classNames (sm/md/lg/xl/2xl).
 * Documented here as the single source of truth for any JS-based responsive logic
 * (e.g. window.matchMedia checks, ResizeObserver, Capacitor layout decisions).
 *
 * CSS custom properties: none (breakpoints are compile-time only in CSS/Tailwind).
 * These are JS/TS-only tokens.
 */

export const breakpoints = {
  /** 475px — small phones in landscape */
  xs:  475,
  /** 640px — Tailwind `sm` — large phones */
  sm:  640,
  /** 768px — Tailwind `md` — tablets */
  md:  768,
  /** 1024px — Tailwind `lg` — desktop sidebar appears */
  lg:  1024,
  /** 1280px — Tailwind `xl` — wide desktop */
  xl:  1280,
  /** 1536px — Tailwind `2xl` — ultra-wide */
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Media query strings for use with window.matchMedia.
 * Usage: window.matchMedia(mediaQueries.lg).matches
 */
export const mediaQueries = {
  xs:    `(min-width: ${breakpoints.xs}px)`,
  sm:    `(min-width: ${breakpoints.sm}px)`,
  md:    `(min-width: ${breakpoints.md}px)`,
  lg:    `(min-width: ${breakpoints.lg}px)`,
  xl:    `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,

  /** Mobile-first: screens narrower than lg (sidebar hidden) */
  mobile:  `(max-width: ${breakpoints.lg - 1}px)`,
  /** Tablet range */
  tablet:  `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  /** Desktop and above */
  desktop: `(min-width: ${breakpoints.lg}px)`,

  /** Accessibility */
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDark:          '(prefers-color-scheme: dark)',
} as const;
