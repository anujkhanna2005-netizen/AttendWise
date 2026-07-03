---
name: Kinetic Neon-Grid
colors:
  surface: '#15121b'
  surface-dim: '#15121b'
  surface-bright: '#3c3742'
  surface-container-lowest: '#100d16'
  surface-container-low: '#1d1a24'
  surface-container: '#221e28'
  surface-container-high: '#2c2833'
  surface-container-highest: '#37333e'
  on-surface: '#e8dfee'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e8dfee'
  inverse-on-surface: '#332f39'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#007650'
  on-tertiary-container: '#76ffc2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#15121b'
  on-background: '#e8dfee'
  surface-variant: '#37333e'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  meta-data:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
spacing:
  unit: 4px
  gutter: 24px
  margin-sm: 16px
  margin-lg: 48px
  container-max: 1440px
---

## Brand & Style

This design system is a high-performance, technical interface designed for deep-focus environments. It merges **Cyber-Brutalism** with **Glassmorphism**, utilizing a high-contrast dark aesthetic that prioritizes legibility and visual urgency. The brand personality is precise, futuristic, and unapologetically digital.

The visual language is defined by:
- **Kinetic Energy:** High-gloss neon glows and vibrant accent colors against a deep void.
- **Structural Integrity:** Razor-sharp 1px borders and a rigid grid-heavy layout.
- **Technical Depth:** Layered translucent surfaces that suggest a complex, multi-dimensional data environment.
- **Hyper-Legibility:** Stark white-on-black contrast ratios for critical data paths.

## Colors

The palette is optimized for high-contrast dark mode, using a deep midnight foundation to make vibrant neon accents "pop" with emissive qualities.

- **Foundations:** The background uses a near-black navy (#0a0a0f) to maintain depth. Surfaces are slightly lifted charcoal (#12121a) with 60% opacity for glassmorphism effects.
- **Accents:** Neon Indigo (#7c3aed) serves as the primary action color. Electric Cyan (#06b6d4) highlights secondary data streams and navigation.
- **Status:** Emerald (#10b981) represents stability and success, while Hot Neon Pink (#f43f5e) is reserved for critical errors and destructive actions.
- **Interactive States:** Active elements utilize high-gloss outer glows (box-shadows) using the primary or secondary color with high spread and low opacity (20-30%).

## Typography

The typography system relies on **Sora** for its geometric, technical feel, supplemented by **JetBrains Mono** for technical labels and metadata to reinforce the developer-centric aesthetic.

- **Headers:** Always high-contrast white (#FFFFFF). Large headers use tighter letter spacing for a compact, "engineered" look.
- **Body:** Standard body text uses an off-white/light grey for readability without eye strain.
- **Metadata:** Dimmed grey (#94a3b8) is used for secondary information, timestamps, and breadcrumbs.
- **Labels:** Small caps with tracking (letter-spacing) are used for category headers and UI labels.

## Layout & Spacing

This design system uses a **Fluid Grid** anchored by a strict 4px baseline rhythm. 

- **Grid:** A 12-column system for desktop, 6-column for tablet, and 2-column for mobile.
- **Borders:** All containers are separated by razor-sharp 1px lines. Avoid soft transitions; use hard edges to define the spatial logic.
- **Gutters:** Generous 24px gutters ensure that even with high-contrast elements, the UI feels airy and organized.
- **Padding:** Internal component padding should follow the 4px scale (e.g., 8px, 12px, 16px, 24px) to maintain mathematical harmony.

## Elevation & Depth

Elevation in this design system is achieved through **translucency and luminosity** rather than traditional shadows.

- **Surface Layers:** Surfaces use a background-blur (backdrop-filter: blur(12px)) combined with a semi-transparent fill (#12121a at 60-80%).
- **Borders as Depth:** Higher elevation is indicated by brighter 1px borders. A base card might have a border of `rgba(255,255,255,0.1)`, while a hovered card increases to `rgba(255,255,255,0.3)`.
- **Neon Glows:** Active or "focused" elements emit a high-gloss glow using `box-shadow: 0 0 15px [color]`. This is the only "shadow" permitted and must be saturated and vibrant.
- **Stacking:** Elements physically higher in the stack (modals) should have a slightly lighter background hex to simulate proximity to the light source.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every UI element—from buttons and input fields to large container cards—must have 90-degree corners. This reinforces the brutalist, technical narrative and ensures the 1px borders connect seamlessly at every junction. Avoid any rounded corners, including in icons or toggle switches, which should utilize rectangular forms.

## Components

- **Buttons:** Primary buttons are solid Neon Indigo (#7c3aed) with black text. Secondary buttons are transparent with a 1px Electric Cyan border and Cyan text. Hover states trigger a subtle outer glow.
- **Input Fields:** Dark charcoal backgrounds with a 1px white border at 10% opacity. Upon focus, the border becomes 100% Electric Cyan with a matching glow.
- **Cards:** Glassmorphic backgrounds with 1px sharp borders. Header sections within cards are separated by a 1px horizontal line.
- **Chips/Badges:** Monospaced text (JetBrains Mono) inside small rectangular boxes. Use primary/secondary colors for background at 20% opacity with a 100% opacity border.
- **Lists:** Rows are separated by 1px dimmed borders. Hovering a row should change the background to a slightly lighter grey (#1e1e26) with zero transition time for a "snappy" feel.
- **Checkboxes/Radios:** Purely geometric. Checkboxes are squares; Radio buttons are "diamond" shapes (square rotated 45 degrees) to maintain the sharp-edge aesthetic.