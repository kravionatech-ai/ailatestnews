"use server";

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
} from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  getGoogleNewsArticles,
  buildUrlsetXml,
  buildSitemapIndexXml,
  buildGoogleNewsXml,
  buildRobotsTxt,
} from "@/lib/seo/seo-settings-service";
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
  if (!dbUser || !dbUser.isActive || (dbUser as any).role !== "admin") {
    throw new Error("Forbidden. Administrator privileges required.");
  }

  return session.user;
}

/**
 * Fetch current SEO Settings along with live health statistics.
 */
export async function getSeoSettingsAction() {
  try {
    await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();

    // Query content counts for the SEO dashboard
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      noindexPosts,
      totalCategories,
      totalPages,
      noindexPages,
      newsArticles,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: "published" }),
      Post.countDocuments({ status: "draft" }),
      Post.countDocuments({ "seo.robots.index": false }),
      Category.countDocuments({ isActive: true }),
      Page.countDocuments({ status: "published" }),
      Page.countDocuments({ "seo.robots.index": false }),
      getGoogleNewsArticles(settings),
    ]);

    const { staticRoutes, postRoutes, categoryRoutes, tagRoutes, pageRoutes } =
      await getAllSitemapCollections(settings);

    const totalUrlsInSitemap =
      staticRoutes.length +
      postRoutes.length +
      categoryRoutes.length +
      tagRoutes.length +
      pageRoutes.length;

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings)),
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts,
        noindexPosts,
        totalCategories,
        totalPages,
        noindexPages,
        totalIndexableUrls: postRoutes.length + categoryRoutes.length + pageRoutes.length + staticRoutes.length,
        totalUrlsInSitemap,
        newsArticlesCount: newsArticles.length,
        sitemapLastGenerated: settings.sitemap.lastGeneratedAt,
        robotsLastPublished: settings.robots.lastPublishedAt,
        lastError: settings.sitemap.lastError || "",
      },
    };
  } catch (err: any) {
    console.error("[getSeoSettingsAction Error]", err);
    return { success: false, error: err.message || "Failed to load SEO settings" };
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
  enableSplitSitemaps: boolean;
  maxUrlsPerSitemap: number;
}) {
  try {
    const adminUser = await requireAdminSession();
    await connectDB();

    // Sanitize siteUrl
    let cleanSiteUrl = (formData.siteUrl || "https://ainews.kraviona.com").trim().replace(/\/$/, "");
    if (!cleanSiteUrl.startsWith("http://") && !cleanSiteUrl.startsWith("https://")) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    // Sanitize excluded URLs
    const cleanExcluded = (formData.excludedUrls || [])
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && !u.startsWith("#"));

    const settings = await getOrInitSeoSettings();

    settings.sitemap = {
      enabled: Boolean(formData.enabled),
      siteUrl: cleanSiteUrl,
      includeArticles: Boolean(formData.includeArticles),
      includeCategories: Boolean(formData.includeCategories),
      includeTags: Boolean(formData.includeTags),
      includePages: Boolean(formData.includePages),
      includeNewsSitemap: Boolean(formData.includeNewsSitemap),
      newsPublicationName: (formData.newsPublicationName || "AI Latest News").trim().slice(0, 100),
      newsPublicationLanguage: (formData.newsPublicationLanguage || "en").trim().slice(0, 10),
      newsTimeWindowHours: Math.max(1, Math.min(168, Number(formData.newsTimeWindowHours) || 48)),
      excludedUrls: cleanExcluded,
      enableSplitSitemaps: Boolean(formData.enableSplitSitemaps),
      maxUrlsPerSitemap: Math.max(100, Math.min(50000, Number(formData.maxUrlsPerSitemap) || 50000)),
      lastGeneratedAt: new Date(),
      lastError: "",
      totalUrlsCount: settings.sitemap.totalUrlsCount || 0,
    };

    settings.updatedBy = adminUser.id as any;
    await settings.save();

    await AuditLog.create({
      user: adminUser.id,
      action: "update",
      resource: "SITEMAP_CONFIG",
      resourceId: settings._id,
      details: { siteUrl: cleanSiteUrl, enabled: formData.enabled },
    });

    // Revalidate all sitemap routes and caches
    await triggerSeoRevalidation({ path: "/sitemap.xml", forceIndexNow: true });
    revalidatePath("/admin/seo");
    revalidatePath("/sitemap.xml");
    revalidatePath("/news-sitemap.xml");
    revalidatePath("/sitemap-static.xml");
    revalidatePath("/sitemap-articles.xml");
    revalidatePath("/sitemap-categories.xml");
    revalidatePath("/sitemap-tags.xml");
    revalidatePath("/sitemap-pages.xml");

    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (err: any) {
    console.error("[updateSitemapSettingsAction Error]", err);
    return { success: false, error: err.message || "Failed to update sitemap configuration" };
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
        return { success: false, error: "Security Alert: Invalid characters or script tags in robots.txt." };
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

    // Clean sitemaps list
    const sanitizedSitemaps = (data.sitemaps || [])
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http://") || s.startsWith("https://"));

    settings.robots = {
      enabled: Boolean(data.enabled),
      customRawEnabled: Boolean(data.customRawEnabled),
      rawContent: (data.rawContent || "").slice(0, 10000),
      rules: sanitizedRules.length > 0 ? sanitizedRules : [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/admin/", "/api/admin/", "/login/", "/dashboard/", "/private/"],
        },
      ],
      sitemaps: sanitizedSitemaps.length > 0 ? sanitizedSitemaps : [
        `${settings.sitemap.siteUrl || "https://ainews.kraviona.com"}/sitemap.xml`,
      ],
      includeNewsSitemapInRobots: Boolean(data.includeNewsSitemapInRobots),
      lastPublishedAt: new Date(),
    };

    settings.updatedBy = adminUser.id as any;
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

    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (err: any) {
    console.error("[updateRobotsSettingsAction Error]", err);
    return { success: false, error: err.message || "Failed to update robots.txt configuration" };
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
    const { siteUrl, staticRoutes, postRoutes, categoryRoutes, tagRoutes, pageRoutes } =
      await getAllSitemapCollections(settings);

    const allEntries = [
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
    ];

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
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/seo");

    return {
      success: true,
      totalCount: allEntries.length,
      lastGeneratedAt: settings.sitemap.lastGeneratedAt,
      sampleUrls: allEntries.slice(0, 10).map((e) => e.url),
    };
  } catch (err: any) {
    console.error("[triggerManualSitemapRegenerationAction Error]", err);
    return { success: false, error: err.message || "Failed to regenerate sitemap" };
  }
}

