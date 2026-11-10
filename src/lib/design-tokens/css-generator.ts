import { DesignTokens } from "./types";
import { sanitizeCssValue } from "./schema";

/**
 * Pure function converting DesignTokens into valid, sanitized CSS custom properties.
 * Generates both core token properties and semantic aliases that seamlessly
 * bind to Tailwind v4 @theme classes and existing components.
 */
export function generateCssVariables(
  tokens: DesignTokens,
  selector: string = ":root"
): string {
  const { colors, typography, layout, header, footer, cards } = tokens;

  return `${selector} {
  /* ── Core Design Tokens (Kebab-cased) ── */
  --color-primary-dark: ${sanitizeCssValue(colors.primaryDark)};
  --color-secondary-dark: ${sanitizeCssValue(colors.secondaryDark)};
  --color-primary-accent: ${sanitizeCssValue(colors.primaryAccent)};
  --color-secondary-accent: ${sanitizeCssValue(colors.secondaryAccent)};
  --color-accent-hover: ${sanitizeCssValue(colors.accentHover)};
  --color-main-background: ${sanitizeCssValue(colors.mainBackground)};
  --color-main-bg: ${sanitizeCssValue(colors.mainBackground)};
  --color-card-background: ${sanitizeCssValue(colors.cardBackground)};
  --color-card-bg: ${sanitizeCssValue(colors.cardBackground)};
  --color-secondary-surface: ${sanitizeCssValue(colors.secondarySurface)};
  --color-heading: ${sanitizeCssValue(colors.heading)};
  --color-body-text: ${sanitizeCssValue(colors.bodyText)};
  --color-muted-text: ${sanitizeCssValue(colors.mutedText)};
  --color-border: ${sanitizeCssValue(colors.border)};
  --color-breaking-news: ${sanitizeCssValue(colors.breakingNews)};
  --color-trending: ${sanitizeCssValue(colors.trending)};
  --color-success: ${sanitizeCssValue(colors.success)};

  /* ── Semantic Bindings (Tailwind v4 @theme & Existing Styles) ── */
  --background: ${sanitizeCssValue(colors.mainBackground)};
  --background-secondary: ${sanitizeCssValue(colors.cardBackground)};
  --background-tertiary: ${sanitizeCssValue(colors.secondarySurface)};

  --foreground: ${sanitizeCssValue(colors.heading)};
  --foreground-secondary: ${sanitizeCssValue(colors.bodyText)};
  --foreground-muted: ${sanitizeCssValue(colors.mutedText)};

  --accent: ${sanitizeCssValue(colors.primaryAccent)};
  --accent-hover: ${sanitizeCssValue(colors.accentHover)};
  --accent-light: ${sanitizeCssValue(colors.secondaryAccent)};

  --border: ${sanitizeCssValue(colors.border)};
  --success: ${sanitizeCssValue(colors.success)};
  --breaking: ${sanitizeCssValue(colors.breakingNews)};
  --trending: ${sanitizeCssValue(colors.trending)};

  /* ── Typography Tokens ── */
  --font-sans: ${sanitizeCssValue(typography.fontSans)};
  --font-serif: ${sanitizeCssValue(typography.fontSerif)};
  --font-mono: ${sanitizeCssValue(typography.fontMono)};
  --font-size-base: ${sanitizeCssValue(typography.baseFontSize)};
  --base-font-size: ${sanitizeCssValue(typography.baseFontSize)};
  --line-height-heading: ${sanitizeCssValue(typography.headingLineHeight)};
  --heading-line-height: ${sanitizeCssValue(typography.headingLineHeight)};
  --line-height-body: ${sanitizeCssValue(typography.bodyLineHeight)};
  --body-line-height: ${sanitizeCssValue(typography.bodyLineHeight)};

  /* ── Layout & Shape Tokens ── */
  --layout-max-content-width: ${sanitizeCssValue(layout.maxContentWidth)};
  --max-content-width: ${sanitizeCssValue(layout.maxContentWidth)};
  --layout-container-padding: ${sanitizeCssValue(layout.containerPadding)};
  --container-padding: ${sanitizeCssValue(layout.containerPadding)};
  --layout-card-border-radius: ${sanitizeCssValue(cards?.borderRadius || layout.cardBorderRadius)};
  --card-border-radius: ${sanitizeCssValue(cards?.borderRadius || layout.cardBorderRadius)};
  --radius-card: ${sanitizeCssValue(cards?.borderRadius || layout.cardBorderRadius)};
  --layout-button-border-radius: ${sanitizeCssValue(layout.buttonBorderRadius)};
  --button-border-radius: ${sanitizeCssValue(layout.buttonBorderRadius)};
  --radius: ${sanitizeCssValue(layout.buttonBorderRadius)};

  /* ── Component Specific Tokens ── */
  --header-bg: ${sanitizeCssValue(header.backgroundColor)};
  --header-text: ${sanitizeCssValue(header.textColor)};
  --header-accent: ${sanitizeCssValue(header.accentColor)};
  --footer-bg: ${sanitizeCssValue(footer.backgroundColor)};
  --footer-text: ${sanitizeCssValue(footer.textColor)};
}`;
}

/**
 * Scoped variant generator for Admin Studio preview containers or iframe theme sandboxes.
 */
export function generateScopedCssVariables(
  tokens: DesignTokens,
  scopeSelector: string
): string {
  return generateCssVariables(tokens, scopeSelector);
}
