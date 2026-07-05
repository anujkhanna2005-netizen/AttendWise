/**
 * iconography.ts — AttendWise Design Token: Icon Size Scale
 *
 * Maps semantic size names to pixel values for Material Symbols icons.
 * Used with the `text-[Npx]` pattern on .material-symbols-outlined spans.
 *
 * Usage in JSX:
 *   import { iconSize } from '../design-system/tokens/iconography';
 *   <span className={`material-symbols-outlined ${iconSize.md}`}>check</span>
 *
 * Scale rationale:
 *   xs  (12px) — rare, tiny inline decorative use only
 *   sm  (16px) — inline icons next to text, compact UI elements
 *   md  (20px) — standard UI icons in buttons, nav, chips
 *   lg  (24px) — standalone prominent icons, sheet headers
 *   xl  (32px) — feature icons, empty states (small)
 *   xxl (48px) — large illustrative icons, empty state heroes
 */
export const iconSize = {
  xs:  'text-[12px]',
  sm:  'text-[16px]',
  md:  'text-[20px]',
  lg:  'text-[24px]',
  xl:  'text-[32px]',
  xxl: 'text-[48px]',
} as const;

export type IconSizeKey = keyof typeof iconSize;

/**
 * CSS custom properties for icon sizes.
 * Declared in :root via index.css for use in raw CSS/inline styles.
 */
export const iconSizeCssVars = {
  xs:  '--icon-size-xs',
  sm:  '--icon-size-sm',
  md:  '--icon-size-md',
  lg:  '--icon-size-lg',
  xl:  '--icon-size-xl',
  xxl: '--icon-size-xxl',
} as const;
