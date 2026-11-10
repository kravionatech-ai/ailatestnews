import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Authoritative Design Token Contract (Derived from PROJECT.md § Interface Contracts)
// ─────────────────────────────────────────────────────────────────────────────

// Regex for strict color validation: Hex (#RGB, #RRGGBB, #RRGGBBAA), RGB/RGBA, HSL/HSLA
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_REGEX = /^rgba?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)(?:\s*,\s*(\d*(?:\.\d+)?%?))?\s*\)$/;
const HSL_COLOR_REGEX = /^hsla?\(\s*(\d{1,3}(?:deg|rad|turn)?)\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)(?:\s*,\s*(\d*(?:\.\d+)?%?))?\s*\)$/;

// Strict injection prevention: reject any CSS escape attempts, scripts, expressions, or url(...)
const DANGEROUS_CSS_CHARS = /[;<>{}\\\/]|expression\(|javascript:|url\(|<script|<\/style/i;

export const SafeColorSchema = z.string().trim().superRefine((val, ctx) => {
  if (DANGEROUS_CSS_CHARS.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Security violation: Color value contains forbidden CSS/script injection characters",
    });
    return;
  }
  const isHex = HEX_COLOR_REGEX.test(val);
  const isRgb = RGB_COLOR_REGEX.test(val);
  const isHsl = HSL_COLOR_REGEX.test(val);
  if (!isHex && !isRgb && !isHsl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid color format: "${val}". Must be valid hex, rgb, rgba, hsl, or hsla.`,
    });
  }
});

// Dimension schema: e.g. "1280px", "1.5rem", "100%", "0.75rem"
const CSS_DIMENSION_REGEX = /^(0|auto|fit-content|min-content|max-content|(\d+(\.\d+)?)(px|rem|em|%|vw|vh))$/;

export const SafeDimensionSchema = z.string().trim().superRefine((val, ctx) => {
  if (DANGEROUS_CSS_CHARS.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Security violation: Dimension value contains forbidden injection characters",
    });
    return;
  }
  if (!CSS_DIMENSION_REGEX.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid dimension format: "${val}". Must include valid CSS unit (e.g. px, rem).`,
    });
  }
});

