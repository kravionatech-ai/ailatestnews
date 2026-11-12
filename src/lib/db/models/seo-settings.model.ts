import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { getSiteUrl } from "@/lib/seo/domain";

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface ICustomSeoEntry {
  id: string;
  url: string;
  title?: string;
  description?: string;
  authorName?: string;
  lastModified?: Date | string;
  publicationDate?: Date | string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
  includeInSitemap: boolean;
  includeInFeed: boolean;
  includeInNewsSitemap: boolean;
  enabled: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

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
  customUrls?: ICustomSeoEntry[];
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

const CustomSeoEntrySchema = new Schema<ICustomSeoEntry>(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true, maxlength: 300, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    authorName: { type: String, trim: true, maxlength: 120, default: "" },
    lastModified: { type: Date },
    publicationDate: { type: Date },
    changeFrequency: {
      type: String,
      enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
      default: "weekly",
    },
    priority: { type: Number, default: 0.8, min: 0.0, max: 1.0 },
    includeInSitemap: { type: Boolean, default: true },
    includeInFeed: { type: Boolean, default: false },
    includeInNewsSitemap: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SitemapSettingsSchema = new Schema<ISitemapSettings>(
  {
    enabled: { type: Boolean, default: true },
    siteUrl: {
      type: String,
      default: () => getSiteUrl(),
    },
    includeArticles: { type: Boolean, default: true },
    includeCategories: { type: Boolean, default: true },
    includeTags: { type: Boolean, default: true },
    includePages: { type: Boolean, default: true },
    includeNewsSitemap: { type: Boolean, default: true },
    newsPublicationName: { type: String, default: "Kraviona AI News" },
    newsPublicationLanguage: { type: String, default: "en" },
    newsTimeWindowHours: { type: Number, default: 48, min: 1, max: 168 },
    excludedUrls: { type: [String], default: [] },
    customUrls: { type: [CustomSeoEntrySchema], default: [] },
    enableSplitSitemaps: { type: Boolean, default: true },
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
      default: () => {
        const base = getSiteUrl();
        return [`${base}/sitemap.xml`, `${base}/image-sitemap.xml`];
      },
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
