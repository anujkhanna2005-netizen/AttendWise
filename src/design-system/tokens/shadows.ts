/**
 * shadows.ts — AttendWise Design Token: Shadow / Elevation System
 *
 * 5-level elevation system (0–4).
 * The app uses a dark glassmorphism aesthetic, so shadows use:
 *   - Subtle dark umbra shadows (semi-transparent black)
 *   - Colored glow accents for branded elevation (indigo/cyan)
 *
 * CSS custom properties: --elevation-{0..4}
 * Additionally: --glow-primary, --glow-secondary, --glow-error, --glow-none
 */

/**
 * Elevation levels — ordered lowest → highest.
 * Each level stacks two shadow layers: umbra (dark) + penumbra (diffuse).
 */
export const elevation = {
  /** Level 0 — flat, no depth (cards in lowest context) */
  0: 'none',

  /** Level 1 — subtle lift (standard card resting state) */
  1: '0 1px 2px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',

  /** Level 2 — moderate depth (hovered card, dropdown) */
  2: '0 2px 8px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.25)',

  /** Level 3 — strong depth (BottomSheet, dialogs, FAB) */
  3: '0 8px 24px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.3)',

  /** Level 4 — highest (full-screen overlays, tooltips above sheets) */
  4: '0 16px 48px rgba(0,0,0,0.5), 0 32px 64px rgba(0,0,0,0.35)',
} as const;

/**
 * Neon glow accents — used as brand-specific shadow overlays.
 * These are typically combined with an elevation level via CSS:
 *   box-shadow: var(--elevation-2), var(--glow-primary);
 */
export const glows = {
  /** Primary brand glow (indigo) — primary buttons, FAB, selected states */
  primary:   '0 0 15px rgba(129, 140, 248, 0.4)',
  /** Secondary glow (teal) — live indicators, session stats card */
  secondary: '0 0 15px rgba(45, 212, 191, 0.3)',
  /** Error/danger glow — delete confirmation, critical warnings */
  error:     '0 0 15px rgba(248, 113, 113, 0.35)',
  /** BottomSheet top shadow — upward projection */
  sheet:     '0 -10px 40px rgba(129, 140, 248, 0.1)',
  /** No glow */
  none:      'none',
} as const;

export type ElevationLevel = keyof typeof elevation;
export type GlowKey = keyof typeof glows;

/**
 * CSS custom property names.
 */
export const shadowCssVars = {
  elevation0: '--elevation-0',
  elevation1: '--elevation-1',
  elevation2: '--elevation-2',
  elevation3: '--elevation-3',
  elevation4: '--elevation-4',

  glowPrimary:   '--glow-primary',
  glowSecondary: '--glow-secondary',
  glowError:     '--glow-error',
  glowSheet:     '--glow-sheet',
} as const;
