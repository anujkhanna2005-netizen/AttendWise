---
name: Tech-Clean Kinetic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006877'
  on-secondary: '#ffffff'
  secondary-container: '#3fe1fd'
  on-secondary-container: '#00616f'
  tertiary: '#95002b'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf0f3c'
  on-tertiary-container: '#ffd0d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  micro-label:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  grid-pattern: 20px
---

## Brand & Style
The design system embodies a "Tech-Clean Kinetic" aesthetic, blending the precision of a high-performance dashboard with the clarity of a modern SaaS interface. The target audience includes developers, logistics managers, and data analysts who require high-density information without cognitive fatigue. 

The emotional response is one of **controlled urgency and absolute precision**. The style leverages **Modern Minimalism** fused with **Technical Brutalism**, utilizing sharp borders and subtle grid systems to create a sense of structural integrity. Backgrounds remain light and spacious, while active states use localized "glow" effects to command attention.

## Colors
The palette is anchored by a deepened indigo primary, providing a professional and authoritative base. 
- **Primary (#4f46e5):** Used for main actions, active navigation states, and primary branding elements.
- **Neon Cyan (#22d3ee):** Specifically reserved for "on track," "active," or "success" statuses. It carries a subtle outer glow when used on dark or indigo backgrounds.
- **Sharp Magenta (#f43f5e):** Used exclusively for alerts, errors, and critical interruptions.
- **Surface (#f8fafc):** A clean, off-white foundation that prevents eye strain compared to pure white.
- **Grayscale:** Uses cool slates for text and borders to maintain the technical tone.

## Typography
The typographic hierarchy relies on a dual-personality approach. **Sora** provides a modern, geometric feel for all structural headlines. **Hanken Grotesk** handles high-volume body text with exceptional legibility. 

A technical layer is added via **JetBrains Mono**, which is used for all "kinetic" data points, counters, and system statuses. This monospaced font ensures that numerical values do not shift horizontally when updating in real-time. Micro-labels are always set in uppercase JetBrains Mono, wrapped in square brackets (e.g., `[PROCESS_ACTIVE]`) to reinforce the terminal-inspired aesthetic.

## Layout & Spacing
The layout follows a strict **12-column fluid grid** for desktop and a **4-column grid** for mobile. A 20px background grid pattern is used subtly on container surfaces to provide a visual guide for alignment.

Spacing follows a 4px baseline, but emphasizes horizontal expansion. Gutters are kept tight (16px) to maximize data density, while external margins are generous (40px+) to frame the "cockpit" of the application. Elements are often grouped into "Technical Modules" with defined 1px borders rather than using white space alone for separation.

## Elevation & Depth
This design system rejects traditional shadows in favor of **Structural Outlines** and **Luminous Depth**.
- **Borders:** Every card and container uses a sharp 1px border (#e2e8f0).
- **Status Glows:** Active or high-priority elements use a `box-shadow` with 0 blur and a slight offset, or a soft diffused "neon" drop shadow using the cyan or magenta values to indicate life and activity.
- **Layering:** Depth is achieved by stacking containers with slightly different background shades (e.g., a slate-50 sidebar over a white background) rather than Z-axis elevation.

## Shapes
The primary shape language is **Soft-Square**. Standard UI components like input fields and cards use a 0.25rem (4px) radius to maintain a professional, rigid feel. 

However, "Data-Capsules" (status indicators and badges) use `rounded-full` (pill shape) to create a clear visual distinction between interactive containers and static information tags. Segmented progress bars use sharp 0px corners for the internal segments to emphasize the incremental, digital nature of the data.

## Components
- **Buttons:** High-contrast indigo backgrounds with white text. Hover states trigger a subtle Cyan bottom border or "glow" effect.
- **Data-Capsules:** Full-pill shapes used for status labels. Backgrounds are low-opacity versions of the status color (e.g., 10% Cyan) with high-contrast text.
- **Segmented Progress:** Instead of a continuous fill, use 5-10 distinct blocks. Active blocks use the Neon Cyan (#22d3ee).
- **Micro-Labels:** Used at the top-left of every card/module. Format: `[CATEGORY::SYSTEM_ID]`. 
- **Input Fields:** 1px slate borders that turn Indigo on focus. Mono-font is used for the input text itself.
- **Icons:** 24px viewbox, 1.5px consistent stroke weight. Never filled; always use "crisp" line-art aesthetics.
- **Status Glow:** Interactive cards for "Live" data should have a 2px Cyan left-border and a very faint cyan outer glow to indicate the feed is active.