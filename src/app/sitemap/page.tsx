import { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Compass,
  FileText,
  FolderTree,
  Globe,
  Hash,
  Newspaper,
  Rss,
  Sparkles,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page, Post } from "@/lib/db/models";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { getAllCategories, getAllTags } from "@/lib/db/queries/taxonomies";
import { EXPLORE_CATEGORIES_LIST } from "@/lib/categories/topics";
import { getOrInitSeoSettings, isUrlExcluded } from "@/lib/seo/seo-settings-service";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildEntityMetadata({
    entityType: "page",
    path: "/sitemap",
    title: "HTML Sitemap — Publication Directory",
    excerpt:
      "Browse the structured Kraviona AI News directory of core pages, editorial desks, categories, and verified published articles.",
  });
}

interface SitemapCategoryRecord {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  seo?: {
    robots?: { index?: boolean };
    sitemap?: { include?: boolean };
  };
}

interface SitemapPostRecord {
  _id: string;
  title: string;
  slug: string;
  featured?: boolean;
  publishedAt?: string;
  createdAt?: string;
  readingTime?: number;
  category?: { _id?: string; name?: string; slug?: string } | null;
  seo?: {
    robots?: { index?: boolean };
    sitemap?: { include?: boolean };
  };
}

interface SitemapTagRecord {
  _id: string;
  name: string;
  slug: string;
  postCount?: number;
  seo?: {
    robots?: { index?: boolean };
    sitemap?: { include?: boolean };
  };
}

interface SitemapPageRecord {
  _id: string;
  title: string;
  slug: string;
  seo?: {
    robots?: { index?: boolean };
    sitemap?: { include?: boolean };
  };
}

const CORE_STATIC_LINKS: Array<{
  title: string;
  href: string;
  group: "Editorial Hubs" | "Publication & Policies";
  description: string;
}> = [
  {
    title: "Front Page",
    href: "/",
    group: "Editorial Hubs",
    description: "Top AI dispatches, featured analysis, and trending news",
  },
  {
    title: "All Articles & Wire",
    href: "/blog",
    group: "Editorial Hubs",
    description: "Chronological feed of verified technology dispatches",
  },
  {
    title: "Model Launches Hub",
    href: "/model-launches",
    group: "Editorial Hubs",
    description: "Foundation model weights, benchmarks, and releases",
  },
  {
    title: "AI Tools Directory",
    href: "/ai-tools",
    group: "Editorial Hubs",
    description: "Evaluated developer tools, copilots, and runtimes",
  },
  {
    title: "India AI Hub",
    href: "/india-ai",
    group: "Editorial Hubs",
    description: "Sovereign compute, Indic LLMs, and regional AI policy",
  },
  {
    title: "Publication Archive",
    href: "/archive",
    group: "Editorial Hubs",
    description: "Monthly chronological index of past articles",
  },
  {
    title: "ZeroAI Detector",
    href: "/zeroai",
    group: "Editorial Hubs",
    description: "Clean-room stylometric and statistical AI text analyzer",
  },
  {
    title: "About Kraviona AI News",
    href: "/about",
    group: "Publication & Policies",
    description: "Editorial charter, mission, and newsroom scope",
  },
  {
    title: "Editorial Standards",
    href: "/editorial-policy",
    group: "Publication & Policies",
    description: "Verification rules, disclosures, and correction policy",
  },
  {
    title: "Newsletter Briefing",
    href: "/newsletter",
    group: "Publication & Policies",
    description: "Subscribe to curated AI intelligence dispatches",
  },
  {
    title: "Contact Editorial Desk",
    href: "/contact",
    group: "Publication & Policies",
    description: "Submit research tips, corrections, or inquiries",
  },
  {
    title: "Privacy Policy",
    href: "/privacy",
    group: "Publication & Policies",
    description: "Reader privacy and data handling commitments",
  },
  {
    title: "Terms of Service",
    href: "/terms",
    group: "Publication & Policies",
    description: "Publication terms and open-source licensing notes",
  },
];

const CORE_SLUG_SET = new Set([
  "",
  "home",
  "blog",
  "model-launches",
  "ai-tools",
  "india-ai",
  "archive",
  "zeroai",
  "about",
  "editorial-policy",
  "newsletter",
  "contact",
  "privacy",
  "terms",
  "search",
  "sitemap",
]);

