import { Metadata } from "next";
import { Flag, Cpu, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page, Post, Category } from "@/lib/db/models";
import { PostCard } from "@/components/blog/post-card";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "india-ai" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/india-ai",
    title: page?.seo?.metaTitle || page?.title || "India AI Hub | Sovereign Compute, Sarvam, Krutrim & Policy",
    excerpt:
      page?.seo?.metaDescription ||
      page?.excerpt ||
      "In-depth reporting on IndiaAI Mission, GPU procurement clusters, Sarvam, Krutrim, and indigenous Indic AI technologies.",
  });
}

export default async function IndiaAiHubPage() {
  await connectDB();
  const [pageRaw, settings, categoryDoc] = await Promise.all([
    Page.findOne({ slug: "india-ai" }).lean(),
    getGlobalSettings(),
    Category.findOne({ slug: "india-ai" }).lean(),
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
            <Flag className="h-3.5 w-3.5 text-rose-600" />
            <span>Sovereign Compute // India AI Mission</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {page?.title || "India AI Ecosystem Hub"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {page?.excerpt ||
              "Dedicated technical coverage of India's ₹10,372 crore IndiaAI Mission, domestic foundation models (Sarvam, Krutrim, BharatGen), GPU datacenter clusters, and Indic NLP."}
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
            No published dispatches in this topical pillar yet. Check back shortly.
          </div>
        )}
      </div>
    </PublicShell>
  );
}
