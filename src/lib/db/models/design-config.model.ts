import mongoose, { Schema, type Document, type Model } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript Interfaces conforming to PROJECT.md § Interface Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface IDesignTokensColor {
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

export interface IDesignTokensTypography {
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  baseFontSize: string;      // e.g. "16px"
  headingLineHeight: string; // e.g. "1.2"
  bodyLineHeight: string;    // e.g. "1.6"
}

export interface IDesignTokensLayout {
  maxContentWidth: string;   // e.g. "1280px"
  containerPadding: string;  // e.g. "1.5rem"
  cardBorderRadius: string;  // e.g. "0.75rem"
  buttonBorderRadius: string;// e.g. "0.5rem"
}

export interface IDesignTokensHeader {
  layout: "classic" | "centered" | "minimal" | "editorial";
  showTopUtilityBar: boolean;
  sticky: boolean;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoText: string;
  logoSubline: string;
}

export interface IDesignTokensFooter {
  layout: "5-column" | "4-column" | "minimal" | "compact";
  backgroundColor: string;
  textColor: string;
  showSocialLinks: boolean;
  copyrightText: string;
  aboutText: string;
}

export interface IDesignTokensCards {
  defaultVariant:
    | "classic-editorial"
    | "modern-magazine"
    | "horizontal"
    | "compact"
    | "large-featured"
    | "image-overlay"
    | "minimal-list";
  showBadges: boolean;
  showAuthorAvatar: boolean;
  showReadingTime: boolean;
  showViewsCount: boolean;
  borderRadius: string;
}

export interface IDesignTokensArticle {
  defaultTemplate:
    | "standard-editorial"
    | "premium-magazine"
    | "minimal-reading"
    | "wide-article"
    | "without-sidebar";
  showStickyProgress: boolean;
  showReadingControls: boolean;
  showKeyTakeaways: boolean;
  showTableOfContents: boolean;
  showCommunityPoll: boolean;
  showAuthorBio: boolean;
  showReactions: boolean;
  showRelatedPosts: boolean;
}

export interface IDesignTokens {
  colors: IDesignTokensColor;
  typography: IDesignTokensTypography;
  layout: IDesignTokensLayout;
  header: IDesignTokensHeader;
  footer: IDesignTokensFooter;
  cards: IDesignTokensCards;
  article: IDesignTokensArticle;
}

export type SectionType =
  | "breaking-news"
  | "hero"
  | "model-launches"
  | "india-ai"
  | "ai-tools"
  | "guides"
  | "enterprise-ai"
  | "trending-latest"
  | "benchmark-leaderboard"
  | "model-calculator"
  | "newsletter"
  | "site-intro"
  | "faq"
  | "community-poll"
  | "model-releases";

export interface IHomepageSectionConfig {
  id: string;                  // unique instance id
  type: SectionType;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: string;
  limit?: number;
  categoryFilter?: string;
  customSettings?: Record<string, unknown>;
}

export interface IDesignConfigSnapshot {
  tokens: IDesignTokens;
  homepageSections: IHomepageSectionConfig[];
  activeThemePreset?: string;
  version: number;
  publishedAt: Date;
  publishedBy: string;
  changeNote?: string;
}

export interface IDesignConfigDocument extends Document {
  draft: {
    tokens: IDesignTokens;
    homepageSections: IHomepageSectionConfig[];
    activeThemePreset?: string;
    updatedAt: Date;
    updatedBy: string;
  };
  published: {
    tokens: IDesignTokens;
    homepageSections: IHomepageSectionConfig[];
    activeThemePreset?: string;
    version: number;
    publishedAt: Date;
    publishedBy: string;
  };
  history: IDesignConfigSnapshot[];
  previewSecret: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mongoose Schemas
// ─────────────────────────────────────────────────────────────────────────────

const SnapshotSchema = new Schema(
  {
    tokens: { type: Schema.Types.Mixed, required: true },
    homepageSections: { type: [Schema.Types.Mixed], default: [] },
    activeThemePreset: { type: String, default: "premium-editorial" },
    version: { type: Number, required: true },
    publishedAt: { type: Date, default: Date.now },
    publishedBy: { type: String, required: true },
    changeNote: { type: String },
  },
  { _id: false }
);

const DesignConfigSchema = new Schema<IDesignConfigDocument>(
  {
    draft: {
      tokens: { type: Schema.Types.Mixed, required: true },
      homepageSections: { type: [Schema.Types.Mixed], default: [] },
      activeThemePreset: { type: String, default: "premium-editorial" },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: String, default: "system" },
    },
    published: {
      tokens: { type: Schema.Types.Mixed, required: true },
      homepageSections: { type: [Schema.Types.Mixed], default: [] },
      activeThemePreset: { type: String, default: "premium-editorial" },
      version: { type: Number, default: 1 },
      publishedAt: { type: Date, default: Date.now },
      publishedBy: { type: String, default: "system" },
    },
    history: {
      type: [SnapshotSchema],
      default: [],
    },
    previewSecret: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

DesignConfigSchema.index({ "published.version": 1 });
DesignConfigSchema.index({ updatedAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Compilation & Model Export
// ─────────────────────────────────────────────────────────────────────────────

export const DesignConfig: Model<IDesignConfigDocument> =
  mongoose.models.DesignConfig ||
  mongoose.model<IDesignConfigDocument>("DesignConfig", DesignConfigSchema);

export default DesignConfig;
