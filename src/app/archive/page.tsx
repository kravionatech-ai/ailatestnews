import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Archive as ArchiveIcon } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Post, Page } from "@/lib/db/models";
import { formatDate } from "@/lib/utils";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "archive" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/archive",
    title: page?.seo?.metaTitle || page?.title || "Publication Archive | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Explore our chronological publication timeline of AI dispatches, foundation model launches, and Indian AI benchmarks.",
  });
}

export default async function ArchivePage() {
  let postsRaw: any[] = [];
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Post.find({ status: "published" })
        .sort({ publishedAt: -1 })
        .select("title slug publishedAt readingTime category")
        .populate("category", "name slug")
        .lean(),
      getGlobalSettings(),
    ]);
    postsRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const posts = JSON.parse(JSON.stringify(postsRaw));

  // Group by year and month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Record<string, Record<string, any[]>> = {};

  posts.forEach((post: any) => {
    const date = post.publishedAt ? new Date(post.publishedAt) : new Date();
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("en-US", { month: "long" });

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(post);
  });

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          <ArchiveIcon className="h-3.5 w-3.5 text-slate-900" />
          <span>Chronological Index // AI Dispatches</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Publication Archive
        </h1>
        <p className="mt-2 text-sm text-slate-600 mb-12">
          A historical index of all published engineering articles, guides, and architectural notes.
        </p>

        <div className="space-y-12">
          {Object.entries(grouped).map(([year, months]) => (
            <div key={year} className="relative pl-6 border-l-2 border-slate-900">
              <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-mono font-bold text-white border-2 border-white">
                {year.slice(-2)}
              </span>

              <h2 className="text-2xl font-black text-slate-900 mb-6 font-mono">
                {year}
              </h2>

              <div className="space-y-8">
                {Object.entries(months).map(([month, monthPosts]) => (
                  <div key={month} className="space-y-3">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                      {month}
                    </h3>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                      {monthPosts.map((post) => (
                        <div
                          key={post._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {post.category && (
                              <span className="font-mono rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shrink-0">
                                {post.category.name}
                              </span>
                            )}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate"
                            >
                              {post.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 sm:shrink-0 font-mono text-[11px]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.readingTime && (
                              <span>{post.readingTime}m read</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="p-12 text-center text-sm text-[var(--foreground-muted)]">
              No articles recorded in the archive yet.
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
