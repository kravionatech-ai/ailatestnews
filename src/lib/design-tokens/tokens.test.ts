import { describe, it, expect } from "vitest";
import {
  DEFAULT_DESIGN_TOKENS,
  defaultDesignTokens,
  DesignTokensSchema,
  themePresets,
  THEME_PRESETS,
  generateCssVariables,
  generateScopedCssVariables,
  sanitizeCssValue,
  DEFAULT_HOMEPAGE_SECTIONS,
  HomepageSectionsSchema,
  invalidateDesignTokensCache,
  getActiveDesignTokens,
} from "./index";

describe("Design Token Engine & CSS Generator Unit Tests", () => {
  it("exports valid default design tokens matching tech news publication identity", () => {
    expect(DEFAULT_DESIGN_TOKENS.colors.primaryDark).toBe("#080D19");
    expect(DEFAULT_DESIGN_TOKENS.colors.secondaryDark).toBe("#111C2E");
    expect(DEFAULT_DESIGN_TOKENS.colors.primaryAccent).toBe("#10B981");
    expect(DEFAULT_DESIGN_TOKENS.colors.secondaryAccent).toBe("#34D399");
    expect(DEFAULT_DESIGN_TOKENS.colors.accentHover).toBe("#059669");
    expect(DEFAULT_DESIGN_TOKENS.colors.mainBackground).toBe("#F8FAFC");
    expect(DEFAULT_DESIGN_TOKENS.colors.cardBackground).toBe("#FFFFFF");

    const parsed = DesignTokensSchema.safeParse(defaultDesignTokens);
    expect(parsed.success).toBe(true);
  });

  it("exports 5 valid predefined theme presets", () => {
    const presetKeys = [
      "premium-editorial",
      "modern-tech",
      "minimal-magazine",
      "dark-tech",
      "classic-newspaper",
    ];

    for (const key of presetKeys) {
      const preset = themePresets[key];
      expect(preset, `Preset ${key} should exist`).toBeDefined();
      if (!preset) continue;
      const result = DesignTokensSchema.safeParse(preset.tokens);
      expect(result.success, `Preset ${key} tokens should be valid`).toBe(true);
    }
  });

  it("generates CSS custom properties with core variables, layout, typography, and semantic aliases", () => {
    const css = generateCssVariables(DEFAULT_DESIGN_TOKENS);
    expect(css).toContain(":root {");
    expect(css).toContain("--color-primary-dark: #080D19;");
    expect(css).toContain("--color-primary-accent: #10B981;");
    expect(css).toContain("--color-main-background: #F8FAFC;");
    expect(css).toContain("--background: #F8FAFC;");
    expect(css).toContain("--accent: #10B981;");
    expect(css).toContain("--layout-max-content-width: 1280px;");
    expect(css).toContain("--font-size-base: 16px;");
    expect(css.endsWith("}")).toBe(true);
  });

  it("generates scoped CSS variables for theme previews", () => {
    const scoped = generateScopedCssVariables(DEFAULT_DESIGN_TOKENS, '[data-theme="preview"]');
    expect(scoped).toContain('[data-theme="preview"] {');
    expect(scoped).toContain("--color-primary-accent: #10B981;");
    expect(scoped.endsWith("}")).toBe(true);
  });

  it("sanitizes CSS values against injection attempts", () => {
    expect(sanitizeCssValue("red; display: none")).toBe("red display: none");
    expect(sanitizeCssValue("url('http://malicious.com/leak')")).toBe("");
    expect(sanitizeCssValue("expression(alert(1))")).toBe("");
    expect(sanitizeCssValue("javascript:alert(1)")).toBe("");
    expect(sanitizeCssValue("<style></style>")).toBe("style/style");
  });

  it("validates 15 default homepage sections against HomepageSectionsSchema", () => {
    expect(DEFAULT_HOMEPAGE_SECTIONS).toHaveLength(15);
    const parsed = HomepageSectionsSchema.safeParse(DEFAULT_HOMEPAGE_SECTIONS);
    expect(parsed.success).toBe(true);
  });

  it("handles in-memory cache invalidation and default token fallback", async () => {
    invalidateDesignTokensCache();
    const tokens = await getActiveDesignTokens();
    expect(tokens.colors.primaryDark).toBe("#080D19");
  });
});
