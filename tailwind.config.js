/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ── Color tokens ─────────────────────────────────────────────
      // These mirror /src/design-system/tokens/colors.ts
      colors: {
        // Material You dark theme surface stack
        "on-background":               "#e8dfee",
        "on-error-container":          "#ffdad6",
        "inverse-on-surface":          "#332f39",
        "on-error":                    "#690005",
        "on-primary-fixed":            "#25005a",
        "error":                       "#dc2626",   // WCAG AA (Task 3)
        "on-tertiary-container":       "#76ffc2",
        "secondary":                   "#4cd7f6",
        "surface-bright":              "#3c3742",
        "on-tertiary-fixed":           "#002113",
        "surface-container-lowest":    "#100d16",
        "on-secondary-fixed-variant":  "#004e5c",
        "on-secondary-fixed":          "#001f26",
        "secondary-fixed":             "#acedff",
        "on-tertiary-fixed-variant":   "#005236",
        "tertiary-container":          "#007650",
        "outline":                     "#958da1",
        "outline-variant":             "#4a4455",
        "inverse-surface":             "#e8dfee",
        "surface-container":           "#221e28",
        "secondary-container":         "#03b5d3",
        "tertiary-fixed-dim":          "#34d399",
        "primary":                     "#d2bbff",
        "inverse-primary":             "#732ee4",
        "surface-dim":                 "#15121b",
        "tertiary-fixed":              "#6ee7b7",
        "error-container":             "#93000a",
        "surface-variant":             "#37333e",
        "primary-fixed":               "#eaddff",
        "surface-container-low":       "#1d1a24",
        "surface-tint":                "#d2bbff",
        "on-secondary-container":      "#00424e",
        "surface-container-high":      "#2c2833",
        "secondary-fixed-dim":         "#4cd7f6",
        "on-tertiary":                 "#003824",
        "surface-container-highest":   "#37333e",
        "tertiary":                    "#059669",   // WCAG AA (Task 3)
        "background":                  "#15121b",
        "on-surface":                  "#e8dfee",
        "on-primary-container":        "#ede0ff",
        "surface":                     "#15121b",
        "on-surface-variant":          "#ccc3d8",
        "primary-container":           "#7c3aed",
        "on-primary-fixed-variant":    "#5a00c6",
        "primary-fixed-dim":           "#d2bbff",
        "on-secondary":                "#003640",
        "on-primary":                  "#3f008e",
      },

      // ── Font families (with robust system fallbacks from tokens/typography.ts) ──
      fontFamily: {
        "body-md":           ["Sora", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        "headline-lg":       ["Sora", "system-ui", "-apple-system", "sans-serif"],
        "label-caps":        ["JetBrains Mono", "Cascadia Code", "Fira Code", "Courier New", "monospace"],
        "headline-xl":       ["Sora", "system-ui", "-apple-system", "sans-serif"],
        "headline-lg-mobile":["Sora", "system-ui", "-apple-system", "sans-serif"],
        "body-sm":           ["Sora", "system-ui", "-apple-system", "sans-serif"],
        "meta-data":         ["Sora", "system-ui", "-apple-system", "sans-serif"],
      },

      // ── Font sizes ────────────────────────────────────────────────
      fontSize: {
        "body-md":           ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg":       ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "label-caps":        ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "500"}],
        "headline-xl":       ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "headline-lg-mobile":["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "body-sm":           ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "meta-data":         ["12px", {"lineHeight": "16px", "fontWeight": "400"}],
      },

      // ── Spacing ── mirrors --space-N CSS vars ─────────────────────
      spacing: {
        // Legacy aliases (keep for backward compat with existing classNames)
        "unit":      "4px",
        "gutter":    "24px",
        "margin-sm": "16px",
        "margin-lg": "48px",
        // Token scale (used going forward)
        "space-1":  "var(--space-1)",
        "space-2":  "var(--space-2)",
        "space-3":  "var(--space-3)",
        "space-4":  "var(--space-4)",
        "space-5":  "var(--space-5)",
        "space-6":  "var(--space-6)",
        "space-7":  "var(--space-7)",
        "space-8":  "var(--space-8)",
        "space-9":  "var(--space-9)",
        "space-10": "var(--space-10)",
        "space-11": "var(--space-11)",
        "space-12": "var(--space-12)",
        "space-14": "var(--space-14)",
        "space-16": "var(--space-16)",
      },

      // ── Border radius ── mirrors --radius-* CSS vars ──────────────
      borderRadius: {
        "token-xs":   "var(--radius-xs)",
        "token-sm":   "var(--radius-sm)",
        "token-md":   "var(--radius-md)",
        "token-lg":   "var(--radius-lg)",
        "token-xl":   "var(--radius-xl)",
        "token-full": "var(--radius-full)",
      },

      // ── Box shadows ── mirrors elevation + glow vars ──────────────
      boxShadow: {
        "elevation-0": "var(--elevation-0)",
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
        "glow-primary":   "var(--glow-primary)",
        "glow-secondary": "var(--glow-secondary)",
        "glow-error":     "var(--glow-error)",
        "glow-sheet":     "var(--glow-sheet)",
      },

      // ── Transition durations ── mirrors --duration-* CSS vars ─────
      transitionDuration: {
        "instant":  "var(--duration-instant)",
        "fast":     "var(--duration-fast)",
        "base":     "var(--duration-base)",
        "moderate": "var(--duration-moderate)",
        "slow":     "var(--duration-slow)",
        "sheet":    "var(--duration-sheet)",
      },

      // ── Transition timing functions ── mirrors --easing-* CSS vars ─
      transitionTimingFunction: {
        "decelerate": "var(--easing-decelerate)",
        "accelerate": "var(--easing-accelerate)",
        "standard":   "var(--easing-standard)",
        "spring":     "var(--easing-spring)",
      },
    }
  },
  plugins: [],
};
