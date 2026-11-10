import { z } from "zod";

/**
 * Strict Security Regex Patterns
 * Defends against CSS rule breakouts, JavaScript injections, and URL leaks.
 */
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_REGEX = /^rgba?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)(?:\s*,\s*(\d*(?:\.\d+)?%?))?\s*\)$/;
const HSL_COLOR_REGEX = /^hsla?\(\s*(\d{1,3}(?:deg|rad|turn)?)\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)(?:\s*,\s*(\d*(?:\.\d+)?%?))?\s*\)$/;
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
  const isKeyword = val === "transparent" || val === "currentColor";

  if (!isHex && !isRgb && !isHsl && !isKeyword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid color format: "${val}". Must be valid hex, rgb, rgba, hsl, or hsla.`,
    });
  }
});
export const colorSchema = SafeColorSchema;

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
export const cssUnitSchema = SafeDimensionSchema;

export const lineHeightSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\d+(\.\d+)?$/, {
    message: "Invalid line-height value.",
  });

export const fontFamilySchema = z
  .string()
  .trim()
  .min(1)
  .max(250)
  .refine((val) => !/[;{}<>\\]|url\(|expression\(|javascript:/i.test(val), {
    message: "Font family contains illegal CSS or script characters.",
  });

export const safeTextSchema = (maxLength: number = 200) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((val) => val.replace(/[<>]/g, ""));

export const colorsTokensSchema = z.object({
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
});

export const typographyTokensSchema = z.object({
  fontSans: fontFamilySchema,
  fontSerif: fontFamilySchema,
  fontMono: fontFamilySchema,
  baseFontSize: SafeDimensionSchema,
  headingLineHeight: lineHeightSchema,
  bodyLineHeight: lineHeightSchema,
});

export const layoutTokensSchema = z.object({
  maxContentWidth: SafeDimensionSchema,
  containerPadding: SafeDimensionSchema,
  cardBorderRadius: SafeDimensionSchema,
  buttonBorderRadius: SafeDimensionSchema,
});

export const headerTokensSchema = z.object({
  layout: z.enum(["classic", "centered", "minimal", "editorial"]),
  showTopUtilityBar: z.boolean(),
  sticky: z.boolean(),
  backgroundColor: SafeColorSchema,
  textColor: SafeColorSchema,
  accentColor: SafeColorSchema,
  logoText: z.string(),
  logoSubline: z.string(),
});

export const footerTokensSchema = z.object({
  layout: z.enum(["5-column", "4-column", "minimal", "compact"]),
  backgroundColor: SafeColorSchema,
  textColor: SafeColorSchema,
  showSocialLinks: z.boolean(),
  copyrightText: z.string(),
  aboutText: z.string(),
});

export const cardTokensSchema = z.object({
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
});

export const articleTokensSchema = z.object({
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
});

export const DesignTokensSchema = z.object({
  colors: colorsTokensSchema,
  typography: typographyTokensSchema,
  layout: layoutTokensSchema,
  header: headerTokensSchema,
  footer: footerTokensSchema,
  cards: cardTokensSchema,
  article: articleTokensSchema,
});

export const designTokensSchema = DesignTokensSchema;
export const partialDesignTokensSchema = DesignTokensSchema.deepPartial();

/**
 * Secondary defense-in-depth sanitization pass.
 * Guarantees zero executable markup in emitted CSS.
 */
export function sanitizeCssValue(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[;{}<>\\]/g, "")
    .replace(/\burl\s*\((?:[^()]+|\([^()]*\))*\)/gi, "")
    .replace(/\bexpression\s*\((?:[^()]+|\([^()]*\))*\)/gi, "")
    .replace(/\bjavascript:[^"';(]*(\([^()]*\))?/gi, "")
    .trim();
}