export const DesignTokensSchema = z.object({
  colors: z.object({
    primaryDark: SafeColorSchema,
    secondaryDark: SafeColorSchema,
    primaryAccent: SafeColorSchema,
    secondaryAccent: SafeColorSchema,
    accentHover: SafeColorSchema,
    mainBackground: SafeColorSchema,
    cardBackground: SafeColorSchema,
    secondarySurface: SafeColorSchema,
    heading: SafeColorSchema,
    bodyText: SafeColorSchema,
    mutedText: SafeColorSchema,
    border: SafeColorSchema,
    breakingNews: SafeColorSchema,
    trending: SafeColorSchema,
    success: SafeColorSchema,
  }),
  typography: z.object({
    fontSans: z.string().min(1),
    fontSerif: z.string().min(1),
    fontMono: z.string().min(1),
    baseFontSize: SafeDimensionSchema,
    headingLineHeight: z.string().regex(/^\d+(\.\d+)?$/),
    bodyLineHeight: z.string().regex(/^\d+(\.\d+)?$/),
  }),
  layout: z.object({
    maxContentWidth: SafeDimensionSchema,
    containerPadding: SafeDimensionSchema,
    cardBorderRadius: SafeDimensionSchema,
    buttonBorderRadius: SafeDimensionSchema,
  }),
  header: z.object({
    layout: z.enum(["classic", "centered", "minimal", "editorial"]),
    showTopUtilityBar: z.boolean(),
    sticky: z.boolean(),
    backgroundColor: SafeColorSchema,
    textColor: SafeColorSchema,
    accentColor: SafeColorSchema,
    logoText: z.string(),
    logoSubline: z.string(),
  }),
  footer: z.object({
    layout: z.enum(["5-column", "4-column", "minimal", "compact"]),
    backgroundColor: SafeColorSchema,
    textColor: SafeColorSchema,
    showSocialLinks: z.boolean(),
    copyrightText: z.string(),
    aboutText: z.string(),
  }),
  cards: z.object({
    defaultVariant: z.enum([
      "classic-editorial",
      "modern-magazine",
      "horizontal",
      "compact",
      "large-featured",
      "image-overlay",
      "minimal-list",
    ]),
    showBadges: z.boolean(),
    showAuthorAvatar: z.boolean(),
    showReadingTime: z.boolean(),
    showViewsCount: z.boolean(),
    borderRadius: SafeDimensionSchema,
  }),
  article: z.object({
    defaultTemplate: z.enum([
      "standard-editorial",
      "premium-magazine",
      "minimal-reading",
      "wide-article",
      "without-sidebar",
    ]),
    showStickyProgress: z.boolean(),
    showReadingControls: z.boolean(),
    showKeyTakeaways: z.boolean(),
    showTableOfContents: z.boolean(),
    showCommunityPoll: z.boolean(),
    showAuthorBio: z.boolean(),
    showReactions: z.boolean(),
    showRelatedPosts: z.boolean(),
  }),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

// Authoritative Default Tokens (PROJECT.md § Interface Contracts)
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primaryDark: "#080D19",
    secondaryDark: "#111C2E",
    primaryAccent: "#10B981",
    secondaryAccent: "#34D399",
    accentHover: "#059669",
    mainBackground: "#F8FAFC",
    cardBackground: "#FFFFFF",
    secondarySurface: "#F1F5F9",
    heading: "#0F172A",
    bodyText: "#334155",
    mutedText: "#64748B",
    border: "#E2E8F0",
    breakingNews: "#EF4444",
    trending: "#F59E0B",
    success: "#16A34A",
  },
  typography: {
    fontSans: "var(--font-inter, Inter, system-ui, sans-serif)",
    fontSerif: "var(--font-merriweather, Merriweather, Georgia, serif)",
    fontMono: "var(--font-jetbrains-mono, JetBrains Mono, monospace)",
    baseFontSize: "16px",
    headingLineHeight: "1.2",
    bodyLineHeight: "1.6",
  },
  layout: {
    maxContentWidth: "1280px",
    containerPadding: "1.5rem",
    cardBorderRadius: "0.75rem",
    buttonBorderRadius: "0.5rem",
  },
  header: {
    layout: "classic",
    showTopUtilityBar: true,
    sticky: true,
    backgroundColor: "#080D19",
    textColor: "#FFFFFF",
    accentColor: "#10B981",
    logoText: "AI LATEST NEWS",
    logoSubline: "Frontier Intelligence & Verification Desk",
  },
  footer: {
    layout: "5-column",
    backgroundColor: "#080D19",
    textColor: "#94A3B8",
    showSocialLinks: true,
    copyrightText: "© 2026 AI Latest News. All rights reserved.",
    aboutText: "Independent technology news publication covering frontier artificial intelligence.",
  },
  cards: {
    defaultVariant: "classic-editorial",
    showBadges: true,
    showAuthorAvatar: true,
    showReadingTime: true,
    showViewsCount: true,
    borderRadius: "0.75rem",
  },
  article: {
    defaultTemplate: "standard-editorial",
    showStickyProgress: true,
    showReadingControls: true,
    showKeyTakeaways: true,
    showTableOfContents: true,
    showCommunityPoll: true,
    showAuthorBio: true,
    showReactions: true,
    showRelatedPosts: true,
  },
};

