import Link from "next/link";
import Image from "next/image";
import { Flame, Clock, Eye, ArrowRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TrendingLatestProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestPosts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trendingPosts: any[];
}

export function TrendingLatestSection({ latestPosts, trendingPosts }: TrendingLatestProps) {
  return (
    <section className="my-12 sm:my-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Latest Coverage (lg:col-span-8) */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--border)]">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Latest AI Coverage
            </h2>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              All articles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-6">
            {latestPosts.map((post) => {
              const dateVal = post.publishedAt || post.createdAt;
              const showViews = typeof post.views === "number" && post.views >= 100;
              return (
                <article
                  key={post._id}
                  className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  {post.coverImage && (
                    <div className="relative aspect-video sm:aspect-square w-full sm:w-44 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--background-secondary)]">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 176px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mb-2">
                        {post.category && (
                          <span className="font-semibold text-[var(--accent)]">
                            {post.category.name}
                          </span>
                        )}
                        {dateVal && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3" />
                            {formatDate(dateVal)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          <span className="absolute inset-0 z-0" />
                          {post.title}
                        </Link>
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <span className="font-medium text-[var(--foreground)]">
                        {post.author?.name || "Editorial Team"}
                      </span>

                      <div className="flex items-center gap-3">
                        {post.readingTime && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {post.readingTime} min
                          </span>
                        )}
                        {showViews && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Eye className="h-3 w-3" />
                            {post.views.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination / Browse All Button */}
          <div className="mt-8 text-center sm:text-left">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] hover:border-indigo-300 transition-all shadow-2xs group"
            >
              <span>View All AI Articles &amp; Archives</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Trending Sidebar (lg:col-span-4) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[var(--border)]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Trending Stories
                </h3>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Most engaged dispatches this week
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {trendingPosts.map((post, idx) => {
                const showViews = typeof post.views === "number" && post.views >= 100;
                return (
                  <div
                    key={post._id || idx}
                    className="group relative flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <span className="flex-shrink-0 font-mono text-base font-extrabold text-indigo-400 group-hover:text-indigo-600 transition-colors w-6">
                      0{idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      {post.category && (
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                          {post.category.name}
                        </span>
                      )}
                      <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>

                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
                        {post.readingTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {post.readingTime}m
                          </span>
                        )}
                        {showViews && (
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-2.5 w-2.5" />
                            {post.views.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
