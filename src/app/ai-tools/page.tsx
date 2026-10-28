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
  await connectDB();
  const page = await Page.findOne({ slug: "ai-tools" }).lean();
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
  await connectDB();
  const [pageRaw, settings, categoryDoc] = await Promise.all([
    Page.findOne({ slug: "ai-tools" }).lean(),
    getGlobalSettings(),
    Category.findOne({ slug: "ai-tools" }).lean(),
  ]);

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  // Query strictly published posts
  const filter: any = { status: "published" };
  if (categoryDoc) {
    filter.category = categoryDoc._id;
  }

  const postsRaw = await Post.find(filter)
    .populate("category", "name slug")
    .populate("author", "name image slug")
    .sort({ publishedAt: -1 })
    .limit(18)
    .lean();

  const posts = JSON.parse(JSON.stringify(postsRaw));

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60 mb-3">
            <Wrench className="h-3.5 w-3.5 text-indigo-600" />
            Software &amp; Productivity Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
            {page?.title || "AI Tools Directory 2026"}
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)] leading-relaxed">
            {page?.excerpt ||
              "Hands-on evaluations, latency benchmarks, and pricing analyses for developer tools, IDE agents, and enterprise workflows."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm max-w-4xl mx-auto mb-10"
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
          <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--foreground-muted)]">
            No published AI tool reviews in this directory yet. Check back shortly.
          </div>
        )}
      </div>
    </PublicShell>
  );
}