/**
 * Generate preview XML string for admin inspection.
 */
export async function previewSitemapXmlAction(type: "all" | "articles" | "categories" | "tags" | "pages" | "news") {
  try {
    await requireAdminSession();
    await connectDB();

    const settings = await getOrInitSeoSettings();

    if (type === "news") {
      const items = await getGoogleNewsArticles(settings);
      const xml = buildGoogleNewsXml(items);
      return { success: true, xml, count: items.length };
    }

    const { staticRoutes, postRoutes, categoryRoutes, tagRoutes, pageRoutes } =
      await getAllSitemapCollections(settings);

    let entries = [
      ...staticRoutes,
      ...postRoutes,
      ...categoryRoutes,
      ...tagRoutes,
      ...pageRoutes,
    ];

    if (type === "articles") entries = postRoutes;
    else if (type === "categories") entries = categoryRoutes;
    else if (type === "tags") entries = tagRoutes;
    else if (type === "pages") entries = pageRoutes;

    const xml = buildUrlsetXml(entries);
    return { success: true, xml, count: entries.length };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate preview" };
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
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to preview robots.txt" };
  }
}

/**
 * Update indexing controls (Index, Follow / Noindex, Follow / Index, Nofollow / Noindex, Nofollow)
 * for an individual article, page, or category.
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
    if (!index) {
      doc.seo.sitemap = doc.seo.sitemap || {};
      doc.seo.sitemap.include = false;
    } else {
      doc.seo.sitemap = doc.seo.sitemap || {};
      doc.seo.sitemap.include = true;
    }

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
    revalidatePath("/sitemap.xml");
    revalidatePath(path);

    return {
      success: true,
      index,
      follow,
      path,
    };
  } catch (err: any) {
    console.error("[updateItemIndexingAction Error]", err);
    return { success: false, error: err.message || "Failed to update indexing setting" };
  }
}
