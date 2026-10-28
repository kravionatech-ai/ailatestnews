import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Filter } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getAllCategories } from "@/lib/db/queries/taxonomies";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "blog" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/blog",
    title: page?.seo?.metaTitle || page?.title || "All Articles & Dispatches | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Browse comprehensive AI articles, model benchmark teardowns, tools guides, and Indian sovereign compute intelligence.",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const category = resolvedParams.category;
  const sort = (resolvedParams.sort as "latest" | "popular" | "oldest") || "latest";

  const [{ posts, pagination }, categories, settings] = await Promise.all([
    getPublishedPosts({
      page,
      limit: 9,
      categorySlug: category,
      sort,
    }),
    getAllCategories(),
    getGlobalSettings(),
  ]);

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            AI Dispatches &amp; Deep Dives
          </h1>
          <p className="mt-2 text-base text-[var(--foreground-muted)]">
            In-depth analysis of frontier models, Indian compute initiatives, practical implementation guides, and open benchmarks.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                !category
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "border border-[var(--border)] bg-white text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"
              }`}
            >
              All Topics
            </Link>
            {categories.map((c: { _id: string; slug: string; name: string }) => (
              <Link
                key={c._id}
                href={`/blog?category=${c.slug}${sort ? `&sort=${sort}` : ""}`}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  category === c.slug
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "border border-[var(--border)] bg-white text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            <span className="text-[var(--foreground-muted)]">Sort:</span>
            <Link
              href={`/blog?${category ? `category=${category}&` : ""}sort=latest`}
              className={`font-semibold ${
                sort === "latest" ? "text-[var(--accent)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Latest
            </Link>
            <span>•</span>
            <Link
              href={`/blog?${category ? `category=${category}&` : ""}sort=popular`}
              className={`font-semibold ${
                sort === "popular" ? "text-[var(--accent)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Most Read
            </Link>
          </div>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {posts.map((post: { _id: string; title: string; slug: string; excerpt: string }) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">No articles found</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Try adjusting your topic filter or return to all articles.
            </p>
            <Link
              href="/blog"
              className="mt-4 inline-block rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs"
            >
              Clear filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 border-t border-[var(--border)]">
            {pagination.hasPrev ? (
              <Link
                href={`/blog?page=${page - 1}${category ? `&category=${category}` : ""}${
                  sort ? `&sort=${sort}` : ""
                }`}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] shadow-2xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </span>
            )}

            <span className="text-xs font-medium text-[var(--foreground-muted)]">
              Page {pagination.page} of {pagination.pages}
            </span>

            {pagination.hasNext ? (
              <Link
                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ""}${
                  sort ? `&sort=${sort}` : ""
                }`}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-4 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] shadow-2xs"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
