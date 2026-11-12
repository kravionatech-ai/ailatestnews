"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import {
  SeoSettings,
  Post,
  Category,
  Page,
  Tag,
  AuditLog,
  User,
  type ICustomSeoEntry,
  type SitemapChangeFrequency,
} from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  getImageSitemapEntries,
  getGoogleNewsArticles,
  getRssFeedItems,
  deduplicateSitemapEntries,
  buildUrlsetXml,
  buildImageSitemapXml,
  buildGoogleNewsXml,
  buildRssFeedXml,
  buildRobotsTxt,
  resolveCanonicalEntryUrl,
  normalizeChangeFrequency,
  normalizeSeoSettingsForDisplay,
} from "@/lib/seo/seo-settings-service";
import { getGlobalSeoSettings } from "@/lib/seo/fallback";
import {
  getSiteUrl,
  normalizeSiteUrl,
  resolveEffectiveSiteUrl,
  rewriteLegacyOriginUrl,
  rewriteLegacyRobotsTxt,
} from "@/lib/seo/domain";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";

/**
 * Helper to enforce administrator session server-side.
 */
async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please log in as an administrator.");
  }

  await connectDB();
  const dbUser = await User.findById(session.user.id).select("role isActive").lean();
  if (!dbUser || !dbUser.isActive || (dbUser as { role?: string }).role !== "admin") {
    throw new Error("Forbidden. Administrator privileges required.");
  }

  return session.user;
}

async function computeDashboardStats(settings: Awaited<ReturnType<typeof getOrInitSeoSettings>>) {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    noindexPosts,
    totalCategories,
    totalPages,
    noindexPages,
    newsArticles,
    feedItems,
    collections,
  ] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "draft" }),
    Post.countDocuments({ "seo.robots.index": false }),
    Category.countDocuments({ isActive: true }),
    Page.countDocuments({ status: "published" }),
    Page.countDocuments({ "seo.robots.index": false }),
    getGoogleNewsArticles(settings),
    getRssFeedItems(settings, 30),
    getAllSitemapCollections(settings),
  ]);

  const {
    staticRoutes,
    postRoutes,
    categoryRoutes,
    tagRoutes,
    pageRoutes,
    customRoutes,
  } = collections;

  const allEntries = deduplicateSitemapEntries([
    ...staticRoutes,
    ...postRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...pageRoutes,
    ...customRoutes,
  ]);

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    noindexPosts,
    totalCategories,
    totalPages,
    noindexPages,
    totalIndexableUrls:
      postRoutes.length +
      categoryRoutes.length +
      pageRoutes.length +
      staticRoutes.length +
      customRoutes.length,
    totalUrlsInSitemap: allEntries.length,
    customUrlsCount: customRoutes.length,
    feedItemsCount: feedItems.length,
    newsArticlesCount: newsArticles.length,
    sitemapLastGenerated: settings.sitemap.lastGeneratedAt,
    robotsLastPublished: settings.robots.lastPublishedAt,
    lastError: settings.sitemap.lastError || "",
  };
}

/**
 * Fetch current SEO Settings along with live health statistics.
 */
