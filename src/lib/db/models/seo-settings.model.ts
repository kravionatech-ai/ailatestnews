import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IRobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export interface ISitemapSettings {
  enabled: boolean;
  siteUrl: string;
  includeArticles: boolean;
  includeCategories: boolean;
  includeTags: boolean;
  includePages: boolean;
  includeNewsSitemap: boolean;
  newsPublicationName: string;
  newsPublicationLanguage: string;
  newsTimeWindowHours: number;
  excludedUrls: string[];
  enableSplitSitemaps: boolean;
  maxUrlsPerSitemap: number;
  lastGeneratedAt?: Date;
  totalUrlsCount?: number;
  lastError?: string;
}

export interface IRobotsSettings {
  enabled: boolean;
  customRawEnabled: boolean;
  rawContent: string;
  rules: IRobotsRule[];
  sitemaps: string[];
  includeNewsSitemapInRobots: boolean;
  lastPublishedAt?: Date;
}

export interface ISeoSettings {
  sitemap: ISitemapSettings;
  robots: IRobotsSettings;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeoSettingsDoc extends ISeoSettings, Document {}

const RobotsRuleSchema = new Schema<IRobotsRule>(
  {
    userAgent: { type: String, required: true, default: "*" },
    allow: { type: [String], default: ["/"] },
    disallow: {
      type: [String],
      default: ["/admin/", "/api/admin/", "/login/", "/dashboard/", "/private/"],
    },
    crawlDelay: { type: Number, min: 0 },
  },
  { _id: false }
);

const SitemapSettingsSchema = new Schema<ISitemapSettings>(
  {
    enabled: { type: Boolean, default: true },
    siteUrl: {
      type: String,
      default: process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com",
    },
    includeArticles: { type: Boolean, default: true },
    includeCategories: { type: Boolean, default: true },
    includeTags: { type: Boolean, default: true },
    includePages: { type: Boolean, default: true },
    includeNewsSitemap: { type: Boolean, default: true },
    newsPublicationName: { type: String, default: "AI Latest News" },
    newsPublicationLanguage: { type: String, default: "en" },
    newsTimeWindowHours: { type: Number, default: 48, min: 1, max: 168 },
    excludedUrls: { type: [String], default: [] },
    enableSplitSitemaps: { type: Boolean, default: false },
    maxUrlsPerSitemap: { type: Number, default: 50000, min: 100, max: 50000 },
    lastGeneratedAt: { type: Date },
    totalUrlsCount: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
  },
  { _id: false }
);

const RobotsSettingsSchema = new Schema<IRobotsSettings>(
  {
    enabled: { type: Boolean, default: true },
    customRawEnabled: { type: Boolean, default: false },
    rawContent: { type: String, default: "" },
    rules: {
      type: [RobotsRuleSchema],
      default: () => [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/admin/", "/api/admin/", "/login/", "/dashboard/", "/private/"],
        },
      ],
    },
    sitemaps: {
      type: [String],
      default: () => [
        `${process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com"}/sitemap.xml`,
      ],
    },
    includeNewsSitemapInRobots: { type: Boolean, default: true },
    lastPublishedAt: { type: Date },
  },
  { _id: false }
);

const SeoSettingsSchema = new Schema<ISeoSettingsDoc>(
  {
    sitemap: {
      type: SitemapSettingsSchema,
      default: () => ({}),
    },
    robots: {
      type: RobotsSettingsSchema,
      default: () => ({}),
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const SeoSettings: Model<ISeoSettingsDoc> =
  mongoose.models.SeoSettings ||
  mongoose.model<ISeoSettingsDoc>("SeoSettings", SeoSettingsSchema);

export default SeoSettings;