// Helper: Convert tokens to CSS custom properties
export function generateCssVariables(tokens: DesignTokens): string {
  const vars: string[] = [];

  // Color properties
  for (const [key, value] of Object.entries(tokens.colors)) {
    const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    vars.push(`--color-${kebabKey}: ${value};`);
  }

  // Layout properties
  for (const [key, value] of Object.entries(tokens.layout)) {
    const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    vars.push(`--layout-${kebabKey}: ${value};`);
  }

  // Typography
  vars.push(`--font-sans: ${tokens.typography.fontSans};`);
  vars.push(`--font-serif: ${tokens.typography.fontSerif};`);
  vars.push(`--font-mono: ${tokens.typography.fontMono};`);
  vars.push(`--font-size-base: ${tokens.typography.baseFontSize};`);
  vars.push(`--line-height-heading: ${tokens.typography.headingLineHeight};`);
  vars.push(`--line-height-body: ${tokens.typography.bodyLineHeight};`);

  return `:root {\n  ${vars.join("\n  ")}\n}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E Test Suite: Token Schema, Formats, Injection Defense & Presets
// ─────────────────────────────────────────────────────────────────────────────

describe("E2E Token Schema & Security Validation (Tiers 1-4)", () => {
  // ── Tier 1: Feature Coverage (Core Happy Paths & Defaults) ──────────────────

  describe("Tier 1: Baseline Defaults & Schema Conformance", () => {
    it("validates that DEFAULT_DESIGN_TOKENS passes schema validation completely", () => {
      const parsed = DesignTokensSchema.safeParse(DEFAULT_DESIGN_TOKENS);
      expect(parsed.success).toBe(true);
    });

    it("matches all 15 default color hex values precisely to R2 requirements", () => {
      const colors = DEFAULT_DESIGN_TOKENS.colors;
      expect(colors.primaryDark).toBe("#080D19");
      expect(colors.secondaryDark).toBe("#111C2E");
      expect(colors.primaryAccent).toBe("#10B981");
      expect(colors.secondaryAccent).toBe("#34D399");
      expect(colors.accentHover).toBe("#059669");
      expect(colors.mainBackground).toBe("#F8FAFC");
      expect(colors.cardBackground).toBe("#FFFFFF");
      expect(colors.secondarySurface).toBe("#F1F5F9");
      expect(colors.heading).toBe("#0F172A");
      expect(colors.bodyText).toBe("#334155");
      expect(colors.mutedText).toBe("#64748B");
      expect(colors.border).toBe("#E2E8F0");
      expect(colors.breakingNews).toBe("#EF4444");
      expect(colors.trending).toBe("#F59E0B");
      expect(colors.success).toBe("#16A34A");
    });

    it("verifies typography default fonts, line heights, and base font size", () => {
      const typo = DEFAULT_DESIGN_TOKENS.typography;
      expect(typo.baseFontSize).toBe("16px");
      expect(typo.headingLineHeight).toBe("1.2");
      expect(typo.bodyLineHeight).toBe("1.6");
      expect(typo.fontSans).toContain("Inter");
      expect(typo.fontSerif).toContain("Merriweather");
    });

    it("verifies layout default widths, padding, and border radii", () => {
      const layout = DEFAULT_DESIGN_TOKENS.layout;
      expect(layout.maxContentWidth).toBe("1280px");
      expect(layout.containerPadding).toBe("1.5rem");
      expect(layout.cardBorderRadius).toBe("0.75rem");
      expect(layout.buttonBorderRadius).toBe("0.5rem");
    });

    it("accepts valid alternative color formats (3-digit hex, rgb, rgba, hsl)", () => {
      const validColors = [
        "#000",
        "#FFFFFF",
        "#10b981",
        "#10B981AA",
        "rgb(16, 185, 129)",
        "rgb(255, 255, 255)",
        "rgba(8, 13, 25, 0.95)",
        "rgba(16, 185, 129, 1)",
        "hsl(160, 84%, 39%)",
        "hsla(217, 33%, 17%, 0.8)",
      ];

      for (const color of validColors) {
        const result = SafeColorSchema.safeParse(color);
        expect(result.success, `Color should be valid: ${color}`).toBe(true);
      }
    });

    it("accepts valid dimension units (px, rem, em, %, vw, vh, auto)", () => {
      const validDimensions = ["1440px", "1280px", "1024px", "768px", "390px", "360px", "2rem", "100%", "auto"];
      for (const dim of validDimensions) {
        const result = SafeDimensionSchema.safeParse(dim);
        expect(result.success, `Dimension should be valid: ${dim}`).toBe(true);
      }
    });
  });

  // ── Tier 2: Boundary & Corner Cases (Adversarial Security & Invalid Inputs) ──

  describe("Tier 2: Boundary & Corner Cases (Security & Validation)", () => {
    it("rejects malformed hex color codes", () => {
      const invalidHexes = [
        "10B981",          // missing '#'
        "#12",             // too short (2 chars)
        "#12345",          // invalid length (5 chars)
        "#1234567",        // invalid length (7 chars)
        "#GGGGGG",         // non-hex character
        "#10B981XYZ",      // non-hex tail
        "##10B981",        // double hash
        "",                // empty string
      ];

      for (const hex of invalidHexes) {
        const result = SafeColorSchema.safeParse(hex);
        expect(result.success, `Should reject invalid hex: ${hex}`).toBe(false);
      }
    });

    it("adversarially rejects CSS injection payloads in color values", () => {
      const injectionPayloads = [
        "red; display: none",
        "#080D19; background-image: url('http://malicious.com/tracker.png')",
        "url('javascript:alert(1)')",
        "expression(document.cookie)",
        "</style><script>alert('xss')</script>",
        "#080D19} * { color: red !important }",
        "rgba(0,0,0,1); --injected-var: evil",
        "javascript:alert(window.origin)",
        "#080D19\\; filter: blur(5px)",
      ];

      for (const payload of injectionPayloads) {
        const result = SafeColorSchema.safeParse(payload);
        expect(result.success, `Should block injection payload: ${payload}`).toBe(false);
      }
    });

    it("adversarially rejects injection payloads in layout dimension values", () => {
      const dimensionInjections = [
        "1280px; position: fixed",
        "100vw; behavior: url(script.htc)",
        "<svg onload=alert(1)>",
        "calc(100% - 20px); --custom: evil",
        "-10px",
        "999999999",
      ];

      for (const payload of dimensionInjections) {
        const result = SafeDimensionSchema.safeParse(payload);
        expect(result.success, `Should block dimension injection: ${payload}`).toBe(false);
      }
    });

    it("rejects token object when any required color key is missing", () => {
      const incomplete = {
        ...DEFAULT_DESIGN_TOKENS,
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          breakingNews: undefined, // missing required key
        },
      };

      const result = DesignTokensSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it("rejects unknown news card default variants", () => {
      const invalidVariant = {
        ...DEFAULT_DESIGN_TOKENS,
        cards: {
          ...DEFAULT_DESIGN_TOKENS.cards,
          defaultVariant: "unsupported-3d-card" as unknown as "classic-editorial",
        },
      };

      const result = DesignTokensSchema.safeParse(invalidVariant);
      expect(result.success).toBe(false);
    });

    it("rejects unknown article default templates", () => {
      const invalidTemplate = {
        ...DEFAULT_DESIGN_TOKENS,
        article: {
          ...DEFAULT_DESIGN_TOKENS.article,
          defaultTemplate: "infinite-scroll-canvas" as unknown as "standard-editorial",
        },
      };

      const result = DesignTokensSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });
  });

  // ── Tier 3: Cross-Feature Combinations (Theme Presets & Custom Overrides) ───

  describe("Tier 3: Cross-Feature Combinations (Theme Presets & Overrides)", () => {
    const THEME_PRESETS: Record<string, Partial<DesignTokens>> = {
      "premium-editorial": {
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          primaryDark: "#0A0F1D",
          primaryAccent: "#059669",
          heading: "#0F172A",
        },
      },
      "modern-tech": {
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          primaryDark: "#030712",
          primaryAccent: "#3B82F6",
          accentHover: "#2563EB",
        },
      },
      "minimal-magazine": {
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          mainBackground: "#FAFAFA",
          cardBackground: "#FFFFFF",
          primaryDark: "#18181B",
          primaryAccent: "#000000",
        },
      },
      "dark-technology": {
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          mainBackground: "#090D16",
          cardBackground: "#0F172A",
          heading: "#F8FAFC",
          bodyText: "#94A3B8",
          primaryAccent: "#10B981",
        },
      },
      "classic-newspaper": {
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          mainBackground: "#FBF9F5",
          cardBackground: "#FFFFFF",
          primaryDark: "#1C1917",
          primaryAccent: "#B91C1C",
          border: "#D6D3D1",
        },
      },
    };

    it("verifies that all 5 predefined theme presets can be applied safely", () => {
      for (const [themeName, overrides] of Object.entries(THEME_PRESETS)) {
        const merged: DesignTokens = {
          ...DEFAULT_DESIGN_TOKENS,
          ...overrides,
          colors: {
            ...DEFAULT_DESIGN_TOKENS.colors,
            ...(overrides.colors || {}),
          },
        };

        const result = DesignTokensSchema.safeParse(merged);
        expect(result.success, `Theme preset ${themeName} should validate successfully`).toBe(true);
      }
    });

    it("allows user-customized color overrides on top of a theme preset without schema degradation", () => {
      const darkPreset = THEME_PRESETS["dark-technology"]!;
      const customized: DesignTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        ...darkPreset,
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          ...darkPreset.colors,
          primaryAccent: "#8B5CF6", // User custom purple accent
          accentHover: "#7C3AED",
        },
      };

      const result = DesignTokensSchema.safeParse(customized);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.colors.primaryAccent).toBe("#8B5CF6");
        expect(result.data.colors.mainBackground).toBe("#090D16");
      }
    });
  });

  // ── Tier 4: Dynamic CSS Token Injection Contract ───────────────────────────

  describe("Tier 4: Dynamic CSS Token Generation & Injection Contract", () => {
    it("generates well-formed CSS custom properties for root layout injection", () => {
      const css = generateCssVariables(DEFAULT_DESIGN_TOKENS);
      expect(css).toContain(":root {");
      expect(css).toContain("--color-primary-dark: #080D19;");
      expect(css).toContain("--color-primary-accent: #10B981;");
      expect(css).toContain("--color-main-background: #F8FAFC;");
      expect(css).toContain("--color-card-background: #FFFFFF;");
      expect(css).toContain("--layout-max-content-width: 1280px;");
      expect(css).toContain("--layout-card-border-radius: 0.75rem;");
      expect(css).toContain("--font-size-base: 16px;");
    });

    it("ensures generated CSS contains no executable JavaScript or unescaped style tags", () => {
      const css = generateCssVariables(DEFAULT_DESIGN_TOKENS);
      expect(css).not.toContain("<script");
      expect(css).not.toContain("javascript:");
      expect(css).not.toContain("expression(");
      expect(css.endsWith("}")).toBe(true);
    });
  });
});
