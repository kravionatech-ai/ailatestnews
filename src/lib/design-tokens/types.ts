/**
 * Centralized Design Token Interface Contracts
 * Conforming strictly to PROJECT.md § Interface Contracts
 */

export type HeaderLayout = "classic" | "centered" | "minimal" | "editorial";
export type FooterLayout = "5-column" | "4-column" | "minimal" | "compact";

export type CardVariant =
  | "classic-editorial"
  | "modern-magazine"
  | "horizontal"
  | "compact"
  | "large-featured"
  | "image-overlay"
  | "minimal-list";

export type ArticleLayoutTemplate =
  | "standard-editorial"
  | "premium-magazine"
  | "minimal-reading"
  | "wide-article"
  | "without-sidebar";

export type ThemePresetId =
  | "premium-editorial"
  | "modern-tech"
  | "minimal-magazine"
  | "dark-tech"
  | "dark-technology"
  | "classic-newspaper";

export interface ColorTokens {
  primaryDark: string;       // default: #080D19
  secondaryDark: string;     // default: #111C2E
  primaryAccent: string;     // default: #10B981 (Emerald)
  secondaryAccent: string;   // default: #34D399
  accentHover: string;       // default: #059669
  mainBackground: string;    // default: #F8FAFC
  cardBackground: string;    // default: #FFFFFF
  secondarySurface: string;  // default: #F1F5F9
  heading: string;           // default: #0F172A
  bodyText: string;          // default: #334155
  mutedText: string;         // default: #64748B
  border: string;            // default: #E2E8F0
  breakingNews: string;      // default: #EF4444
  trending: string;          // default: #F59E0B
  success: string;           // default: #16A34A
}

export interface TypographyTokens {
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  baseFontSize: string;      // e.g. "16px"
  headingLineHeight: string; // e.g. "1.2"
  bodyLineHeight: string;    // e.g. "1.6"
}

export interface LayoutTokens {
  maxContentWidth: string;   // e.g. "1280px"
  containerPadding: string;  // e.g. "1.5rem"
  cardBorderRadius: string;  // e.g. "0.75rem"
  buttonBorderRadius: string;// e.g. "0.5rem"
}

export interface HeaderTokens {
  layout: HeaderLayout;
  showTopUtilityBar: boolean;
  sticky: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoText: string;
  logoSubline: string;
}

export interface FooterTokens {
  layout: FooterLayout;
  backgroundColor: string;
  textColor: string;
  showSocialLinks: boolean;
  copyrightText: string;
  aboutText: string;
}

export interface CardTokens {
  defaultVariant: CardVariant;
  showBadges: boolean;
  showAuthorAvatar: boolean;
  showReadingTime: boolean;
  showViewsCount: boolean;
  borderRadius: string;
}

export interface ArticleTokens {
  defaultTemplate: ArticleLayoutTemplate;
  showStickyProgress: boolean;
  showReadingControls: boolean;
  showKeyTakeaways: boolean;
  showTableOfContents: boolean;
  showCommunityPoll: boolean;
  showAuthorBio: boolean;
  showReactions: boolean;
  showRelatedPosts: boolean;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  layout: LayoutTokens;
  header: HeaderTokens;
  footer: FooterTokens;
  cards: CardTokens;
  article: ArticleTokens;
}

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  tokens: DesignTokens;
}
