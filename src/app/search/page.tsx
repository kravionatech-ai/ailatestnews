import { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight, Layers, TrendingUp, Sparkles, Compass } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getAllCategories } from "@/lib/db/queries/taxonomies";
import { SearchInputDeck } from "@/components/search/search-input-deck";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { getGlobalSettings } from "@/lib/db/queries/settings";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ailatestnews.in";

  if (q && q.trim()) {
    const cleanQ = q.trim();
    return {
      title: `Search: "${cleanQ}" | AI Latest News`,
      description: `Explore published AI dispatches, foundation model launches, and Indian AI benchmarks matching "${cleanQ}".`,
      alternates: {
        canonical: `${siteUrl}/search?q=${encodeURIComponent(cleanQ)}`,
      },
      robots: { index: false, follow: true }, // Internal search results best practice
    };
  }

  return {
    title: "Search AI News, Models, Tools & Benchmarks | AI Latest News",
    description:
      "Search the AI Latest News archive for breaking AI stories, Indian compute mission updates, model releases, and comprehensive technical comparisons.",
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
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));

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

  if (searchQuery) {
    const res = await getPublishedPosts({
      search: searchQuery,
      categorySlug: activeCategory || undefined,
      sort: activeSort,
      page: currentPage,
      limit: 12,
    });
    posts = res.posts;
    pagination = res.pagination;
  } else {
    // Default discovery state: load latest 6 articles
    const res = await getPublishedPosts({ limit: 6, sort: "latest" });
    posts = res.posts;
  }

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      {/* Breadcrumbs Navigation */}
      <div className="border-b border-slate-100 bg-slate-50/60 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link
              href="/search"
              className={searchQuery ? "hover:text-indigo-600 transition-colors" : "font-semibold text-slate-800"}
            >
              Search
            </Link>
            {searchQuery && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="font-semibold text-indigo-600 truncate max-w-[200px] sm:max-w-md">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Hero Search Section */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-4 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI Knowledge &amp; Dispatch Archive</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] leading-tight">
            Search AI Models, Tools &amp; India Dispatches
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--foreground-secondary)] leading-relaxed max-w-2xl mx-auto">
            Instant discovery across foundation model launches, Indian compute initiatives, practical implementation guides, and open-source benchmarks.
          </p>

          {/* Interactive Search Deck */}
          <div className="mt-8">
            <SearchInputDeck
              initialQuery={searchQuery}
              initialCategory={activeCategory}
              initialSort={activeSort}
            />
          </div>
        </div>

        {/* -------------------- VIEW 1: SEARCH ACTIVE WITH QUERY -------------------- */}
        {searchQuery ? (
          <div>
            {/* Filter and Refinement Bar */}
            <SearchFilters
              query={searchQuery}
              activeCategory={activeCategory}
              activeSort={activeSort}
              categories={categories}
              totalResults={pagination.total}
            />

            {/* Results Header Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[var(--foreground-muted)]">
                Showing {posts.length > 0 ? (currentPage - 1) * pagination.limit + 1 : 0}–
                {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                <span className="font-bold text-[var(--foreground)]">{pagination.total}</span>{" "}
                {pagination.total === 1 ? "article" : "articles"} for &ldquo;
                <span className="font-bold text-indigo-600">{searchQuery}</span>&rdquo;
                {activeCategory && (
                  <span className="ml-1 text-slate-500">
                    in <span className="font-semibold text-slate-700 capitalize">{activeCategory.replace(/-/g, " ")}</span>
                  </span>
                )}
              </p>

              {pagination.pages > 1 && (
                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage} of {pagination.pages}
                </span>
              )}
            </div>

            {/* Results Grid */}
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <SearchEmptyState query={searchQuery} category={activeCategory} />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                {pagination.hasPrev && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}${
                      activeCategory ? `&category=${activeCategory}` : ""
                    }${activeSort !== "latest" ? `&sort=${activeSort}` : ""}&page=${currentPage - 1}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Previous Page
                  </Link>
                )}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                    const isCurr = p === currentPage;
                    return (
                      <Link
                        key={p}
                        href={`/search?q=${encodeURIComponent(searchQuery)}${
                          activeCategory ? `&category=${activeCategory}` : ""
                        }${activeSort !== "latest" ? `&sort=${activeSort}` : ""}&page=${p}`}
                        className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                          isCurr
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
                {pagination.hasNext && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}${
                      activeCategory ? `&category=${activeCategory}` : ""
                    }${activeSort !== "latest" ? `&sort=${activeSort}` : ""}&page=${currentPage + 1}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Next Page
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          /* -------------------- VIEW 2: INITIAL DISCOVERY HUB (EMPTY QUERY) -------------------- */
          <div className="space-y-16">
            {/* Explore by Content Pillar */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    Explore AI Coverage by Pillar
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
                    Dive directly into curated hubs covering foundational models, Indian policy, and practical guides.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-600 group-hover:scale-125 transition-transform" />
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          {cat.postCount || 0} Articles
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-indigo-600 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mt-1.5 leading-relaxed">
                        {cat.description || `Comprehensive updates, analysis and breakdowns in ${cat.name}.`}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                      <span>Browse Pillar</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Latest Published Dispatches */}
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
                    <Compass className="h-5 w-5 text-emerald-600" />
                    Latest Published Dispatches
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
                    Recently verified dispatches across all editorial desks.
                  </p>
                </div>
                <Link
                  href="/"
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View Home Feed <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
