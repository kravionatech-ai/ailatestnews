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
  await connectDB();
  const page = await Page.findOne({ slug: "archive" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/archive",
    title: page?.seo?.metaTitle || page?.title || "Publication Archive | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Explore our chronological publication timeline of AI dispatches, foundation model launches, and Indian AI benchmarks.",
  });
}

export default async function ArchivePage() {
  await connectDB();

  const [postsRaw, settings] = await Promise.all([
    Post.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .select("title slug publishedAt readingTime category")
      .populate("category", "name slug")
      .lean(),
    getGlobalSettings(),
  ]);

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
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <ArchiveIcon className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Chronology
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Publication Archive
        </h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)] mb-12">
          A historical index of all published engineering articles, guides, and architectural notes.
        </p>

        <div className="space-y-12">
          {Object.entries(grouped).map(([year, months]) => (
            <div key={year} className="relative pl-6 border-l-2 border-[var(--border)]">
              <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-light)] text-xs font-bold text-[var(--accent)] border-2 border-white">
                {year.slice(-2)}
              </span>

              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                {year}
              </h2>

              <div className="space-y-8">
                {Object.entries(months).map(([month, monthPosts]) => (
                  <div key={month} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                      {month}
                    </h3>
                    <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-2xs">
                      {monthPosts.map((post) => (
                        <div
                          key={post._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors gap-2"
                        >
                          <div className="flex items-center gap-3">
                            {post.category && (
                              <span className="rounded-lg bg-[var(--background-tertiary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--foreground-secondary)]">
                                {post.category.name}
                              </span>
                            )}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                            >
                              {post.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)] sm:flex-shrink-0">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.readingTime && (
                              <span>{post.readingTime} min</span>
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
