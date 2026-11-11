import { connectDB } from "@/lib/db/connection";
import { Post, Category, Page, Tag } from "@/lib/db/models";
import { ensureCorePagesExist } from "@/actions/pages";
import { type SeoInventoryItem } from "@/components/admin/seo/seo-hub";
import { SeoManagementView } from "@/components/admin/seo/seo-management-view";
import {
  getOrInitSeoSettings,
  getAllSitemapCollections,
  getGoogleNewsArticles,
  getRssFeedItems,
  deduplicateSitemapEntries,
} from "@/lib/seo/seo-settings-service";

export const dynamic = "force-dynamic";

interface AdminSeoPageProps {
  searchParams?: Promise<{ tab?: string; view?: string }>;
}

export default async function AdminSeoPage({ searchParams }: AdminSeoPageProps) {
  await connectDB();
  await ensureCorePagesExist();

  const resolvedParams = searchParams ? await searchParams : {};
  const requestedView =
    resolvedParams.tab === "bulk" || resolvedParams.view === "bulk"
      ? "bulk"
      : "control-center";

  const [settings, posts, categories, pages, tags] = await Promise.all([
    getOrInitSeoSettings(),
    Post.find()
      .select("_id title slug excerpt coverImage contentHtml seo status featured publishedAt updatedAt createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    Category.find().select("_id name slug description image seo isActive updatedAt").sort({ order: 1 }).lean(),
    Page.find().select("_id title slug excerpt contentHtml seo status order updatedAt").sort({ order: 1 }).lean(),
    Tag.find().select("_id name slug description seo updatedAt").sort({ name: 1 }).lean(),
  ]);

  const [sitemapCollections, newsArticles, feedItems] = await Promise.all([
    getAllSitemapCollections(settings),
    getGoogleNewsArticles(settings),
    getRssFeedItems(settings, 30),
  ]);

  const totalUrlsInSitemap = deduplicateSitemapEntries([
    ...sitemapCollections.staticRoutes,
    ...sitemapCollections.postRoutes,
    ...sitemapCollections.categoryRoutes,
    ...sitemapCollections.tagRoutes,
    ...sitemapCollections.pageRoutes,
    ...sitemapCollections.customRoutes,
  ]).length;

  const publishedPostsCount = posts.filter((p: any) => p.status === "published").length;
  const draftPostsCount = posts.filter((p: any) => p.status === "draft").length;
  const noindexPostsCount = posts.filter((p: any) => p.seo?.robots?.index === false).length;
  const noindexPagesCount = pages.filter((p: any) => p.seo?.robots?.index === false).length;

  const stats = {
    totalPosts: posts.length,
    publishedPosts: publishedPostsCount,
    draftPosts: draftPostsCount,
    noindexPosts: noindexPostsCount,
    totalCategories: categories.length,
    totalPages: pages.length,
    noindexPages: noindexPagesCount,
    totalIndexableUrls:
      sitemapCollections.staticRoutes.length +
      sitemapCollections.postRoutes.length +
      sitemapCollections.categoryRoutes.length +
      sitemapCollections.pageRoutes.length +
      sitemapCollections.customRoutes.length,
    totalUrlsInSitemap,
    customUrlsCount: sitemapCollections.customRoutes.length,
    feedItemsCount: feedItems.length,
    newsArticlesCount: newsArticles.length,
    sitemapLastGenerated: settings.sitemap.lastGeneratedAt,
    robotsLastPublished: settings.robots.lastPublishedAt,
    lastError: settings.sitemap.lastError || "",
  };

  // Lightweight indexing list for the Indexing Controls tab
  const indexingItems = [
    ...pages.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      route: p.slug === "home" ? "/" : `/${p.slug}`,
      type: "page" as const,
      status: p.status,
      index: p.seo?.robots?.index ?? true,
      follow: p.seo?.robots?.follow ?? true,
    })),
    ...categories.map((c: any) => ({
      id: c._id.toString(),
      title: c.name,
      slug: c.slug,
      route: `/category/${c.slug}`,
      type: "category" as const,
      index: c.seo?.robots?.index ?? true,
      follow: c.seo?.robots?.follow ?? true,
    })),
    ...posts.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      route: `/blog/${p.slug}`,
      type: "post" as const,
      status: p.status,
      index: p.seo?.robots?.index ?? true,
      follow: p.seo?.robots?.follow ?? true,
    })),
  ];

  // Full inventory for the Bulk Meta Editor tab
  const inventoryItems: SeoInventoryItem[] = [
    ...pages.map((pg: any) => ({
      id: pg._id.toString(),
      title: pg.title,
      slug: pg.slug,
      route: pg.slug === "home" ? "/" : `/${pg.slug}`,
      type: (pg.slug === "home" ? "home" : "page") as SeoInventoryItem["type"],
      status: pg.status,
      seo: pg.seo ? JSON.parse(JSON.stringify(pg.seo)) : {},
      excerpt: pg.excerpt || "",
      contentHtml: pg.contentHtml || "",
    })),
    ...categories.map((c: any) => ({
      id: c._id.toString(),
      title: c.name,
      slug: c.slug,
      route: `/category/${c.slug}`,
      type: "category" as const,
      seo: c.seo ? JSON.parse(JSON.stringify(c.seo)) : {},
      excerpt: c.description || "",
      coverImage: c.image || "",
    })),
    ...posts.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      route: `/blog/${p.slug}`,
      type: "post" as const,
      status: p.status,
      seo: p.seo ? JSON.parse(JSON.stringify(p.seo)) : {},
      excerpt: p.excerpt || "",
      coverImage: p.coverImage || "",
      contentHtml: p.contentHtml || "",
    })),
    ...tags.map((t: any) => ({
      id: t._id.toString(),
      title: t.name,
      slug: t.slug,
      route: `/tag/${t.slug}`,
      type: "tag" as const,
      seo: t.seo ? JSON.parse(JSON.stringify(t.seo)) : {},
      excerpt: t.description || "",
    })),
  ];

  return (
    <SeoManagementView
      initialSettings={JSON.parse(JSON.stringify(settings))}
      stats={stats}
      indexingItems={indexingItems}
      inventoryItems={inventoryItems}
      defaultView={requestedView}
    />
  );
}
