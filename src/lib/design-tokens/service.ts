import { cache } from "react";
import { cookies, headers, draftMode } from "next/headers";
import { connectDB } from "@/lib/db/connection";
import { DesignConfig } from "@/lib/db/models/design-config.model";
import { DEFAULT_DESIGN_TOKENS } from "./defaults";
import { DesignTokens } from "./types";
import { DesignTokensSchema } from "./schema";
import { DEFAULT_HOMEPAGE_SECTIONS, HomepageSectionsSchema, HomepageSectionConfig } from "./sections";

let cachedPublishedTokens: DesignTokens | null = null;
let cacheExpiresAt = 0;

let cachedPublishedSections: HomepageSectionConfig[] | null = null;
let sectionsCacheExpiresAt = 0;

/**
 * Invalidate in-memory tokens cache (invoked after publish/rollback Server Actions).
 */
export function invalidateDesignTokensCache(): void {
  cachedPublishedTokens = null;
  cacheExpiresAt = 0;
}

/**
 * Invalidate in-memory homepage sections cache (invoked after publish/rollback Server Actions).
 */
export function invalidateHomepageSectionsCache(): void {
  cachedPublishedSections = null;
  sectionsCacheExpiresAt = 0;
}

/**
 * Fetch active design tokens with automatic Preview vs. Published resolution.
 * - Public visitors receive published tokens (cached in-memory for 60s).
 * - Admin live preview receives draft tokens.
 * - Graceful fallback to DEFAULT_DESIGN_TOKENS on DB cold start or failure.
 */
export const getActiveDesignTokens = cache(
  async function getActiveDesignTokens(): Promise<DesignTokens> {
    let isPreview = false;

    try {
      // 1. Check internal header forwarded by Edge middleware
      const headerStore = await headers();
      if (headerStore.get("x-design-preview") === "true") {
        isPreview = true;
      }
    } catch {
      // Headers unavailable in static/test context
    }

    if (!isPreview) {
      try {
        const draft = await draftMode();
        if (draft.isEnabled) {
          isPreview = true;
        } else {
          const cookieStore = await cookies();
          const previewVal = cookieStore.get("design_preview")?.value;
          if (previewVal === "true" || previewVal === "draft") {
            isPreview = true;
          }
        }
      } catch {
        // Cookies/draftMode unavailable in static/test context
        isPreview = false;
      }
    }

    const now = Date.now();
    if (!isPreview && cachedPublishedTokens && now < cacheExpiresAt) {
      return cachedPublishedTokens;
    }

    try {
      await connectDB();
      const config = await DesignConfig.findOne().sort({ createdAt: -1 }).lean();

      if (config) {
        const rawTokens = isPreview
          ? config.draft?.tokens
          : config.published?.tokens;

        if (rawTokens) {
          const parsed = DesignTokensSchema.safeParse(rawTokens);
          if (parsed.success) {
            if (!isPreview) {
              cachedPublishedTokens = parsed.data;
              cacheExpiresAt = now + 60_000;
            }
            return parsed.data;
          }
        }
      }
    } catch (err) {
      console.warn("[getActiveDesignTokens] Fallback to default tokens:", err);
    }

    if (!isPreview) {
      cachedPublishedTokens = DEFAULT_DESIGN_TOKENS;
      cacheExpiresAt = now + 60_000;
    }
    return DEFAULT_DESIGN_TOKENS;
  }
);

export interface GetActiveSectionsOptions {
  isPreview?: boolean;
  previewToken?: string;
}

/**
 * Fetch active homepage sections with automatic Preview vs. Published resolution.
 * - Public visitors receive published sections (cached in-memory for 60s).
 * - Live preview receives draft sections if token or admin session is verified.
 * - Graceful fallback to DEFAULT_HOMEPAGE_SECTIONS.
 */
export async function getActiveHomepageSections(
  options?: GetActiveSectionsOptions
): Promise<{ sections: HomepageSectionConfig[]; isPreview: boolean }> {
  let isPreview = false;

  // 1. Check internal header forwarded by Edge middleware
  try {
    const headerStore = await headers();
    if (headerStore.get("x-design-preview") === "true") {
      isPreview = true;
    }
  } catch {
    // Headers unavailable in static/test context
  }

  // 2. Draft mode or cookie check
  if (!isPreview) {
    try {
      const draft = await draftMode();
      if (draft.isEnabled) {
        isPreview = true;
      } else {
        const cookieStore = await cookies();
        const previewVal = cookieStore.get("design_preview")?.value;
        if (previewVal === "true" || previewVal === "draft") {
          isPreview = true;
        }
      }
    } catch {
      // Cookies/draftMode unavailable in static/test context
      isPreview = false;
    }
  }

  // 3. In-memory cache for public visitors
  const now = Date.now();
  if (!isPreview && !options?.isPreview && cachedPublishedSections && now < sectionsCacheExpiresAt) {
    return { sections: cachedPublishedSections, isPreview: false };
  }

  try {
    await connectDB();
    const config = await DesignConfig.findOne().sort({ createdAt: -1 }).lean();

    // 4. Validate explicit preview token if passed via searchParams/options
    if (!isPreview && options?.isPreview) {
      const tokenMatches =
        (options.previewToken && config?.previewSecret && options.previewToken === config.previewSecret) ||
        (options.previewToken && process.env.DESIGN_PREVIEW_SECRET && options.previewToken === process.env.DESIGN_PREVIEW_SECRET);

      if (tokenMatches) {
        isPreview = true;
      } else {
        // Fallback: check session role
        try {
          const { auth } = await import("@/lib/auth/auth");
          const session = await auth();
          const role = (session?.user as { role?: string })?.role;
          if (role === "admin" || role === "super_admin") {
            isPreview = true;
          }
        } catch {
          // Auth failed or unavailable
        }
      }
    }

    if (config) {
      const rawSections = isPreview
        ? config.draft?.homepageSections
        : config.published?.homepageSections;

      if (Array.isArray(rawSections) && rawSections.length > 0) {
        const parsed = HomepageSectionsSchema.safeParse(rawSections);
        if (parsed.success) {
          if (!isPreview) {
            cachedPublishedSections = parsed.data;
            sectionsCacheExpiresAt = now + 60_000;
          }
          return { sections: parsed.data, isPreview };
        }
      }
    }
  } catch (err) {
    console.warn("[getActiveHomepageSections] Fallback to default sections:", err);
  }

  if (!isPreview) {
    cachedPublishedSections = DEFAULT_HOMEPAGE_SECTIONS;
    sectionsCacheExpiresAt = now + 60_000;
  }
  return { sections: DEFAULT_HOMEPAGE_SECTIONS, isPreview: isPreview && Boolean(options?.isPreview) };
}

