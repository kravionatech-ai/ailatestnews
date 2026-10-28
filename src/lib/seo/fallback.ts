import type { Metadata } from "next";
import type { EntityType, ISeoMetadata, ISeoTemplateVariables } from "./types";
import { connectDB } from "@/lib/db/connection";
import Setting from "@/lib/db/models/setting.model";

const DEFAULT_SITE_NAME = "AI Latest News";
const DEFAULT_TAGLINE = "AI news, tools and guides, explained for India";
const DEFAULT_SEPARATOR = "|";
const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";

/**
 * Get base site URL from environment or fallback
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://ainews.kraviona.com";
}

/**
 * Replace template variables like {title}, {site}, {category}, {separator}, etc.
 */
export function interpolateVariables(
  template: string,
  variables: ISeoTemplateVariables
): string {
  if (!template) return "";

  const site = variables.site || DEFAULT_SITE_NAME;
  const separator = variables.separator || DEFAULT_SEPARATOR;
  const now = new Date();
  const year = String(variables.year || now.getFullYear());
  const month =
    variables.month ||
    now.toLocaleString("en-US", { month: "long" });

  let result = template
    .replace(/\{title\}/gi, variables.title || "")
    .replace(/\{site\}/gi, site)
    .replace(/\{category\}/gi, variables.category || "")
    .replace(/\{author\}/gi, variables.author || "")
    .replace(/\{year\}/gi, year)
    .replace(/\{month\}/gi, month)
    .replace(/\{excerpt\}/gi, variables.excerpt || "")
    .replace(/\{separator\}/gi, separator);

  // Clean up any double spaces or dangling separators
  result = result
    .replace(/\s+/g, " ")
    .replace(new RegExp(`\\s*\\${separator}\\s*$`), "")
    .trim();

  return result;
}

/**
 * Fetch global settings or return defaults
 */
export async function getGlobalSeoSettings() {
  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings) {
      return JSON.parse(JSON.stringify(settings));
    }
  } catch (err) {
    console.error("Failed to load SEO settings from DB, using defaults:", err);
  }

  const siteUrl = getSiteUrl();

  return {
    siteName: DEFAULT_SITE_NAME,
    tagline: DEFAULT_TAGLINE,
    siteUrl,
    separator: DEFAULT_SEPARATOR,
    defaultOgImage: DEFAULT_OG_IMAGE,
    templates: {
      post: {
        titleTemplate: "{title} {separator} {site}",
        descriptionTemplate: "{excerpt}",
      },
      category: {
        titleTemplate: "{category} News, Tools & Guides {separator} {site}",
        descriptionTemplate:
          "Comprehensive coverage of {category}: breaking news, model benchmarks, and developer guides.",
      },
      tag: {
        titleTemplate: "{title} AI Updates & Articles {separator} {site}",
        descriptionTemplate:
          "Latest news, articles and technical breakdowns tagged with {title} on {site}.",
      },
      page: {
        titleTemplate: "{title} {separator} {site}",
        descriptionTemplate: "{excerpt}",
      },
      author: {
        titleTemplate: "{author}, AI Author {separator} {site}",
        descriptionTemplate:
          "Read technical articles, model evaluations, and research by {author} at {site}.",
      },
    },
    organization: {
      name: DEFAULT_SITE_NAME,
      url: siteUrl,
      description: DEFAULT_TAGLINE,
    },
  };
}

export interface BuildMetadataOptions {
  entityType: EntityType;
  entitySeo?: ISeoMetadata;
  path: string; // e.g. "/blog/my-post"
  title?: string;
  excerpt?: string;
  category?: string;
  author?: string;
  coverImage?: string;
  publishedTime?: string | Date;
  modifiedTime?: string | Date;
}

/**
 * Fallback Chain:
 * Entity Override -> Type Template -> Global Default
 */
