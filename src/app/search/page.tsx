import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Layers, Compass, Search as SearchIcon } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { NewsCard } from "@/components/blog/cards/news-card";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getAllCategories } from "@/lib/db/queries/taxonomies";
import { SearchInputDeck } from "@/components/search/search-input-deck";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { getSiteUrl } from "@/lib/seo/fallback";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "latest" | "popular" | "oldest";
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const siteUrl = getSiteUrl();

  if (q && q.trim()) {
    const cleanQ = q.trim();
    return {
      title: `Search: "${cleanQ}" | Kraviona AI News`,
      description: `Explore AI intelligence reports, model evaluations, and technology analysis matching "${cleanQ}" on Kraviona AI News.`,
      alternates: {
        canonical: `${siteUrl}/search?q=${encodeURIComponent(cleanQ)}`,
      },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "Search Intelligence Archive | Kraviona AI News",
    description:
      "Search the Kraviona AI News archive for artificial intelligence coverage, model launches, research papers, startups, cybersecurity, and compute infrastructure.",
    alternates: {
      canonical: `${siteUrl}/search`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q?.trim() || "";
  const activeCategory = resolvedParams.category?.trim() || "";
  const activeSort = resolvedParams.sort || "latest";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [categories, settings] = await Promise.all([
    getAllCategories(),
    getGlobalSettings(),
  ]);

  let posts: any[] = [];
  let pagination = {
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  };

  if (searchQuery || activeCategory || activeSort !== "latest") {
    const res = await getPublishedPosts({
      search: searchQuery || undefined,
      categorySlug: activeCategory || undefined,
      sort: activeSort,
      page: currentPage,
      limit: 12,
    });
    posts = res.posts;
    pagination = res.pagination;
  } else {
    const res = await getPublishedPosts({ limit: 6, sort: "latest" });
    posts = res.posts;
  }

  const isFilteredView = Boolean(searchQuery || activeCategory || activeSort !== "latest");

  return (
    <PublicShell
      navLinks={settings.navigation}
      footerConfig={settings.footer}
      headlines={posts}
    >
      {/* Breadcrumb Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--color-card-background)] py-3">
        <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted-text)]"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/search"
              className={
                searchQuery
                  ? "hover:text-[var(--accent)] transition-colors"
                  : "font-bold text-[var(--color-heading)]"
              }
            >
              Search
            </Link>
            {searchQuery && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-bold text-[var(--accent)] truncate max-w-[200px] sm:max-w-md">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Search Hero Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-4">
            <SearchIcon className="h-3.5 w-3.5" />
            <span>Kraviona Archive Discovery</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-tight">
            Search AI Intelligence, Models &amp; Research
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed max-w-2xl mx-auto">
            Query verified reports across frontier AI models, developer tooling, startups, cybersecurity, and compute infrastructure.
          </p>

          <div className="mt-8">
            <SearchInputDeck
              initialQuery={searchQuery}
              initialCategory={activeCategory}
              initialSort={activeSort}
            />
          </div>
        </div>

        {/* View 1: Active Search / Filter Results */}
        {isFilteredView ? (
          <div>
            <SearchFilters
              query={searchQuery}
              activeCategory={activeCategory}
              activeSort={activeSort}
              categories={categories}
              totalResults={pagination.total}
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--color-muted-text)]">
                Showing{" "}
                {posts.length > 0 ? (currentPage - 1) * pagination.limit + 1 : 0}–
                {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                <span className="font-bold text-[var(--color-heading)]">
                  {pagination.total}
                </span>{" "}
                {pagination.total === 1 ? "article" : "articles"}
                {searchQuery && (
                  <>
                    {" "}
                    for &ldquo;
                    <span className="font-bold text-[var(--accent)]">{searchQuery}</span>
                    &rdquo;
                  </>
                )}
                {activeCategory && (
                  <span className="ml-1">
                    in{" "}
                    <span className="font-semibold text-[var(--color-heading)] capitalize">
                      {activeCategory.replace(/-/g, " ")}
                    </span>
                  </span>
                )}
              </p>

              {pagination.pages > 1 && (
                <span className="font-mono text-xs font-semibold text-[var(--color-muted-text)]">
                  Page {currentPage} of {pagination.pages}
                </span>
              )}
            </div>

            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {posts.map((post) => (
                  <NewsCard
                    key={post._id}
                    post={post}
                    variant="classic-editorial"
                    showBadges={true}
                    showExcerpt={true}
                  />
                ))}
              </div>
            ) : (
              <SearchEmptyState query={searchQuery || activeCategory} category={activeCategory} />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                {pagination.hasPrev && (
                  <Link
                    href={`/search?${new URLSearchParams({
                      ...(searchQuery ? { q: searchQuery } : {}),
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSort !== "latest" ? { sort: activeSort } : {}),
                      page: String(currentPage - 1),
                    }).toString()}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] hover:border-[var(--accent)] transition-colors"
                  >
                    Previous
                  </Link>
                )}

                <div className="flex items-center gap-1.5 font-mono">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                    const isCurr = p === currentPage;
                    return (
                      <Link
                        key={p}
                        href={`/search?${new URLSearchParams({
                          ...(searchQuery ? { q: searchQuery } : {}),
                          ...(activeCategory ? { category: activeCategory } : {}),
                          ...(activeSort !== "latest" ? { sort: activeSort } : {}),
                          page: String(p),
                        }).toString()}`}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          isCurr
                            ? "bg-[var(--accent)] text-white"
                            : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {pagination.hasNext && (
                  <Link
                    href={`/search?${new URLSearchParams({
                      ...(searchQuery ? { q: searchQuery } : {}),
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(activeSort !== "latest" ? { sort: activeSort } : {}),
                      page: String(currentPage + 1),
                    }).toString()}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] hover:border-[var(--accent)] transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          /* View 2: Discovery Hub */
          <div className="space-y-16">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-[var(--color-heading)] tracking-tight flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[var(--accent)]" />
                    Browse by Category Desk
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-muted-text)] mt-1">
                    Explore focused desks covering AI models, research, tooling, and global compute.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                        <span className="font-mono text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded">
                          {cat.postCount || 0} Articles
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[var(--color-muted-text)] line-clamp-2 mt-1.5 leading-relaxed">
                        {cat.description || `Coverage, analysis, and benchmarks in ${cat.name}.`}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between font-mono text-xs font-bold text-[var(--accent)]">
                      <span>Open Desk</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-[var(--color-heading)] tracking-tight flex items-center gap-2">
                    <Compass className="h-5 w-5 text-[var(--accent)]" />
                    Latest Dispatches
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-muted-text)] mt-1">
                    Recently verified articles across Kraviona AI News.
                  </p>
                </div>
                <Link
                  href="/"
                  className="font-mono text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  Front Page <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {posts.map((post) => (
                  <NewsCard
                    key={post._id}
                    post={post}
                    variant="classic-editorial"
                    showBadges={true}
                    showExcerpt={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
