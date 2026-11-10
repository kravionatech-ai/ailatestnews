import { DesignTokens, ThemePreset, ThemePresetId } from "./types";
import { DEFAULT_DESIGN_TOKENS } from "./defaults";

export const themePresets: Record<string, ThemePreset> = {
  "premium-editorial": {
    id: "premium-editorial",
    name: "Premium Editorial",
    description: "Authority tech journalism with dark navy masthead, slate paper, and emerald accents.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        primaryDark: "#0A0F1D",
        primaryAccent: "#059669",
        heading: "#0F172A",
      },
    },
  },
  "modern-tech": {
    id: "modern-tech",
    name: "Modern Technology News",
    description: "Sleek developer aesthetic with vibrant blue/emerald accents and high-contrast surfaces.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        primaryDark: "#030712",
        primaryAccent: "#3B82F6",
        accentHover: "#2563EB",
      },
      cards: {
        ...DEFAULT_DESIGN_TOKENS.cards,
        defaultVariant: "modern-magazine",
        borderRadius: "1rem",
      },
    },
  },
  "minimal-magazine": {
    id: "minimal-magazine",
    name: "Minimal Magazine",
    description: "Monochrome purity, architectural whitespace, and high-legibility sans-serif type.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        mainBackground: "#FAFAFA",
        cardBackground: "#FFFFFF",
        primaryDark: "#18181B",
        primaryAccent: "#000000",
      },
      header: {
        ...DEFAULT_DESIGN_TOKENS.header,
        layout: "minimal",
        backgroundColor: "#FFFFFF",
        textColor: "#18181B",
        accentColor: "#18181B",
      },
      cards: {
        ...DEFAULT_DESIGN_TOKENS.cards,
        defaultVariant: "compact",
        borderRadius: "0.25rem",
      },
    },
  },
  "dark-tech": {
    id: "dark-tech",
    name: "Dark Technology",
    description: "Deep obsidian dark mode for nighttime reading and engineer workspaces.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        mainBackground: "#090D16",
        cardBackground: "#0F172A",
        secondarySurface: "#19273C",
        heading: "#F8FAFC",
        bodyText: "#94A3B8",
        mutedText: "#64748B",
        border: "#1E293B",
        primaryAccent: "#10B981",
        secondaryAccent: "#34D399",
      },
      header: {
        ...DEFAULT_DESIGN_TOKENS.header,
        backgroundColor: "#080D19",
        textColor: "#F8FAFC",
      },
      footer: {
        ...DEFAULT_DESIGN_TOKENS.footer,
        backgroundColor: "#04070D",
        textColor: "#94A3B8",
      },
    },
  },
  "dark-technology": {
    id: "dark-technology",
    name: "Dark Technology",
    description: "Deep obsidian dark mode for nighttime reading and engineer workspaces.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        mainBackground: "#090D16",
        cardBackground: "#0F172A",
        secondarySurface: "#19273C",
        heading: "#F8FAFC",
        bodyText: "#94A3B8",
        mutedText: "#64748B",
        border: "#1E293B",
        primaryAccent: "#10B981",
        secondaryAccent: "#34D399",
      },
      header: {
        ...DEFAULT_DESIGN_TOKENS.header,
        backgroundColor: "#080D19",
        textColor: "#F8FAFC",
      },
      footer: {
        ...DEFAULT_DESIGN_TOKENS.footer,
        backgroundColor: "#04070D",
        textColor: "#94A3B8",
      },
    },
  },
  "classic-newspaper": {
    id: "classic-newspaper",
    name: "Classic Newspaper",
    description: "Timeless broadsheet editorial with warm newsprint, sharp rules, and serif authority.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        mainBackground: "#FBF9F5",
        cardBackground: "#FFFFFF",
        primaryDark: "#1C1917",
        primaryAccent: "#B91C1C",
        border: "#D6D3D1",
      },
      header: {
        ...DEFAULT_DESIGN_TOKENS.header,
        layout: "editorial",
        backgroundColor: "#FBF9F5",
        textColor: "#1C1917",
        accentColor: "#B91C1C",
      },
      cards: {
        ...DEFAULT_DESIGN_TOKENS.cards,
        defaultVariant: "classic-editorial",
        borderRadius: "0px",
      },
      layout: {
        ...DEFAULT_DESIGN_TOKENS.layout,
        cardBorderRadius: "0px",
        buttonBorderRadius: "0px",
      },
    },
  },
};

export const THEME_PRESETS = themePresets;
