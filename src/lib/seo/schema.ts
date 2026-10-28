import { Schema } from "mongoose";
import type { ISeoMetadata, ISeoRobots, ISeoSitemap, ISeoHreflang } from "./types";

export const SeoRobotsSchema = new Schema<ISeoRobots>(
  {
    index: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    noarchive: { type: Boolean, default: false },
    nosnippet: { type: Boolean, default: false },
    maxImagePreview: {
      type: String,
      enum: ["large", "standard", "none"],
      default: "large",
    },
  },
  { _id: false }
);

export const SeoSitemapSchema = new Schema<ISeoSitemap>(
  {
    include: { type: Boolean, default: true },
    priority: { type: Number, default: 0.7, min: 0.1, max: 1.0 },
    changefreq: {
      type: String,
      enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
      default: "weekly",
    },
  },
  { _id: false }
);

export const SeoHreflangSchema = new Schema<ISeoHreflang>(
  {
    lang: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export const SeoSchema = new Schema<ISeoMetadata>(
  {
    metaTitle: { type: String, trim: true, maxlength: 100 },
    metaDescription: { type: String, trim: true, maxlength: 300 },
    focusKeyword: { type: String, trim: true, maxlength: 80 },
    secondaryKeywords: [{ type: String, trim: true }],
    canonicalUrl: { type: String, trim: true },
    robots: { type: SeoRobotsSchema, default: () => ({ index: true, follow: true, maxImagePreview: "large" }) },
    ogTitle: { type: String, trim: true, maxlength: 100 },
    ogDescription: { type: String, trim: true, maxlength: 300 },
    ogImage: { type: String, trim: true },
    twitterCard: {
      type: String,
      enum: ["summary", "summary_large_image"],
      default: "summary_large_image",
    },
    schemaType: {
      type: String,
      default: "NewsArticle",
      trim: true,
    },
    schemaOverrides: { type: String, default: "" },
    breadcrumbTitle: { type: String, trim: true },
    sitemap: {
      type: SeoSitemapSchema,
      default: () => ({ include: true, priority: 0.7, changefreq: "weekly" }),
    },
    hreflang: [SeoHreflangSchema],
    redirectFrom: [{ type: String, trim: true }],
    lastReviewedAt: { type: Date },
    seoScore: { type: Number, default: 0, min: 0, max: 100 },
    indexNowStatus: {
      lastPingedAt: { type: Date },
      status: { type: String, enum: ["submitted", "success", "error"] },
      message: { type: String },
    },
  },
  { _id: false }
);