export async function buildEntityMetadata(
  opts: BuildMetadataOptions
): Promise<Metadata> {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || getSiteUrl();
  const siteName = settings.siteName || DEFAULT_SITE_NAME;
  const separator = settings.separator || DEFAULT_SEPARATOR;

  const vars: ISeoTemplateVariables = {
    title: opts.title || "",
    excerpt: opts.excerpt || "",
    category: opts.category || "",
    author: opts.author || "",
    site: siteName,
    separator,
    year: new Date().getFullYear(),
    month: new Date().toLocaleString("en-US", { month: "long" }),
  };

  // 1. Title Fallback
  let finalTitle = opts.entitySeo?.metaTitle?.trim();
  if (!finalTitle) {
    const templateConfig = settings.templates?.[opts.entityType];
    const template = templateConfig?.titleTemplate || "{title} {separator} {site}";
    finalTitle = interpolateVariables(template, vars);
  }
  if (!finalTitle) {
    finalTitle = `${siteName} ${separator} ${DEFAULT_TAGLINE}`;
  }

  // 2. Description Fallback
  let finalDescription = opts.entitySeo?.metaDescription?.trim();
  if (!finalDescription) {
    const templateConfig = settings.templates?.[opts.entityType];
    const template = templateConfig?.descriptionTemplate || "{excerpt}";
    finalDescription = interpolateVariables(template, vars);
  }
  if (!finalDescription) {
    finalDescription = settings.tagline || DEFAULT_TAGLINE;
  }

  // 3. Canonical Fallback (Source of truth: canonicalUrl, with graceful fallback to legacy canonical)
  const canonicalPath = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const rawCanonical =
    opts.entitySeo?.canonicalUrl?.trim() ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opts.entitySeo as any)?.canonical?.trim();
  const finalCanonical = rawCanonical || `${siteUrl}${canonicalPath}`;

  // 4. OpenGraph & Images Fallback
  const ogTitle = opts.entitySeo?.ogTitle?.trim() || finalTitle;
  const ogDescription = opts.entitySeo?.ogDescription?.trim() || finalDescription;
  const ogImage =
    opts.entitySeo?.ogImage?.trim() ||
    opts.coverImage?.trim() ||
    settings.defaultOgImage ||
    DEFAULT_OG_IMAGE;

  // 5. Robots Fallback (Index, Follow, etc.)
  const isProd = process.env.NODE_ENV === "production";
  const userRobots = opts.entitySeo?.robots;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyNoindex = (opts.entitySeo as any)?.noindex;
  const shouldIndex =
    userRobots?.index !== undefined
      ? userRobots.index
      : legacyNoindex !== undefined
      ? !legacyNoindex
      : true;
  const shouldFollow =
    userRobots?.follow !== undefined
      ? userRobots.follow
      : legacyNoindex !== undefined
      ? !legacyNoindex
      : true;

  const robots = {
    index: isProd ? shouldIndex : false, // Environment-aware: safe noindex in non-prod
    follow: isProd ? shouldFollow : false,
    nocache: userRobots?.noarchive ?? false,
    googleBot: {
      index: isProd ? shouldIndex : false,
      follow: isProd ? shouldFollow : false,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": userRobots?.maxImagePreview || "large",
      "max-snippet": userRobots?.nosnippet ? 0 : -1,
    },
  };

  // 6. Keywords
  const keywords: string[] = [];
  if (opts.entitySeo?.focusKeyword) keywords.push(opts.entitySeo.focusKeyword);
  if (opts.entitySeo?.secondaryKeywords && opts.entitySeo.secondaryKeywords.length > 0) {
    keywords.push(...opts.entitySeo.secondaryKeywords);
  }

  // 7. Hreflang Alternates
  const alternatesLanguages: Record<string, string> = {};
  if (opts.entitySeo?.hreflang && opts.entitySeo.hreflang.length > 0) {
    for (const alt of opts.entitySeo.hreflang) {
      if (alt.lang && alt.url) {
        alternatesLanguages[alt.lang] = alt.url;
      }
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: finalCanonical,
      languages: Object.keys(alternatesLanguages).length > 0 ? alternatesLanguages : undefined,
    },
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: finalCanonical,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      locale: "en_IN",
      type: opts.entityType === "post" ? "article" : "website",
      ...(opts.publishedTime && {
        publishedTime: new Date(opts.publishedTime).toISOString(),
      }),
      ...(opts.modifiedTime && {
        modifiedTime: new Date(opts.modifiedTime).toISOString(),
      }),
    },
    twitter: {
      card: opts.entitySeo?.twitterCard || "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      creator: "@ailatestnews_in",
    },
  };
}

/**
 * Generate Schema.org JSON-LD structure with custom entity overrides merged
 */
export function buildJsonLd(
  entityType: EntityType,
  entityData: Record<string, unknown>,
  seo?: ISeoMetadata
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  // If the user provided a full custom JSON-LD override, parse and return it
  if (seo?.schemaOverrides && seo.schemaOverrides.trim().startsWith("{")) {
    try {
      return JSON.parse(seo.schemaOverrides);
    } catch {
      // Fallback to auto schema if invalid JSON
    }
  }

  const schemaType = seo?.schemaType || (entityType === "post" ? "NewsArticle" : "WebPage");

  if (entityType === "post") {
    return {
      "@context": "https://schema.org",
      "@type": schemaType,
      headline: seo?.metaTitle || entityData.title,
      description: seo?.metaDescription || entityData.excerpt,
      image: [seo?.ogImage || entityData.coverImage || DEFAULT_OG_IMAGE],
      datePublished: entityData.publishedAt || entityData.createdAt,
      dateModified: entityData.updatedAt || entityData.publishedAt,
      author: {
        "@type": "Person",
        name: (entityData.author as { name?: string })?.name || "AI Latest News Editorial Team",
        url: `${siteUrl}/author/${(entityData.author as { slug?: string })?.slug || "editorial-team"}`,
      },
      publisher: {
        "@type": "Organization",
        name: DEFAULT_SITE_NAME,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteUrl}/blog/${entityData.slug}`,
      },
    };
  }

  if (entityType === "category") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: entityData.name,
      description: seo?.metaDescription || entityData.description,
      url: `${siteUrl}/category/${entityData.slug}`,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: entityData.title || entityData.name || DEFAULT_SITE_NAME,
    description: seo?.metaDescription || entityData.description || DEFAULT_TAGLINE,
    url: siteUrl,
  };
}
