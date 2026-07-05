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
// 13-step Slate Neutral Scale (Tailwind Slate)
// Maps to CSS: --neutral-{step}
// ─────────────────────────────────────────────
export const neutral = {
  0:   '#ffffff',
  50:  '#f8fafc',
  100: '#f1f5f9',
  150: '#e2e8f0',
  200: '#cbd5e1',
  300: '#94a3b8',
  400: '#64748b',
  500: '#475569',
  600: '#334155',
  700: '#1e293b',
  800: '#0f172a',
  900: '#020617',
  950: '#0b0f19',   // app background container fallback
} as const;

export const brand = {
  primary:         '#6366f1',  // Indigo-500
  primaryHover:    '#4f46e5',  // Indigo-600
  primaryActive:   '#4338ca',  // Indigo-700
  primaryContainer:'#3730a3',  // Indigo-800
  primaryLight:    '#a5b4fc',  // Indigo-300
  onPrimary:       '#ffffff',  // White
  onPrimaryContainer: '#e0e7ff',

  secondary:       '#f59e0b',  // Amber-500
  secondaryDim:    '#d97706',  // Amber-600
  secondaryContainer: '#92400e', // Amber-800
  onSecondary:     '#ffffff',

  success:         '#10b981',  // Emerald-500
  successContainer:'#065f46',
  onSuccess:       '#ffffff',
} as const;

// ─────────────────────────────────────────────
// Status colors
// ─────────────────────────────────────────────
export const status = {
  safe:            '#10b981',  // Emerald-500
  safeSubtle:      'rgba(16, 185, 129, 0.1)',
  safeBorder:      'rgba(16, 185, 129, 0.4)',

  warning:         '#f97316',  // Orange-500
  warningSubtle:   'rgba(249, 115, 22, 0.1)',
  warningBorder:   'rgba(249, 115, 22, 0.4)',

  danger:          '#ef4444',  // Red-500
  dangerSubtle:    'rgba(239, 68, 68, 0.1)',
  dangerBorder:    'rgba(239, 68, 68, 0.4)',

  error:           '#ef4444',
  errorContainer:  '#7f1d1d',
  onError:         '#ffffff',
} as const;

// ─────────────────────────────────────────────
// Surface / Background tokens (Slate-900 / Slate-800)
// ─────────────────────────────────────────────
export const surface = {
  background:            '#0f172a',  // Slate-900
  surface:               '#1e293b',  // Slate-800
  surfaceDim:            '#0f172a',
  surfaceBright:         '#334155',  // Slate-700
  surfaceContainerLowest:'#020617',
  surfaceContainerLow:   '#0f172a',
  surfaceContainer:      '#1e293b',
  surfaceContainerHigh:  '#334155',
  surfaceContainerHighest:'#475569',
  surfaceVariant:        '#334155',
} as const;

// ─────────────────────────────────────────────
// Text / On-surface tokens
// ─────────────────────────────────────────────
export const text = {
  primary:   '#f1f5f9',  // Slate-100
  secondary: '#94a3b8',  // Slate-400
  tertiary:  '#64748b',  // Slate-500
  disabled:  '#475569',  // Slate-600
} as const;

// ─────────────────────────────────────────────
// Border tokens
// ─────────────────────────────────────────────
export const border = {
  outline:        '#475569',  // Slate-600
  outlineVariant: '#334155',  // Slate-700
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
