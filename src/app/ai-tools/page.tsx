import { Metadata } from "next";
import { Wrench, Sparkles, Filter } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page, Post, Category } from "@/lib/db/models";
import { PostCard } from "@/components/blog/post-card";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "ai-tools" }).lean();
  } catch (err) {
    // Graceful fallback on connection timeout
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/ai-tools",
    title: page?.seo?.metaTitle || page?.title || "AI Tools Directory 2026 | Verified Software Evaluated for India",
    excerpt:
      page?.seo?.metaDescription ||
      page?.excerpt ||
      "Explore verified AI tools for coding, productivity, image generation, and workflow automation evaluated on Indian workflows.",
  });
}

export default async function AiToolsDirectoryPage() {
  let pageRaw: any = null;
  let settings: any = {};
  let posts: any[] = [];

  try {
    await connectDB();
    const [p, s, categoryDoc] = await Promise.all([
      Page.findOne({ slug: "ai-tools" }).lean(),
      getGlobalSettings(),
      Category.findOne({ slug: "ai-tools" }).lean(),
    ]);
    pageRaw = p;
    settings = s;

    // Query strictly published posts
    const filter: any = { status: "published" };
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    }

    const postsRaw = await Post.find(filter)
      .select("title slug excerpt coverImage coverImageAlt readingTime views featured publishedAt createdAt category author")
      .populate("category", "name slug")
      .populate("author", "name image slug")
      .sort({ publishedAt: -1 })
      .limit(18)
      .lean();

    posts = JSON.parse(JSON.stringify(postsRaw));
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8 pb-5 border-b-2 border-[var(--color-heading)] max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            <Wrench className="h-3.5 w-3.5" />
            <span>Developer Gear // Evaluated Software</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[var(--color-heading)] tracking-tight">
            {page?.title || "AI Tools Directory 2026"}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed">
            {page?.excerpt ||
              "Hands-on evaluations, latency benchmarks, and pricing analyses for developer tools, IDE agents, and enterprise workflows."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm max-w-4xl mx-auto mb-10 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--color-card-background)] p-12 text-center text-xs text-[var(--color-muted-text)]">
            No published AI tool reviews in this directory yet. Check back shortly.
          </div>
        )}
      </div>
    </PublicShell>
  );
}
