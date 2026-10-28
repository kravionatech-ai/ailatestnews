import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FeaturedSection({ featuredPost, secondaryPosts }: { featuredPost: any; secondaryPosts: any[] }) {
  if (!featuredPost && (!secondaryPosts || secondaryPosts.length === 0)) {
    return null;
  }

  // Safe empty state when no featured post is explicitly marked by editorial team
  if (!featuredPost) {
    return (
      <section className="my-10 sm:my-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-500" />
              Latest Coverage
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Top Dispatches
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondaryPosts.map((post) => {
            const dateVal = post.publishedAt || post.createdAt;
            return (
              <article
                key={post._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all"
              >
                {post.coverImage && (
                  <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-xl bg-[var(--background-secondary)]">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                    {post.category && (
                      <span className="font-semibold text-[var(--accent)]">
                        {post.category.name}
                      </span>
                    )}
                    {dateVal && <span>{formatDate(dateVal)}</span>}
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>
                      <span className="absolute inset-0 z-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-xs text-[var(--foreground-secondary)] line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  const featuredDate = featuredPost.publishedAt || featuredPost.createdAt;

  return (
    <section className="my-10 sm:my-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Top Stories
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Editor&apos;s Featured Coverage
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Large Featured Card (lg:col-span-7) */}
        <div className="lg:col-span-7 group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all">
          <div>
            {featuredPost.coverImage && (
              <div className="relative aspect-16/9 w-full overflow-hidden bg-[var(--background-secondary)] border-b border-[var(--border)]">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-indigo-600/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="h-3 w-3" /> Featured Story
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between text-xs mb-3">
                {featuredPost.category && (
                  <Link
                    href={`/category/${featuredPost.category.slug}`}
                    className="relative z-10 font-bold uppercase tracking-wider text-xs text-[var(--accent)] hover:underline"
                  >
                    {featuredPost.category.name}
                  </Link>
                )}
                {featuredDate && (
                  <span className="flex items-center gap-1 text-[var(--foreground-muted)] text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featuredDate)}
                  </span>
                )}
              </div>

              {/* Semantic H2 */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors leading-snug">
                <Link href={`/blog/${featuredPost.slug}`}>
                  <span className="absolute inset-0 z-0" />
                  {featuredPost.title}
                </Link>
              </h2>

              <p className="mt-3 text-base text-[var(--foreground-secondary)] line-clamp-3 leading-relaxed">
                {featuredPost.excerpt}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <div className="flex items-center gap-2 relative z-10">
              {featuredPost.author?.image ? (
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-[var(--border)]">
                  <Image
                    src={featuredPost.author.image}
                    alt={featuredPost.author.name || "Author"}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700 text-xs">
                  {featuredPost.author?.name?.charAt(0) || "E"}
                </div>
              )}
              <span className="font-semibold text-[var(--foreground)]">
                {featuredPost.author?.name || "Editorial Team"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {featuredPost.readingTime && (
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {featuredPost.readingTime} min read
                </span>
              )}
              <span className="relative z-10 flex items-center gap-1 font-semibold text-[var(--accent)] group-hover:translate-x-1 transition-transform">
                Read Full Story <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3 Secondary Stories (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {secondaryPosts.map((post) => {
            const dateVal = post.publishedAt || post.createdAt;
            return (
              <article
                key={post._id}
                className="group relative flex flex-1 gap-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all items-center"
              >
                {post.coverImage && (
                  <div className="relative h-24 w-28 sm:h-28 sm:w-36 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--background-secondary)]">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 112px, 144px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--foreground-muted)] mb-1">
                    {post.category && (
                      <span className="font-semibold text-[var(--accent)]">
                        {post.category.name}
                      </span>
                    )}
                    {dateVal && <span>• {formatDate(dateVal)}</span>}
                  </div>

                  {/* Semantic H3 */}
                  <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>
                      <span className="absolute inset-0 z-0" />
                      {post.title}
                    </Link>
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--foreground-muted)]">
                    {post.readingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
