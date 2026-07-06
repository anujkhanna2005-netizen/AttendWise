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
        "primary":                     "var(--color-primary)",
        "primary-hover":               "var(--color-primary-hover)",
        "primary-active":              "var(--color-primary-active)",
        "primary-container":           "var(--color-primary-container)",
        "primary-light":               "var(--color-primary-light)",
        "on-primary":                  "var(--color-on-primary)",

        "secondary":                   "var(--color-secondary)",
        "secondary-dim":               "var(--color-secondary-dim)",
        "secondary-hover":             "var(--color-secondary-dim)",
        "secondary-active":            "var(--color-secondary-dim)",
        "secondary-container":         "var(--color-secondary-container)",
        "on-secondary":                "var(--color-on-secondary)",

        "accent":                      "var(--color-accent)",
        "on-accent":                   "var(--color-on-accent)",

        "success":                     "var(--color-success)",
        "success-container":           "var(--color-success-container)",
        "on-success":                  "var(--color-on-success)",

        "background":                  "var(--color-background)",
        "surface":                     "var(--color-surface)",
        "surface-dim":                 "var(--color-surface-dim)",
        "surface-bright":              "var(--color-surface-bright)",
        "surface-container-lowest":    "var(--color-surface-container-lowest)",
        "surface-container-low":       "var(--color-surface-container-low)",
        "surface-container":           "var(--color-surface-container)",
        "surface-container-high":      "var(--color-surface-container-high)",
        "surface-container-highest":   "var(--color-surface-container-highest)",
        "surface-variant":             "var(--color-surface-variant)",

        "text-primary":                "var(--color-text-primary)",
        "text-secondary":              "var(--color-text-secondary)",
        "text-tertiary":               "var(--color-text-tertiary)",
        "nav-inactive":                 "var(--color-nav-inactive)",

        "outline":                     "var(--color-outline)",
        "outline-variant":             "var(--color-outline-variant)",

        "safe":                        "var(--color-safe)",
        "warning":                     "var(--color-warning)",
        "danger":                      "var(--color-danger)",
        "error":                       "var(--color-error)",
        "error-container":             "var(--color-error-container)",
        "on-error":                    "var(--color-on-error)",

        // Keep some common semantic names for backward compatibility
        "on-surface":                  "#f1f5f9",
        "on-surface-variant":          "#94a3b8",
      },

      // ── Font families (Sora and JetBrains Mono only, Inter dropped) ──
      fontFamily: {
        "sora": ["Sora", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        "mono": ["JetBrains Mono", "Cascadia Code", "Fira Code", "Courier New", "monospace"],
        // Legacy fallbacks mapped to Sora
        "body-md":           ["Sora", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        "headline-lg":       ["Outfit", "system-ui", "-apple-system", "sans-serif"],
        "label-caps":        ["JetBrains Mono", "Cascadia Code", "Fira Code", "Courier New", "monospace"],
        "headline-xl":       ["Outfit", "system-ui", "-apple-system", "sans-serif"],
        "headline-lg-mobile":["Outfit", "system-ui", "-apple-system", "sans-serif"],
        "body-sm":           ["Sora", "system-ui", "-apple-system", "sans-serif"],
        "meta-data":         ["Sora", "system-ui", "-apple-system", "sans-serif"],
      },

      // ── Font sizes (New standardized typography scale) ───────────────────────────
      fontSize: {
        "hero":              ["2.5rem", {"lineHeight": "1.1", "fontWeight": "800"}],
        "h1":                ["1.75rem", {"lineHeight": "1.2", "fontWeight": "700"}],
        "h2":                ["1.375rem", {"lineHeight": "1.3", "fontWeight": "600"}],
        "h3":                ["1.125rem", {"lineHeight": "1.4", "fontWeight": "600"}],
        "body":              ["0.938rem", {"lineHeight": "1.5", "fontWeight": "400"}],
        "sm":                ["0.813rem", {"lineHeight": "1.5", "fontWeight": "400"}],
        "xs":                ["0.75rem", {"lineHeight": "1.4", "fontWeight": "600"}],
        "data":              ["0.75rem", {"lineHeight": "1.3", "fontWeight": "500"}],

        // Legacy compatibility mappings
        "body-md":           ["0.938rem", {"lineHeight": "1.5", "fontWeight": "400"}],
        "headline-lg":       ["1.375rem", {"lineHeight": "1.3", "fontWeight": "600"}],
        "label-caps":        ["0.75rem", {"lineHeight": "1.4", "fontWeight": "600"}],
        "headline-xl":       ["2.5rem", {"lineHeight": "1.1", "fontWeight": "800"}],
        "headline-lg-mobile":["1.125rem", {"lineHeight": "1.4", "fontWeight": "600"}],
        "body-sm":           ["0.813rem", {"lineHeight": "1.5", "fontWeight": "400"}],
        "meta-data":         ["0.75rem", {"lineHeight": "1.4", "fontWeight": "600"}],
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
