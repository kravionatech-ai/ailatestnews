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
    title: page?.seo?.metaTitle || page?.title || "Publication Archive | Kraviona AI News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Explore the Kraviona AI News chronological archive of artificial intelligence dispatches, model benchmarks, and technology reporting.",
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="border-b-2 border-[var(--color-heading)] pb-5 mb-10">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            <ArchiveIcon className="h-3.5 w-3.5" />
            <span>Chronological Index // AI Dispatches</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)]">
            Publication Archive
          </h1>
          <p className="mt-2.5 text-sm text-[var(--color-muted-text)]">
            A complete chronological index of published reporting, model analyses, and technology dispatches.
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(grouped).map(([year, months]) => (
            <div key={year} className="relative pl-6 border-l-2 border-[var(--color-heading)]">
              <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-mono font-bold text-white border-2 border-[var(--color-main-background)]">
                {year.slice(-2)}
              </span>

              <h2 className="font-display text-2xl font-extrabold text-[var(--color-heading)] mb-6 font-mono">
                {year}
              </h2>

              <div className="space-y-8">
                {Object.entries(months).map(([month, monthPosts]) => (
                  <div key={month} className="space-y-3">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                      {month}
                    </h3>
                    <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] overflow-hidden shadow-xs">
                      {monthPosts.map((post) => (
                        <div
                          key={post._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[var(--color-secondary-surface)] transition-colors gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {post.category && (
                              <span className="font-mono rounded-md bg-[var(--color-secondary-surface)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-heading)] shrink-0">
                                {post.category.name}
                              </span>
                            )}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-xs sm:text-sm font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors truncate"
                            >
                              {post.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted-text)] sm:shrink-0 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.readingTime && (
                              <span>{post.readingTime} min read</span>
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
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--color-card-background)] p-12 text-center text-sm text-[var(--color-muted-text)]">
              No articles recorded in the archive yet.
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
