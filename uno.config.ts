import { defineConfig, presetIcons, presetWind4, transformerDirectives, transformerVariantGroup } from "unocss";

export default defineConfig({
  content: {
    filesystem: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  },
  theme: {
    colors: {
      bg: "hsl(var(--color-bg))",
      surface: "hsl(var(--color-surface))",
      "surface-2": "hsl(var(--color-surface-2))",
      "surface-3": "hsl(var(--color-surface-3))",
      border: "hsl(var(--color-border))",
      muted: "hsl(var(--color-muted))",
      text: "hsl(var(--color-text))",
      "text-secondary": "hsl(var(--color-text-secondary))",
      primary: {
        DEFAULT: "hsl(var(--color-primary))",
        foreground: "hsl(var(--color-primary-foreground))",
      },
      "primary-glow": "hsl(var(--color-primary-glow))",
      accent: {
        DEFAULT: "hsl(var(--color-accent))",
        foreground: "hsl(var(--color-accent-foreground))",
      },
      success: {
        DEFAULT: "hsl(var(--color-success))",
        foreground: "hsl(var(--color-success-foreground))",
      },
      warning: {
        DEFAULT: "hsl(var(--color-warning))",
        foreground: "hsl(var(--color-warning-foreground))",
      },
      danger: {
        DEFAULT: "hsl(var(--color-danger))",
        foreground: "hsl(var(--color-danger-foreground))",
      },
    },
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    borderRadius: {
      lg: "1.25rem",
      xl: "1.5rem",
      "2xl": "2rem",
    },
  },
  presets: [
    presetWind4(),
    presetIcons({
      collections: {
        mdi: () => import("@iconify-json/mdi/icons.json").then((i) => i.default),
      },
    }),
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
});