export async function getSeoSettingsAction() {
  try {
    await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();
    const stats = await computeDashboardStats(settings);

    return {
      success: true,
      settings: normalizeSeoSettingsForDisplay(settings),
      stats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load SEO settings";
    console.error("[getSeoSettingsAction Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Save and apply Sitemap Configuration.
 */
export async function updateSitemapSettingsAction(formData: {
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
}) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    // Sanitize siteUrl and block accidentally re-saving retired legacy hosts
    const cleanSiteUrl = resolveEffectiveSiteUrl(
      normalizeSiteUrl(formData.siteUrl, getSiteUrl())
    );

    // Sanitize excluded URLs
    const cleanExcluded = (formData.excludedUrls || [])
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && !u.startsWith("#"));

    const settings = await getOrInitSeoSettings();
    const preservedCustomUrls = Array.isArray(formData.customUrls)
      ? formData.customUrls
      : settings.sitemap.customUrls || [];

    settings.sitemap = {
      enabled: Boolean(formData.enabled),
      siteUrl: cleanSiteUrl,
      includeArticles: Boolean(formData.includeArticles),
      includeCategories: Boolean(formData.includeCategories),
      includeTags: Boolean(formData.includeTags),
      includePages: Boolean(formData.includePages),
      includeNewsSitemap: Boolean(formData.includeNewsSitemap),
      newsPublicationName: (formData.newsPublicationName || "Kraviona AI News").trim().slice(0, 100),
      newsPublicationLanguage: (formData.newsPublicationLanguage || "en").trim().slice(0, 10),
      newsTimeWindowHours: Math.max(1, Math.min(168, Number(formData.newsTimeWindowHours) || 48)),
      excludedUrls: cleanExcluded,
      customUrls: preservedCustomUrls,
      enableSplitSitemaps: Boolean(formData.enableSplitSitemaps),
      maxUrlsPerSitemap: Math.max(100, Math.min(50000, Number(formData.maxUrlsPerSitemap) || 50000)),
      lastGeneratedAt: new Date(),
      lastError: "",
      totalUrlsCount: settings.sitemap.totalUrlsCount || 0,
    };

    settings.updatedBy = adminUser.id as unknown as typeof settings.updatedBy;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "update",
      resource: "SITEMAP_CONFIG",
      resourceId: settings._id,
      details: { siteUrl: cleanSiteUrl, enabled: formData.enabled },
    });

    // Revalidate all sitemap routes, RSS feed, and news sitemap
    await triggerSeoRevalidation({ path: "/sitemap.xml", forceIndexNow: true });
    revalidatePath("/admin/seo");

    const refreshedSettings = await getOrInitSeoSettings();
    const stats = await computeDashboardStats(refreshedSettings);

    return {
      success: true,
      settings: normalizeSeoSettingsForDisplay(refreshedSettings),
      stats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update sitemap configuration";
    console.error("[updateSitemapSettingsAction Error]", msg);
    return { success: false, error: msg };
  }
}

export interface UpsertCustomSeoEntryInput {
  id?: string;
  url: string;
  title?: string;
  description?: string;
  authorName?: string;
  lastModified?: string;
  publicationDate?: string;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
  includeInSitemap: boolean;
  includeInFeed: boolean;
  includeInNewsSitemap: boolean;
  enabled?: boolean;
}

/**
 * Add or update a custom URL entry for Sitemap, RSS Feed, and/or Google News Sitemap.
 */
