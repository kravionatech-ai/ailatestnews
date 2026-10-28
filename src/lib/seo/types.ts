export interface ISeoRobots {
  index: boolean;
  follow: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  maxImagePreview?: "large" | "standard" | "none";
}

export interface ISeoSitemap {
  include: boolean;
  priority: number; // 0.1 to 1.0
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}

export interface ISeoHreflang {
  lang: string;
  url: string;
}

export interface ISeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  robots?: ISeoRobots;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  schemaType?: string;
  schemaOverrides?: string; // Custom JSON-LD string
  breadcrumbTitle?: string;
  sitemap?: ISeoSitemap;
  hreflang?: ISeoHreflang[];
  redirectFrom?: string[];
  lastReviewedAt?: Date | string;
  seoScore?: number;
  indexNowStatus?: {
    lastPingedAt?: Date | string;
    status?: "submitted" | "success" | "error";
    message?: string;
  };
}

export type EntityType = "post" | "page" | "category" | "tag" | "author" | "home";

export interface ISeoTemplateVariables {
  title?: string;
  site?: string;
  category?: string;
  author?: string;
  year?: string | number;
  month?: string;
  excerpt?: string;
  separator?: string;
}

export interface ISeoScoreRule {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  points: number;
  maxPoints: number;
  message: string;
  fixHint?: string;
}

export interface ISeoAnalysisResult {
  score: number; // 0 to 100
  grade: "poor" | "ok" | "good" | "excellent";
  checklist: ISeoScoreRule[];
  wordCount: number;
  readingTime: number;
  titlePixelWidth: number;
  descriptionPixelWidth: number;
}
