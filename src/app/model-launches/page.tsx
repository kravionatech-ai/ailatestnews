import { Metadata } from "next";
import { Cpu, Rocket, Calendar } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page, Post, Category } from "@/lib/db/models";
import { PostCard } from "@/components/blog/post-card";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "model-launches" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/model-launches",
    title: page?.seo?.metaTitle || page?.title || "Model Launches Timeline 2026 | Frontier & Open Weights",
    excerpt:
      page?.seo?.metaDescription ||
      page?.excerpt ||
      "Real-time timeline and benchmark comparisons for recent AI model releases from OpenAI, Anthropic, DeepSeek, and Indian labs.",
  });
}

export default async function ModelLaunchesTimelinePage() {
  await connectDB();
  const [pageRaw, settings, categoryDoc] = await Promise.all([
    Page.findOne({ slug: "model-launches" }).lean(),
    getGlobalSettings(),
    Category.findOne({ slug: "model-launches" }).lean(),
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-slate-900 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Rocket className="h-3.5 w-3.5 text-slate-900" />
            <span>Weights Releases // Architecture Timeline</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {page?.title || "Model Launches Timeline 2026"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {page?.excerpt ||
              "Architecture breakdowns, MMLU benchmarks, quantization footprints, and weights availability for new foundation models."}
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
            No published model launch analyses yet. Check back shortly.
          </div>
        )}
      </div>
    </PublicShell>
  );
}