export async function upsertCustomSeoEntryAction(input: UpsertCustomSeoEntryInput) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();
    const siteUrl = resolveEffectiveSiteUrl(settings.sitemap.siteUrl);

    const resolvedUrl = resolveCanonicalEntryUrl(input.url, siteUrl);
    if (!resolvedUrl) {
      return {
        success: false,
        error: "Please enter a valid relative path (e.g. /ai-report) or http(s):// URL.",
      };
    }

    const includeInSitemap = Boolean(input.includeInSitemap);
    const includeInFeed = Boolean(input.includeInFeed);
    const includeInNewsSitemap = Boolean(input.includeInNewsSitemap);

    if (!includeInSitemap && !includeInFeed && !includeInNewsSitemap) {
      return {
        success: false,
        error: "Select at least one target output (Sitemap, RSS Feed, or Google News Sitemap).",
      };
    }

    const cleanTitle = (input.title || "").trim().slice(0, 300);
    if ((includeInFeed || includeInNewsSitemap) && !cleanTitle) {
      return {
        success: false,
        error: "A headline / title is required when adding a custom entry to RSS Feed or News Sitemap.",
      };
    }

    const parseDateOrUndefined = (val?: string) => {
      if (!val || !val.trim()) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const now = new Date();
    const parsedPubDate = parseDateOrUndefined(input.publicationDate);
    const parsedLastMod = parseDateOrUndefined(input.lastModified) || parsedPubDate || now;

    const priorityNum = Number(input.priority ?? 0.8);
    const cleanPriority = Number.isFinite(priorityNum)
      ? Math.max(0.0, Math.min(1.0, Math.round(priorityNum * 10) / 10))
      : 0.8;

    const existingList = [...(settings.sitemap.customUrls || [])];
    const targetId = input.id?.trim() || crypto.randomUUID();
    const existingIdx = existingList.findIndex((item) => item.id === targetId);

    // Prevent accidental duplicate URL when creating a new entry
    const duplicateUrlEntry = existingList.find(
      (item) =>
        item.id !== targetId &&
        (resolveCanonicalEntryUrl(item.url, siteUrl) || "").toLowerCase() === resolvedUrl.toLowerCase()
    );
    if (duplicateUrlEntry) {
      return {
        success: false,
        error: `A custom entry for "${resolvedUrl}" already exists. Edit the existing entry instead.`,
      };
    }

    const storedUrl =
      input.url.trim().startsWith("/") ? input.url.trim() : resolvedUrl;

    const normalizedEntry: ICustomSeoEntry = {
      id: targetId,
      url: storedUrl,
      title: cleanTitle,
      description: (input.description || "").trim().slice(0, 1000),
      authorName: (input.authorName || "").trim().slice(0, 120),
      lastModified: parsedLastMod,
      publicationDate:
        parsedPubDate ||
        (includeInFeed || includeInNewsSitemap ? now : undefined),
      changeFrequency: normalizeChangeFrequency(input.changeFrequency, "weekly"),
      priority: cleanPriority,
      includeInSitemap,
      includeInFeed,
      includeInNewsSitemap,
      enabled: input.enabled ?? true,
      createdAt:
        existingIdx >= 0 && existingList[existingIdx]?.createdAt
          ? existingList[existingIdx].createdAt
          : now,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      existingList[existingIdx] = normalizedEntry;
    } else {
      existingList.unshift(normalizedEntry);
    }

    settings.sitemap.customUrls = existingList;
    settings.updatedBy = adminUser.id as unknown as typeof settings.updatedBy;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: existingIdx >= 0 ? "update" : "create",
      resource: "CUSTOM_SEO_ENTRY",
      resourceId: settings._id,
      details: {
        entryId: targetId,
        url: resolvedUrl,
        includeInSitemap,
        includeInFeed,
        includeInNewsSitemap,
      },
    });

    await triggerSeoRevalidation({
      path: storedUrl.startsWith("/") ? storedUrl : "/sitemap.xml",
      pingUrls: [resolvedUrl],
      forceIndexNow:
        Boolean(normalizedEntry.enabled) && (includeInSitemap || includeInNewsSitemap),
    });
    revalidatePath("/admin/seo");

    const refreshedSettings = await getOrInitSeoSettings();
    const stats = await computeDashboardStats(refreshedSettings);

    return {
      success: true,
      entry: JSON.parse(JSON.stringify(normalizedEntry)),
      settings: JSON.parse(JSON.stringify(refreshedSettings)),
      stats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save custom entry";
    console.error("[upsertCustomSeoEntryAction Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Enable or disable an existing custom SEO entry.
 */
export async function toggleCustomSeoEntryAction(id: string, enabled: boolean) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();
    const list = [...(settings.sitemap.customUrls || [])];
    const idx = list.findIndex((item) => item.id === id);
    const existingItem = idx >= 0 ? list[idx] : undefined;
    if (idx < 0 || !existingItem) {
      return { success: false, error: "Custom entry not found." };
    }

    const updatedItem: ICustomSeoEntry = {
      ...existingItem,
      enabled: Boolean(enabled),
      updatedAt: new Date(),
    };
    list[idx] = updatedItem;

    settings.sitemap.customUrls = list;
    settings.updatedBy = adminUser.id as unknown as typeof settings.updatedBy;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "update",
      resource: "CUSTOM_SEO_ENTRY",
      resourceId: settings._id,
      details: { entryId: id, enabled: Boolean(enabled), url: updatedItem.url },
    });

    await triggerSeoRevalidation({
      path: "/sitemap.xml",
      forceIndexNow: Boolean(enabled),
    });
    revalidatePath("/admin/seo");

    const refreshedSettings = await getOrInitSeoSettings();
    const stats = await computeDashboardStats(refreshedSettings);

    return {
      success: true,
      settings: normalizeSeoSettingsForDisplay(refreshedSettings),
      stats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle custom entry";
    return { success: false, error: msg };
  }
}

/**
 * Delete a custom URL entry from Sitemap, RSS Feed, and Google News Sitemap.
 */
export async function deleteCustomSeoEntryAction(id: string) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();
    const existingList = settings.sitemap.customUrls || [];
    const removed = existingList.find((item) => item.id === id);
    if (!removed) {
      return { success: false, error: "Custom entry not found." };
    }

    settings.sitemap.customUrls = existingList.filter((item) => item.id !== id);
    settings.updatedBy = adminUser.id as unknown as typeof settings.updatedBy;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "delete",
      resource: "CUSTOM_SEO_ENTRY",
      resourceId: settings._id,
      details: { entryId: id, url: removed.url },
    });

    await triggerSeoRevalidation({
      path: "/sitemap.xml",
      forceIndexNow: false,
    });
    revalidatePath("/admin/seo");

    const refreshedSettings = await getOrInitSeoSettings();
    const stats = await computeDashboardStats(refreshedSettings);

    return {
      success: true,
      settings: normalizeSeoSettingsForDisplay(refreshedSettings),
      stats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete custom entry";
    return { success: false, error: msg };
  }
}