export default async function HtmlSitemapPage() {
  const siteUrl = getSiteUrl();

  let settings: Awaited<ReturnType<typeof getGlobalSettings>> = {};
  let excludedUrls: string[] = [];
  let categories: SitemapCategoryRecord[] = [];
  let tags: SitemapTagRecord[] = [];
  let posts: SitemapPostRecord[] = [];
  let customPages: SitemapPageRecord[] = [];

  try {
    await connectDB();
    const [seoSettings, globalSettings, rawCategories, rawTags, rawPosts, rawPages] =
      await Promise.all([
        getOrInitSeoSettings().catch(() => null),
        getGlobalSettings(),
        getAllCategories(),
        getAllTags(),
        Post.find({ status: "published" })
          .sort({ publishedAt: -1, createdAt: -1 })
          .select("title slug featured publishedAt createdAt readingTime category seo")
          .populate("category", "name slug")
          .lean(),
        Page.find({ status: "published" })
          .sort({ order: 1, title: 1 })
          .select("title slug seo")
          .lean(),
      ]);

    settings = globalSettings;
    excludedUrls = seoSettings?.sitemap?.excludedUrls || [];

    const isEligible = (
      path: string,
      seo?: { robots?: { index?: boolean }; sitemap?: { include?: boolean } }
    ) => {
      if (seo?.robots?.index === false) return false;
      if (seo?.sitemap?.include === false) return false;
      const fullUrl = path === "/" ? siteUrl : `${siteUrl}${path}`;
      return !isUrlExcluded(fullUrl, excludedUrls);
    };

    categories = (JSON.parse(JSON.stringify(rawCategories)) as SitemapCategoryRecord[]).filter(
      (cat) => cat.slug && isEligible(`/category/${cat.slug}`, cat.seo)
    );

    tags = (JSON.parse(JSON.stringify(rawTags)) as SitemapTagRecord[]).filter(
      (tag) => tag.slug && isEligible(`/tag/${tag.slug}`, tag.seo)
    );

    posts = (JSON.parse(JSON.stringify(rawPosts)) as SitemapPostRecord[]).filter(
      (post) => post.slug && post.title && isEligible(`/blog/${post.slug}`, post.seo)
    );

    const parsedPages = JSON.parse(JSON.stringify(rawPages)) as SitemapPageRecord[];
    customPages = parsedPages.filter(
      (pg) =>
        pg.slug &&
        !CORE_SLUG_SET.has(pg.slug) &&
        isEligible(`/${pg.slug}`, pg.seo)
    );
  } catch (err) {
    console.warn("[HtmlSitemapPage] Fallback empty sitemap due to DB read failure:", err);
    settings = await getGlobalSettings();
  }

  const staticPages = CORE_STATIC_LINKS.filter((item) => {
    const fullUrl = item.href === "/" ? siteUrl : `${siteUrl}${item.href}`;
    return !isUrlExcluded(fullUrl, excludedUrls);
  });

  // Merge DB categories and curated Explore Intelligence Desks without duplicates
  const dbCategorySlugs = new Set(categories.map((c) => c.slug));
  const additionalDesks = EXPLORE_CATEGORIES_LIST.filter(
    (desk) =>
      !dbCategorySlugs.has(desk.slug) &&
      !isUrlExcluded(`${siteUrl}/category/${desk.slug}`, excludedUrls)
  );

  // Featured / important spotlight articles
  const importantPosts = posts.filter((p) => p.featured).slice(0, 6);
  const topHighlightPosts =
    importantPosts.length > 0 ? importantPosts : posts.slice(0, 6);

  // Group all published articles cleanly by category name
  const groupedByCategory = new Map<
    string,
    { slug?: string; posts: SitemapPostRecord[] }
  >();

  for (const post of posts) {
    const catName = post.category?.name || "General Intelligence";
    const catSlug = post.category?.slug;
    const bucket = groupedByCategory.get(catName);
    if (bucket) {
      bucket.posts.push(post);
    } else {
      groupedByCategory.set(catName, { slug: catSlug, posts: [post] });
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/sitemap`,
        name: "HTML Sitemap — Kraviona AI News",
        description:
          "Structured editorial directory listing Kraviona AI News categories, static pages, and published dispatches.",
        url: `${siteUrl}/sitemap`,
        isPartOf: { "@id": `${siteUrl}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "HTML Sitemap",
            item: `${siteUrl}/sitemap`,
          },
        ],
      },
    ],
  };

  const headlineItems = posts.slice(0, 5).map((p) => ({
    _id: p._id,
    title: p.title,
    slug: p.slug,
    ...(p.category?.name && p.category?.slug
      ? { category: { name: p.category.name, slug: p.category.slug } }
      : {}),
  }));

  return (
    <PublicShell
      navLinks={settings?.navigation}
      footerConfig={settings?.footer}
      headlines={headlineItems}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--color-card-background)] py-3">
        <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted-text)]"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-[var(--color-heading)]">HTML Sitemap</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Editorial Sitemap Header */}
        <header className="rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-[var(--color-card-background)] p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                <Compass className="h-3.5 w-3.5" />
                <span>Publication Architecture // HTML Directory</span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-tight">
                Kraviona AI News Sitemap
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed">
                Complete human-readable navigation index across Kraviona AI News static pages, specialized AI intelligence categories, and verified published articles.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0 font-mono text-xs">
              <span className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 font-bold text-[var(--color-heading)]">
                {posts.length} Articles
              </span>
              <span className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 font-bold text-[var(--color-heading)]">
                {categories.length + additionalDesks.length} Categories &amp; Desks
              </span>
              <span className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 font-bold text-[var(--color-heading)]">
                {staticPages.length + customPages.length} Pages
              </span>
            </div>
          </div>
        </header>

        {/* 1. Core Sections & Static Pages + Categories Hierarchy */}
        <section
          aria-labelledby="sitemap-hierarchy-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left: Static Pages & Core Sections */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-[var(--color-heading)] pb-2.5">
              <FileText className="h-4 w-4 text-[var(--accent)]" />
              <h2
                id="sitemap-hierarchy-heading"
                className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]"
              >
                Core Sections &amp; Static Pages
              </h2>
            </div>

            <div className="space-y-6">
              {(["Editorial Hubs", "Publication & Policies"] as const).map((groupName) => {
                const items = staticPages.filter((s) => s.group === groupName);
                if (items.length === 0) return null;
                return (
                  <div
                    key={groupName}
                    className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-3"
                  >
                    <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {groupName}
                    </h3>
                    <ul className="divide-y divide-[var(--border)]">
                      {items.map((item) => (
                        <li key={item.href} className="py-2.5 first:pt-0 last:pb-0">
                          <Link
                            href={item.href}
                            className="group flex flex-col gap-0.5"
                          >
                            <span className="text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors">
                              {item.title}
                            </span>
                            <span className="text-xs text-[var(--color-muted-text)]">
                              {item.description}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {customPages.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-3">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    Additional Pages
                  </h3>
                  <ul className="space-y-2">
                    {customPages.map((pg) => (
                      <li key={pg._id}>
                        <Link
                          href={`/${pg.slug}`}
                          className="text-sm font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors"
                        >
                          {pg.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Categories, Desks & Important Spotlight Articles */}
          <div className="lg:col-span-7 space-y-8">
            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[var(--color-heading)] pb-2.5">
                <FolderTree className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]">
                  Primary Categories &amp; Intelligence Desks
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/category/${cat.slug}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 hover:border-[var(--accent)] transition-colors shadow-xs flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors">
                          {cat.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded">
                          {cat.postCount || 0}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-[var(--color-muted-text)] line-clamp-2 mt-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}

                {additionalDesks.map((desk) => (
                  <Link
                    key={desk.slug}
                    href={desk.href}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 hover:border-[var(--accent)] transition-colors shadow-xs flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors">
                        {desk.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase text-[var(--color-muted-text)]">
                        Desk
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted-text)] line-clamp-2">
                      {desk.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Important & Featured Articles Spotlight */}
            {topHighlightPosts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-[var(--color-heading)] pb-2.5">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]">
                    Important &amp; Featured Dispatches
                  </h2>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] divide-y divide-[var(--border)] shadow-xs">
                  {topHighlightPosts.map((post) => (
                    <div
                      key={post._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--color-secondary-surface)]/40 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        {post.category?.name && (
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                            {post.category.name}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-[var(--color-heading)] leading-snug">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="hover:text-[var(--accent)] transition-colors"
                          >
                            {post.title}
                          </Link>
                        </h3>
                      </div>
                      {(post.publishedAt || post.createdAt) && (
                        <span className="font-mono text-[11px] text-[var(--color-muted-text)] shrink-0">
                          {formatDate((post.publishedAt || post.createdAt)!)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Complete Published Articles Grouped by Category */}
        <section aria-labelledby="sitemap-articles-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[var(--color-heading)] pb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-[var(--accent)]" />
              <h2
                id="sitemap-articles-heading"
                className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]"
              >
                All Published Articles by Category ({posts.length})
              </h2>
            </div>
            <Link
              href="/archive"
              className="font-mono text-xs font-bold text-[var(--accent)] hover:underline"
            >
              View Chronological Archive →
            </Link>
          </div>

          {groupedByCategory.size > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from(groupedByCategory.entries()).map(([catName, bucket]) => (
                <div
                  key={catName}
                  className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                    {bucket.slug ? (
                      <Link
                        href={`/category/${bucket.slug}`}
                        className="font-display text-base font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors"
                      >
                        {catName}
                      </Link>
                    ) : (
                      <h3 className="font-display text-base font-bold text-[var(--color-heading)]">
                        {catName}
                      </h3>
                    )}
                    <span className="font-mono text-[11px] font-semibold text-[var(--color-muted-text)]">
                      {bucket.posts.length} {bucket.posts.length === 1 ? "article" : "articles"}
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {bucket.posts.map((post) => (
                      <li
                        key={post._id}
                        className="flex items-baseline justify-between gap-3 text-xs"
                      >
                        <Link
                          href={`/blog/${post.slug}`}
                          className="font-semibold text-[var(--color-body-text)] hover:text-[var(--accent)] transition-colors leading-snug"
                        >
                          {post.title}
                        </Link>
                        {(post.publishedAt || post.createdAt) && (
                          <span className="font-mono text-[10px] text-[var(--color-muted-text)] shrink-0">
                            {formatDate((post.publishedAt || post.createdAt)!, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--color-card-background)] p-10 text-center text-sm text-[var(--color-muted-text)]">
              No published indexable articles available right now.
            </div>
          )}
        </section>

        {/* 3. Topic Tags */}
        {tags.length > 0 && (
          <section aria-labelledby="sitemap-tags-heading" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Hash className="h-4 w-4 text-[var(--accent)]" />
              <h2
                id="sitemap-tags-heading"
                className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]"
              >
                Topic Tags ({tags.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/tag/${tag.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <span>#{tag.name}</span>
                  {typeof tag.postCount === "number" && tag.postCount > 0 && (
                    <span className="font-mono text-[10px] text-[var(--color-muted-text)]">
                      ({tag.postCount})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Machine-Readable XML Sitemaps & RSS Syndication */}
        <section
          aria-labelledby="sitemap-feeds-heading"
          className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--accent)]" />
            <h2
              id="sitemap-feeds-heading"
              className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]"
            >
              XML Sitemaps &amp; RSS Syndication
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            <a
              href="/sitemap.xml"
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-4 py-3 font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <span>XML Sitemap Index</span>
              <span className="text-[10px] text-[var(--accent)]">/sitemap.xml</span>
            </a>
            <a
              href="/news-sitemap.xml"
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-4 py-3 font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <span>Google News Sitemap</span>
              <span className="text-[10px] text-[var(--accent)]">/news-sitemap.xml</span>
            </a>
            <a
              href="/image-sitemap.xml"
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-4 py-3 font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <span>Image Sitemap</span>
              <span className="text-[10px] text-[var(--accent)]">/image-sitemap.xml</span>
            </a>
            <a
              href="/feed.xml"
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-4 py-3 font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Rss className="h-3.5 w-3.5 text-[var(--accent)]" />
                RSS 2.0 Feed
              </span>
              <span className="text-[10px] text-[var(--accent)]">/feed.xml</span>
            </a>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
