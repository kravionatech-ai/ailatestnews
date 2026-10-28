/**
 * Application-wide constants.
 * Centralizes magic numbers and strings.
 */

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export const ADMIN_PAGE_SIZE = 20;

// ── Posts ──
export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export const SCHEMA_TYPES = [
  "BlogPosting",
  "NewsArticle",
  "TechArticle",
  "Review",
  "HowTo",
] as const;

// ── Users ──
export const USER_ROLES = ["admin", "editor", "author", "subscriber"] as const;
export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  editor: 3,
  author: 2,
  subscriber: 1,
};

// ── Media ──
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── SEO ──
export const MAX_META_TITLE_LENGTH = 70;
export const MAX_META_DESCRIPTION_LENGTH = 160;
export const MAX_SLUG_LENGTH = 200;

// ── Cache TTL (seconds) ──
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// ── Rate Limiting ──
export const RATE_LIMITS = {
  API: { windowMs: 60_000, max: 100 },
  AUTH: { windowMs: 300_000, max: 10 },
  COMMENT: { windowMs: 60_000, max: 5 },
  SEARCH: { windowMs: 60_000, max: 30 },
  UPLOAD: { windowMs: 60_000, max: 10 },
} as const;

// ── ISR Revalidation (seconds) ──
export const REVALIDATE = {
  HOME: 300, // 5 min
  POST: 3600, // 1 hour
  CATEGORY: 3600,
  TAG: 3600,
  AUTHOR: 3600,
  SEARCH: 60,
  FEED: 3600,
  SITEMAP: 3600,
} as const;

// ── Locales ──
export const SUPPORTED_LOCALES = ["en", "hi"] as const;
export const DEFAULT_LOCALE = "en" as const;