/**
 * Save and apply Robots.txt Configuration.
 */
export async function updateRobotsSettingsAction(data: {
  enabled: boolean;
  customRawEnabled: boolean;
  rawContent: string;
  rules: Array<{
    userAgent: string;
    allow: string[];
    disallow: string[];
    crawlDelay?: number;
  }>;
  sitemaps: string[];
  includeNewsSitemapInRobots: boolean;
}) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    // Security validation against malicious raw content
    if (data.customRawEnabled && data.rawContent) {
      if (data.rawContent.includes("<script") || data.rawContent.includes("<?php")) {
        return {
          success: false,
          error: "Security Alert: Invalid characters or script tags in robots.txt.",
        };
      }
    }

    const settings = await getOrInitSeoSettings();

    // Clean rules
    const sanitizedRules = (data.rules || []).map((r) => ({
      userAgent: (r.userAgent || "*").trim(),
      allow: (r.allow || []).map((p) => p.trim()).filter(Boolean),
      disallow: (r.disallow || []).map((p) => p.trim()).filter(Boolean),
      crawlDelay: r.crawlDelay && r.crawlDelay > 0 ? Number(r.crawlDelay) : undefined,
    }));

    const effectiveSiteUrl = resolveEffectiveSiteUrl(settings.sitemap.siteUrl);

    // Clean sitemaps list and rewrite any legacy/sibling origins
    const sanitizedSitemaps = Array.from(
      new Set(
        (data.sitemaps || [])
          .map((s) => rewriteLegacyOriginUrl(s.trim(), effectiveSiteUrl))
          .filter((s) => s.startsWith("http://") || s.startsWith("https://"))
      )
    );

    const normalizedRawContent = data.rawContent
      ? rewriteLegacyRobotsTxt(data.rawContent, effectiveSiteUrl).slice(0, 10000).trim()
      : "";

    settings.robots = {
      enabled: Boolean(data.enabled),
      customRawEnabled: Boolean(data.customRawEnabled),
      rawContent: normalizedRawContent,
      rules:
        sanitizedRules.length > 0
          ? sanitizedRules
          : [
              {
                userAgent: "*",
                allow: ["/"],
                disallow: ["/admin/", "/api/admin/", "/login/", "/dashboard/", "/private/"],
              },
            ],
      sitemaps:
        sanitizedSitemaps.length > 0
          ? sanitizedSitemaps
          : [`${effectiveSiteUrl}/sitemap.xml`],
      includeNewsSitemapInRobots: Boolean(data.includeNewsSitemapInRobots),
      lastPublishedAt: new Date(),
    };

    settings.updatedBy = adminUser.id as unknown as typeof settings.updatedBy;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "update",
      resource: "ROBOTS_CONFIG",
      resourceId: settings._id,
      details: { customRawEnabled: data.customRawEnabled, rulesCount: sanitizedRules.length },
    });

    revalidatePath("/robots.txt");
    revalidatePath("/admin/seo");

    return { success: true, settings: normalizeSeoSettingsForDisplay(settings) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update robots.txt configuration";
    console.error("[updateRobotsSettingsAction Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Manually trigger sitemap regeneration and validate XML.
 */
export async function triggerManualSitemapRegenerationAction() {
  try {
    await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();
    const {
      staticRoutes,
      postRoutes,
      categoryRoutes,
      tagRoutes,
      pageRoutes,
      customRoutes,
    } = await getAllSitemapCollections(settings);

    const allEntries = deduplicateSitemapEntries([
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
      ...customRoutes,
    ]);

    const xml = buildUrlsetXml(allEntries);

    // Validate XML syntax
    if (!xml.startsWith("<?xml") || !xml.includes("<urlset") || !xml.includes("</urlset>")) {
      throw new Error("Validation Failed: Generated sitemap is not valid XML.");
    }

    settings.sitemap.lastGeneratedAt = new Date();
    settings.sitemap.totalUrlsCount = allEntries.length;
    settings.sitemap.lastError = "";
    await settings.save();

    await triggerSeoRevalidation({ path: "/sitemap.xml", forceIndexNow: true });
    revalidatePath("/admin/seo");

    return {
      success: true,
      totalCount: allEntries.length,
      lastGeneratedAt: settings.sitemap.lastGeneratedAt,
      sampleUrls: allEntries.slice(0, 10).map((e) => e.url),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to regenerate sitemap";
    console.error("[triggerManualSitemapRegenerationAction Error]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Generate preview XML string for admin inspection.
 */
export async function previewSitemapXmlAction(
  type: "all" | "articles" | "categories" | "images" | "tags" | "pages" | "custom" | "news" | "feed"
) {
  try {
    await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();

    if (type === "images") {
      const items = await getImageSitemapEntries(settings);
      const xml = buildImageSitemapXml(items);
      return { success: true, xml, count: items.length };
    }

    if (type === "news") {
      const items = await getGoogleNewsArticles(settings);
      const xml = buildGoogleNewsXml(items);
      return { success: true, xml, count: items.length };
    }

    if (type === "feed") {
      const globalSettings = await getGlobalSeoSettings();
      const siteUrl = resolveEffectiveSiteUrl(
        settings.sitemap.siteUrl || globalSettings.siteUrl
      );
      const items = await getRssFeedItems(settings, 30);
      const xml = buildRssFeedXml(items, {
        siteName: globalSettings.siteName,
        siteUrl,
        tagline: globalSettings.tagline,
        language: settings.sitemap.newsPublicationLanguage || "en",
      });
      return { success: true, xml, count: items.length };
    }

    const {
      staticRoutes,
      postRoutes,
      categoryRoutes,
      tagRoutes,
      pageRoutes,
      customRoutes,
    } = await getAllSitemapCollections(settings);

    let entries = deduplicateSitemapEntries([
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
      ...customRoutes,
    ]);

    if (type === "articles") entries = postRoutes;
    else if (type === "categories") entries = categoryRoutes;
    else if (type === "tags") entries = tagRoutes;
    else if (type === "pages") entries = pageRoutes;
    else if (type === "custom") entries = customRoutes;

    const xml = buildUrlsetXml(entries);
    return { success: true, xml, count: entries.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate preview";
    return { success: false, error: msg };
  }
}

/**
 * Generate preview robots.txt content for admin inspection.
 */
export async function previewRobotsTxtAction() {
  try {
    await requireAdminSession();
    await connectDB();
    const settings = await getOrInitSeoSettings();
    const text = buildRobotsTxt(settings);
    return { success: true, text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to preview robots.txt";
    return { success: false, error: msg };
  }
}

/**
 * Update indexing controls (Index, Follow / Noindex, Follow / Index, Nofollow / Noindex, Nofollow)
 * for an individual article, page, category, or tag.
 */
export async function updateItemIndexingAction({
  id,
  type,
  index,
  follow,
}: {
  id: string;
  type: "post" | "category" | "page" | "tag";
  index: boolean;
  follow: boolean;
}) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any = null;
    let path = "/";

    if (type === "post") {
      doc = await Post.findById(id);
      if (doc) path = `/blog/${doc.slug}`;
    } else if (type === "category") {
      doc = await Category.findById(id);
      if (doc) path = `/category/${doc.slug}`;
    } else if (type === "page") {
      doc = await Page.findById(id);
      if (doc) path = doc.slug === "home" ? "/" : `/${doc.slug}`;
    } else if (type === "tag") {
      doc = await Tag.findById(id);
      if (doc) path = `/tag/${doc.slug}`;
    }

    if (!doc) {
      return { success: false, error: `${type} record not found for ID: ${id}` };
    }

    doc.seo = doc.seo || {};
    doc.seo.robots = doc.seo.robots || {};
    doc.seo.robots.index = Boolean(index);
    doc.seo.robots.follow = Boolean(follow);

    // If noindex is set, automatically exclude from sitemap inclusion
    doc.seo.sitemap = doc.seo.sitemap || {};
    doc.seo.sitemap.include = Boolean(index);

    await doc.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "update",
      resource: `${type.toUpperCase()}_INDEXING`,
      resourceId: doc._id,
      details: { index, follow, path },
    });

    await triggerSeoRevalidation({ path, forceIndexNow: index });
    revalidatePath("/admin/seo");

    return {
      success: true,
      index,
      follow,
      path,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update indexing setting";
    console.error("[updateItemIndexingAction Error]", msg);
    return { success: false, error: msg };
  }
}
