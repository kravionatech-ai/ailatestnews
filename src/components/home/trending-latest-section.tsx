import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Eye, Calendar, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TrendingLatestProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestPosts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trendingPosts: any[];
}

export function TrendingLatestSection({ latestPosts, trendingPosts }: TrendingLatestProps) {
  return (
    <section className="py-10 sm:py-14 border-b border-slate-200" aria-label="Latest AI Stream and Most Read">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: The Continuous News Stream (lg:col-span-8) */}
        <div className="lg:col-span-8">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-slate-900">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Continuous Stream
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Latest AI Reporting
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors"
            >
              <span>Full Archive</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestPosts.map((post) => {
              const dateVal = post.publishedAt || post.createdAt;
              const showViews = typeof post.views === "number" && post.views >= 10;
              return (
                <article
                  key={post._id}
                  className="group relative flex flex-col sm:flex-row gap-5 sm:gap-6 py-6 first:pt-0 last:pb-0"
                >
                  {post.coverImage && (
                    <div className="relative aspect-16/9 sm:aspect-square w-full sm:w-44 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 176px"
                        className="object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        {post.category && (
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            {post.category.name}
                          </span>
                        )}
                        <span className="text-slate-300">·</span>
                        {dateVal && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3" />
                            {formatDate(dateVal)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          <span className="absolute inset-0 z-0" />
                          {post.title}
                        </Link>
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        By {post.author?.name || "Editorial Staff"}
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
                            {post.views.toLocaleString()} reads
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 hover:bg-slate-50 hover:border-slate-900 transition-all shadow-2xs group"
            >
              <span>Explore All Published Stories</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: The Most Read Wire (lg:col-span-4) */}
        <aside className="lg:col-span-4">
          <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-900">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900">
                <TrendingUp className="h-4 w-4 text-rose-600" />
                <span>The Most Read</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">This Week</span>
            </div>

            <div className="space-y-5">
              {trendingPosts.map((post, idx) => {
                const showViews = typeof post.views === "number" && post.views >= 10;
                return (
                  <div
                    key={post._id || idx}
                    className="group relative flex items-start gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <span className="flex-shrink-0 font-mono text-2xl font-black text-slate-300 group-hover:text-slate-900 transition-colors w-8 leading-none mt-0.5">
                      0{idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      {post.category && (
                        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                          {post.category.name}
                        </span>
                      )}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>

                      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
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
