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
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "blog" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/blog",
    title: page?.seo?.metaTitle || page?.title || "All Articles & Dispatches | Kraviona AI News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Browse comprehensive AI articles, model benchmark teardowns, tools guides, and technology reporting on Kraviona AI News.",
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
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="max-w-3xl mb-8 pb-5 border-b-2 border-[var(--color-heading)]">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] block mb-2">
            Continuous Wire // All Intelligence
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)]">
            Articles &amp; Technical Dispatches
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed">
            Independent coverage of frontier models, research breakthroughs, AI tooling, startups, and compute infrastructure.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                !category
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-body-text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              All Topics
            </Link>
            {categories.map((c: { _id: string; slug: string; name: string }) => (
              <Link
                key={c._id}
                href={`/blog?category=${c.slug}${sort ? `&sort=${sort}` : ""}`}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  category === c.slug
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-body-text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-muted-text)]">
            <Filter className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Sort:</span>
            <Link
              href={`/blog?${category ? `category=${category}&` : ""}sort=latest`}
              className={`font-bold uppercase transition-colors ${
                sort === "latest"
                  ? "text-[var(--color-heading)] underline decoration-[var(--accent)] underline-offset-4"
                  : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
              }`}
            >
              Latest
            </Link>
            <span>·</span>
            <Link
              href={`/blog?${category ? `category=${category}&` : ""}sort=popular`}
              className={`font-bold uppercase transition-colors ${
                sort === "popular"
                  ? "text-[var(--color-heading)] underline decoration-[var(--accent)] underline-offset-4"
                  : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
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
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--color-card-background)] p-16 text-center">
            <p className="text-base font-bold text-[var(--color-heading)]">No articles found</p>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Try adjusting your topic filter or return to all articles.
            </p>
            <Link
              href="/blog"
              className="mt-4 inline-block rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
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
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-2 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] opacity-60 cursor-not-allowed">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </span>
            )}

            <span className="text-xs font-mono font-medium text-[var(--color-muted-text)]">
              Page {pagination.page} of {pagination.pages}
            </span>

            {pagination.hasNext ? (
              <Link
                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ""}${
                  sort ? `&sort=${sort}` : ""
                }`}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-2 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-xs"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-muted-text)] opacity-60 cursor-not-allowed">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
