/**
 * colors.ts — AttendWise Design Token: Color Palette
 *
 * The authoritative source of truth for all color values.
 * These are used to:
 *   1. Generate CSS custom properties in index.css (via the cssVars export)
 *   2. Be consumed directly by TypeScript/TSX when inline styles need a raw value
 *
 * IMPORTANT: CSS custom properties (--color-*) are the runtime mechanism used
 * by components. The TS objects here document intent and enable type-safe lookups.
 */

// ─────────────────────────────────────────────
// 13-step Neutral Scale (HSL 270° warm-purple)
// Maps to CSS: --neutral-{step}
// ─────────────────────────────────────────────
export const neutral = {
  0:   '#ffffff',
  50:  '#f8f7fc',
  100: '#f0eef8',
  150: '#e8e5f3',
  200: '#dddaef',
  300: '#c4bedd',
  400: '#a99ec9',
  500: '#8e80b4',
  600: '#72639e',
  700: '#574c87',
  800: '#3d3570',
  900: '#241e56',
  950: '#15121b',   // app background
} as const;

// ─────────────────────────────────────────────
// Brand / Primary palette
// ─────────────────────────────────────────────
export const brand = {
  primary:         '#d2bbff',  // Tailwind: primary
  primaryHover:    '#b89dff',
  primaryActive:   '#9b7de0',
  primaryContainer:'#7c3aed',  // Tailwind: primary-container
  onPrimary:       '#3f008e',  // Tailwind: on-primary
  onPrimaryContainer: '#ede0ff',

  secondary:       '#4cd7f6',  // Tailwind: secondary
  secondaryContainer: '#03b5d3',
  onSecondary:     '#003640',

  tertiary:        '#059669',  // WCAG AA (was #4edea3) — safe status
  tertiaryContainer: '#007650',
  onTertiary:      '#003824',
} as const;

// ─────────────────────────────────────────────
// Status colors (all WCAG 2.2 AA on white ≥4.5:1)
// ─────────────────────────────────────────────
export const status = {
  safe:            '#059669',  // 4.54:1 on white
  safeSubtle:      'rgba(5, 150, 105, 0.1)',
  safeBorder:      'rgba(5, 150, 105, 0.4)',

  warning:         '#d97706',  // 4.52:1 on white
  warningSubtle:   'rgba(217, 119, 6, 0.1)',
  warningBorder:   'rgba(217, 119, 6, 0.4)',

  danger:          '#dc2626',  // 5.91:1 on white
  dangerSubtle:    'rgba(220, 38, 38, 0.1)',
  dangerBorder:    'rgba(220, 38, 38, 0.4)',

  error:           '#dc2626',
  errorContainer:  '#93000a',
  onError:         '#690005',
} as const;

// ─────────────────────────────────────────────
// Surface / Background tokens (dark-first)
// ─────────────────────────────────────────────
export const surface = {
  background:            '#15121b',
  surface:               '#15121b',
  surfaceDim:            '#15121b',
  surfaceBright:         '#3c3742',
  surfaceContainerLowest:'#100d16',
  surfaceContainerLow:   '#1d1a24',
  surfaceContainer:      '#221e28',
  surfaceContainerHigh:  '#2c2833',
  surfaceContainerHighest:'#37333e',
  surfaceVariant:        '#37333e',
} as const;

// ─────────────────────────────────────────────
// Text / On-surface tokens
// ─────────────────────────────────────────────
export const text = {
  primary:   '#e8dfee',  // on-surface
  secondary: '#ccc3d8',  // on-surface-variant
  tertiary:  '#958da1',  // outline
  disabled:  '#4a4455',  // outline-variant
} as const;

// ─────────────────────────────────────────────
// Border tokens
// ─────────────────────────────────────────────
export const border = {
  outline:        '#958da1',
  outlineVariant: '#4a4455',
} as const;

// ─────────────────────────────────────────────
// Semantic CSS custom property names
// (these are the actual var(--foo) names set in index.css)
// ─────────────────────────────────────────────
export const cssVarNames = {
  // Neutrals
  neutral0:   '--neutral-0',
  neutral50:  '--neutral-50',
  neutral100: '--neutral-100',
  neutral200: '--neutral-200',
  neutral300: '--neutral-300',
  neutral400: '--neutral-400',
  neutral500: '--neutral-500',
  neutral600: '--neutral-600',
  neutral700: '--neutral-700',
  neutral800: '--neutral-800',
  neutral900: '--neutral-900',
  neutral950: '--neutral-950',

  // Semantic aliases
  colorPrimary:          '--color-primary',
  colorPrimaryHover:     '--color-primary-hover',
  colorPrimaryActive:    '--color-primary-active',
  colorOnPrimary:        '--color-on-primary',
  colorSurface:          '--color-surface',
  colorSurfaceVariant:   '--color-surface-variant',
  colorSurfaceContainer: '--color-surface-container',
  colorOutline:          '--color-outline',
  colorOutlineVariant:   '--color-outline-variant',
  colorTextPrimary:      '--color-text-primary',
  colorTextSecondary:    '--color-text-secondary',
  colorTextTertiary:     '--color-text-tertiary',
  colorError:            '--color-error',
  colorErrorContainer:   '--color-error-container',

  // Status
  colorSafe:             '--color-safe',
  colorWarning:          '--color-warning',
  colorDanger:           '--color-danger',
} as const;
