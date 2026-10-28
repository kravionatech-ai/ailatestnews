import { connectDB } from "@/lib/db/connection";
import { Post, Category, Page, Tag } from "@/lib/db/models";
import { ensureCorePagesExist } from "@/actions/pages";
import { SeoHub, type SeoInventoryItem } from "@/components/admin/seo/seo-hub";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  await connectDB();
  await ensureCorePagesExist();

  // Fetch all posts, categories, standalone pages, and tags
  const [posts, categories, pages, tags] = await Promise.all([
    Post.find()
      .select("_id title slug excerpt coverImage contentHtml seo status featured publishedAt")
      .sort({ createdAt: -1 })
      .lean(),
    Category.find().select("_id name slug description image seo").sort({ order: 1 }).lean(),
    Page.find().select("_id title slug excerpt contentHtml seo status order").sort({ order: 1 }).lean(),
    Tag.find().select("_id name slug description seo").sort({ name: 1 }).lean(),
  ]);

  const inventoryItems: SeoInventoryItem[] = [
    // 1. Standalone Pages (Home, About, Contact, AI Tools, etc.)
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

    // 2. Topical Categories / Pillars
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

    // 3. Articles & News Dispatches
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

    // 4. Topic Tags
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

  return <SeoHub items={inventoryItems} />;
}
