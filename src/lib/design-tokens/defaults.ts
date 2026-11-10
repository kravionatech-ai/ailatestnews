import { DesignTokens } from "./types";

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primaryDark: "#080D19",
    secondaryDark: "#111C2E",
    primaryAccent: "#10B981",     // Emerald 500
    secondaryAccent: "#34D399",   // Emerald 400
    accentHover: "#059669",       // Emerald 600
    mainBackground: "#F8FAFC",    // Slate 50
    cardBackground: "#FFFFFF",    // Pure White
    secondarySurface: "#F1F5F9",  // Slate 100
    heading: "#0F172A",           // Slate 900
    bodyText: "#334155",          // Slate 700
    mutedText: "#64748B",         // Slate 500
    border: "#E2E8F0",            // Slate 200
    breakingNews: "#EF4444",      // Red 500
    trending: "#F59E0B",          // Amber 500
    success: "#16A34A",           // Green 600
  },
  typography: {
    fontSans: 'var(--font-inter, Inter, system-ui, sans-serif)',
    fontSerif: 'var(--font-merriweather, Merriweather, Georgia, serif)',
    fontMono: 'var(--font-jetbrains-mono, JetBrains Mono, monospace)',
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
    logoText: "AI Latest News",
    logoSubline: "India's Premier AI Publication & Research Desk",
  },
  footer: {
    layout: "5-column",
    backgroundColor: "#080D19",
    textColor: "#94A3B8",
    showSocialLinks: true,
    copyrightText: "AI Latest News (ainews.kraviona.com). All rights reserved.",
    aboutText:
      "India's authoritative AI publication tracking foundational model releases, LLM benchmarks, Indian AI breakthroughs (Sarvam, Krutrim, BharatGPT), and hands-on tooling comparisons in clear, in-depth English.",
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

export const defaultDesignTokens = DEFAULT_DESIGN_TOKENS;
