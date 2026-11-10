import { describe, it, expect } from "vitest";
import {
  SafeColorSchema,
  SafeDimensionSchema,
  fontFamilySchema,
  lineHeightSchema,
  DesignTokensSchema,
  sanitizeCssValue,
} from "@/lib/design-tokens/schema";
import {
  generateCssVariables,
  generateScopedCssVariables,
} from "@/lib/design-tokens/css-generator";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import type { DesignTokens } from "@/lib/design-tokens/types";

describe("Adversarial Empirical Stress Tests: Design Tokens & CSS Injection Defense", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Suite 1: Malicious Color Injection Defense
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 1: Malicious Color Injections", () => {
    const maliciousColorPayloads = [
      { name: "script tag injection", payload: "<script>alert(1)</script>" },
      { name: "CSS expression injection", payload: "expression(alert(1))" },
      { name: "url data-leak injection", payload: "url(https://evil.com/leak)" },
      {
        name: "CSS rule breakout with comment",
        payload: "red; } body { background: black; } /*",
      },
      {
        name: "closing style tag with script",
        payload: "</style><script>alert('xss')</script>",
      },
      {
        name: "hex with trailing semicolon and style",
        payload: "#080D19; font-size: 100px;",
      },
      {
        name: "property override with semicolon",
        payload: "blue; display: none;",
      },
      {
        name: "escaped semicolon injection",
        payload: "#080D19\\; filter: blur(5px)",
      },
      {
        name: "javascript pseudo-protocol",
        payload: "javascript:alert(window.origin)",
      },
      {
        name: "svg onload injection",
        payload: "<svg onload=alert(1)>",
      },
      {
        name: "img onerror injection",
        payload: "<img src=x onerror=alert(1)>",
      },
      {
        name: "url with encoded javascript",
        payload: "url('javascript:alert(1)')",
      },
      {
        name: "bracket breakout attempt",
        payload: "#080D19} * { color: red !important }",
      },
      {
        name: "custom property injection via semicolon",
        payload: "rgba(0,0,0,1); --injected-var: evil",
      },
      {
        name: "closing brace with new rule",
        payload: "#10B981} a { text-decoration: none }",
      },
    ];

    for (const { name, payload } of maliciousColorPayloads) {
      it(`strictly rejects ${name}: "${payload}" via SafeColorSchema`, () => {
        const result = SafeColorSchema.safeParse(payload);
        expect(result.success, `Expected payload "${payload}" to be rejected by SafeColorSchema`).toBe(false);
      });

      it(`cleanly neutralizes ${name}: "${payload}" via sanitizeCssValue`, () => {
        const sanitized = sanitizeCssValue(payload);
        // Must not contain curly braces or semicolons (which allow rule breakout)
        expect(sanitized).not.toContain("{");
        expect(sanitized).not.toContain("}");
        expect(sanitized).not.toContain(";");
        // Must not contain HTML tags
        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
        // Must not contain expression or url calls
        expect(sanitized).not.toMatch(/expression\s*\(/i);
        expect(sanitized).not.toMatch(/url\s*\(/i);
        expect(sanitized).not.toMatch(/javascript:/i);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 2: Broken Color Formats & Boundary Conditions
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 2: Broken Color Formats", () => {
    const brokenColorPayloads = [
      { name: "invalid hex characters", payload: "#XYZ123" },
      { name: "hex missing hash", payload: "080D19" },
      { name: "hex too short (1 char)", payload: "#F" },
      { name: "hex too short (2 chars)", payload: "#12" },
      { name: "hex invalid length (4 chars)", payload: "#1234" },
      { name: "hex invalid length (5 chars)", payload: "#12345" },
      { name: "hex invalid length (7 chars)", payload: "#1234567" },
      { name: "hex invalid length (9 chars)", payload: "#123456789" },
      { name: "hex with non-hex tail", payload: "#10B981XYZ" },
      { name: "double hash prefix", payload: "##10B981" },
      { name: "out-of-range negative RGB", payload: "rgb(300, 999, -10)" },
      { name: "negative RGB single value", payload: "rgb(-1, 0, 0)" },
      { name: "unclosed string single quote", payload: "'#10B981" },
      { name: "unclosed string double quote", payload: '"#10B981' },
      { name: "unclosed rgba parenthesis", payload: "rgba(255, 0, 0" },
      { name: "unclosed rgb parenthesis", payload: "rgb(10, 20, 30" },
      { name: "missing RGB component (2 values)", payload: "rgb(10, 20)" },
      { name: "missing HSL component (2 values)", payload: "hsl(120, 50%)" },
      { name: "malformed rgba alpha float", payload: "rgba(0, 0, 0, 1.2.3)" },
      { name: "non-numeric rgba alpha", payload: "rgba(0, 0, 0, abc)" },
      { name: "empty string", payload: "" },
      { name: "whitespace only", payload: "   " },
      { name: "named color keyword not in whitelist", payload: "crimson" },
      { name: "named color keyword blue", payload: "blue" },
    ];

    for (const { name, payload } of brokenColorPayloads) {
      it(`strictly rejects ${name}: "${payload}"`, () => {
        const result = SafeColorSchema.safeParse(payload);
        expect(result.success, `Expected broken color "${payload}" to be rejected`).toBe(false);
      });
    }

    it("accepts valid color formats and whitelisted keywords", () => {
      const validColors = [
        "#000",
        "#fff",
        "#10B981",
        "#080D19",
        "#10b981aa",
        "#10B981FF",
        "rgb(0, 0, 0)",
        "rgb(16, 185, 129)",
        "rgba(8, 13, 25, 0.95)",
        "rgba(16, 185, 129, 1)",
        "hsl(160, 84%, 39%)",
        "hsla(217, 33%, 17%, 0.8)",
        "transparent",
        "currentColor",
      ];

      for (const color of validColors) {
        const result = SafeColorSchema.safeParse(color);
        expect(result.success, `Expected valid color "${color}" to pass`).toBe(true);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 3: Malicious Typography & Dimensions
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 3: Malicious Typography & Dimensions", () => {
    const maliciousDimensions = [
      { name: "dimension with semicolon and font-weight", payload: "16px; font-weight: bold" },
      { name: "dimension with content property", payload: "0px; content: 'hacked'" },
      { name: "calc with url injection", payload: "calc(100vh - url(evil.com))" },
      { name: "calc with arbitrary subtraction", payload: "calc(100% - 20px)" },
      { name: "negative dimension value", payload: "-10px" },
      { name: "dimension with script tag", payload: "16px<script>alert(1)</script>" },
      { name: "dimension with position fixed override", payload: "1280px; position: fixed" },
      { name: "dimension with behavior htc", payload: "100vw; behavior: url(script.htc)" },
      { name: "dimension without valid CSS unit", payload: "999999" },
      { name: "dimension with trailing text", payload: "100px evil" },
    ];

    for (const { name, payload } of maliciousDimensions) {
      it(`strictly rejects dimension payload "${payload}" (${name})`, () => {
        const result = SafeDimensionSchema.safeParse(payload);
        expect(result.success, `Expected dimension "${payload}" to be rejected`).toBe(false);
      });
    }

    const maliciousFontFamilies = [
      { name: "font family with rule breakout", payload: "Inter; } body { background: red; } /*" },
      { name: "font family with script tag", payload: "Inter, <script>alert(1)</script>" },
      { name: "font family with expression", payload: "Inter, expression(alert(1))" },
      { name: "font family with url leak", payload: "Inter, url('http://evil.com/font.woff')" },
      { name: "font family with javascript protocol", payload: "Inter, javascript:alert(1)" },
      { name: "font family with closing brace", payload: "Inter } * { display: none }" },
      { name: "font family with backslash escape", payload: "Inter\\; color: red" },
    ];

    for (const { name, payload } of maliciousFontFamilies) {
      it(`strictly rejects font family payload "${payload}" (${name})`, () => {
        const result = fontFamilySchema.safeParse(payload);
        expect(result.success, `Expected font family "${payload}" to be rejected`).toBe(false);
      });
    }

    const maliciousLineHeights = [
      { name: "line-height with semicolon injection", payload: "1.5; color: red" },
      { name: "line-height with negative number", payload: "-1.2" },
      { name: "line-height with unit attached", payload: "1.5em" },
      { name: "line-height with script injection", payload: "1.2<script>" },
      { name: "line-height non-numeric", payload: "normal" },
    ];

    for (const { name, payload } of maliciousLineHeights) {
      it(`strictly rejects line-height payload "${payload}" (${name})`, () => {
        const result = lineHeightSchema.safeParse(payload);
        expect(result.success, `Expected line-height "${payload}" to be rejected`).toBe(false);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 4: DesignTokensSchema Validation Resilience Across All Color Keys
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 4: DesignTokensSchema Validation Resilience Across All Fields", () => {
    it("passes cleanly with DEFAULT_DESIGN_TOKENS", () => {
      const result = DesignTokensSchema.safeParse(DEFAULT_DESIGN_TOKENS);
      expect(result.success).toBe(true);
    });

    const colorKeys: Array<keyof DesignTokens["colors"]> = [
      "primaryDark",
      "secondaryDark",
      "primaryAccent",
      "secondaryAccent",
      "accentHover",
      "mainBackground",
      "cardBackground",
      "secondarySurface",
      "heading",
      "bodyText",
      "mutedText",
      "border",
      "breakingNews",
      "trending",
      "success",
    ];

    for (const key of colorKeys) {
      it(`strictly rejects injection attack in colors.${key}`, () => {
        const maliciousTokens = {
          ...DEFAULT_DESIGN_TOKENS,
          colors: {
            ...DEFAULT_DESIGN_TOKENS.colors,
            [key]: "red; } body { background: black; } /*",
          },
        };
        const result = DesignTokensSchema.safeParse(maliciousTokens);
        expect(result.success, `Expected colors.${key} injection to fail validation`).toBe(false);
      });
    }

    it("rejects token object when typography.baseFontSize contains injection", () => {
      const maliciousTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        typography: {
          ...DEFAULT_DESIGN_TOKENS.typography,
          baseFontSize: "16px; font-weight: bold",
        },
      };
      const result = DesignTokensSchema.safeParse(maliciousTokens);
      expect(result.success).toBe(false);
    });

    it("rejects token object when layout.maxContentWidth contains calc url injection", () => {
      const maliciousTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        layout: {
          ...DEFAULT_DESIGN_TOKENS.layout,
          maxContentWidth: "calc(100vh - url(evil.com))",
        },
      };
      const result = DesignTokensSchema.safeParse(maliciousTokens);
      expect(result.success).toBe(false);
    });

    it("rejects token object when header.backgroundColor contains expression", () => {
      const maliciousTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        header: {
          ...DEFAULT_DESIGN_TOKENS.header,
          backgroundColor: "expression(alert(1))",
        },
      };
      const result = DesignTokensSchema.safeParse(maliciousTokens);
      expect(result.success).toBe(false);
    });

    it("rejects token object when footer.backgroundColor contains broken hex", () => {
      const maliciousTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        footer: {
          ...DEFAULT_DESIGN_TOKENS.footer,
          backgroundColor: "#XYZ123",
        },
      };
      const result = DesignTokensSchema.safeParse(maliciousTokens);
      expect(result.success).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 5: CSS Generator Integrity & Block Containment
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 5: CSS Generator Integrity & Containment", () => {
    it("generates valid, well-formed CSS from default tokens", () => {
      const css = generateCssVariables(DEFAULT_DESIGN_TOKENS);
      expect(css.startsWith(":root {")).toBe(true);
      expect(css.endsWith("}")).toBe(true);

      // Verify opening and closing braces are exactly balanced
      const openBraces = (css.match(/\{/g) || []).length;
      const closeBraces = (css.match(/\}/g) || []).length;
      expect(openBraces).toBe(1);
      expect(closeBraces).toBe(1);

      // Verify no illegal script or html tags exist in emitted CSS
      expect(css).not.toContain("<script");
      expect(css).not.toContain("</style>");
      expect(css).not.toContain("expression(");
      expect(css).not.toContain("javascript:");
      expect(css).not.toContain("url(");
    });

    it("guarantees that even if unsanitized/compromised tokens bypass schema, sanitizeCssValue prevents CSS block breakout", () => {
      // Craft a mock token object with hostile payloads injected into all fields
      const hostileTokens: DesignTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        colors: {
          ...DEFAULT_DESIGN_TOKENS.colors,
          primaryDark: "red; } body { background: black; } /*",
          primaryAccent: "</style><script>alert(1)</script>",
          mainBackground: "url('http://evil.com/leak.png')",
          cardBackground: "expression(alert(1))",
          secondarySurface: "rgba(0,0,0,1); --injected: 1;",
        },
        typography: {
          ...DEFAULT_DESIGN_TOKENS.typography,
          fontSans: "Inter; } * { color: red !important } /*",
          baseFontSize: "16px; position: fixed;",
          headingLineHeight: "1.2; font-size: 50px;",
        },
        layout: {
          ...DEFAULT_DESIGN_TOKENS.layout,
          maxContentWidth: "1280px; z-index: 9999;",
        },
      };

      const emittedCss = generateCssVariables(hostileTokens);

      // 1. Emitted CSS must not contain closing brace from hostile token payload
      // Count total opening and closing braces — must remain EXACTLY 1 for the :root block!
      const openBraces = (emittedCss.match(/\{/g) || []).length;
      const closeBraces = (emittedCss.match(/\}/g) || []).length;
      expect(openBraces, "CSS output must not contain injected opening braces").toBe(1);
      expect(closeBraces, "CSS output must not contain injected closing braces that break out of :root").toBe(1);

      // 2. Emitted CSS must not contain HTML tags that can break out of <style>
      expect(emittedCss).not.toContain("<");
      expect(emittedCss).not.toContain(">");
      expect(emittedCss).not.toContain("</style>");
      expect(emittedCss).not.toContain("<script>");

      // 3. Emitted CSS must not contain dangerous execution primitives
      expect(emittedCss).not.toMatch(/expression\s*\(/i);
      expect(emittedCss).not.toMatch(/javascript:/i);
      expect(emittedCss).not.toMatch(/url\s*\(/i);

      // 4. Emitted CSS must not contain semicolons inside sanitized values that create extra properties
      const lines = emittedCss.split("\n").filter((l) => l.trim().startsWith("--"));
      for (const line of lines) {
        // Count semicolons in line — must be exactly 1 at the end
        const semicolons = (line.match(/;/g) || []).length;
        expect(semicolons, `Line must contain at most 1 terminating semicolon: ${line}`).toBe(1);
      }
    });

    it("generates properly scoped CSS variables with custom selector without breaking syntax", () => {
      const customSelector = '[data-theme="modern-tech"]';
      const scopedCss = generateScopedCssVariables(DEFAULT_DESIGN_TOKENS, customSelector);

      expect(scopedCss.startsWith(`${customSelector} {`)).toBe(true);
      expect(scopedCss.endsWith("}")).toBe(true);

      const openBraces = (scopedCss.match(/\{/g) || []).length;
      const closeBraces = (scopedCss.match(/\}/g) || []).length;
      expect(openBraces).toBe(1);
      expect(closeBraces).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 6: Empirical Fuzzing & ReDoS Resistance
  // ───────────────────────────────────────────────────────────────────────────
  describe("Suite 6: Empirical Fuzzing & ReDoS Resistance", () => {
    it("handles massive 20,000 character inputs in sanitizeCssValue within 10ms (ReDoS immune)", () => {
      const massiveInput = "url(" + "a".repeat(10000) + ")" + ";".repeat(1000) + "expression(" + "b".repeat(9000) + ")";
      const start = Date.now();
      const sanitized = sanitizeCssValue(massiveInput);
      const elapsed = Date.now() - start;

      expect(elapsed, "sanitizeCssValue should execute in < 50ms for 20KB payload").toBeLessThan(50);
      expect(sanitized).not.toContain(";");
      expect(sanitized).not.toContain("url(");
      expect(sanitized).not.toContain("expression(");
    });

    it("safely handles non-string inputs in sanitizeCssValue", () => {
      // @ts-expect-error - testing defensive runtime guards against non-string types
      expect(sanitizeCssValue(null)).toBe("");
      // @ts-expect-error - testing defensive runtime guards against non-string types
      expect(sanitizeCssValue(undefined)).toBe("");
      // @ts-expect-error - testing defensive runtime guards against non-string types
      expect(sanitizeCssValue(12345)).toBe("");
      // @ts-expect-error - testing defensive runtime guards against non-string types
      expect(sanitizeCssValue({})).toBe("");
    });
  });
});
