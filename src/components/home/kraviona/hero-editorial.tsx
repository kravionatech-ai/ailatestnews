"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowUpRight, ArrowRight, User } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { NewsCardPost } from "@/components/blog/cards/types";

interface HeroEditorialProps {
  featuredPost: NewsCardPost | null;
  secondaryPosts: NewsCardPost[];
}

export function HeroEditorialSection({
  featuredPost,
  secondaryPosts = [],
}: HeroEditorialProps) {
  if (!featuredPost) return null;

  const publishDate = featuredPost.publishedAt || featuredPost.createdAt;
  const secondary = secondaryPosts.slice(0, 3);

  return (
    <section
      aria-label="Featured Editorial Intelligence"
      className="border-b border-[var(--border)] bg-[var(--color-main-background)] pt-6 pb-10 sm:pt-8 sm:pb-12"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        {/* Section Kicker Line */}
        <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-heading)]">
              Lead Dispatch
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-[var(--color-muted-text)]">
            AI, Technology, Research &amp; Innovation Intelligence
          </span>
        </div>

        {/* 12-Column Editorial Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Primary Lead Story (8 cols) */}
          <article className="lg:col-span-8 group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs hover:border-[var(--accent)]/60 hover:shadow-md transition-all duration-300">
            <div>
              {/* Cover Image */}
              <div className="relative aspect-16/9 w-full overflow-hidden bg-[var(--color-secondary-surface)]">
                {featuredPost.coverImage ? (
                  <Image
                    src={featuredPost.coverImage}
                    alt={featuredPost.coverImageAlt || featuredPost.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#101820] to-[#263B50]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/60 via-transparent to-transparent" />

                {/* Category Label */}
                {featuredPost.category && (
                  <Link
                    href={`/category/${featuredPost.category.slug}`}
                    className="relative z-10 inline-flex items-center gap-1.5 m-4 rounded-md bg-[var(--accent)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    {featuredPost.category.name}
                  </Link>
                )}
              </div>

              {/* Headline & Summary */}
              <div className="p-6 sm:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--color-muted-text)]">
                  {publishDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <time dateTime={new Date(publishDate).toISOString()}>
                        {formatDate(publishDate)}
                      </time>
                    </span>
                  )}
                  {featuredPost.readingTime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredPost.readingTime} min read
                      </span>
                    </>
                  )}
                </div>

                <h1 className="font-editorial text-2xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[var(--color-heading)] leading-[1.12] group-hover:text-[var(--accent)] transition-colors">
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <span className="absolute inset-0 z-0" aria-hidden="true" />
                    {featuredPost.title}
                  </Link>
                </h1>

                {featuredPost.excerpt && (
                  <p className="mt-4 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed line-clamp-3 max-w-3xl">
                    {featuredPost.excerpt}
                  </p>
                )}
              </div>
            </div>

            {/* Author Info & Read Link Footer */}
            <div className="px-6 pb-6 sm:px-8 sm:pb-7 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 relative z-10">
                {featuredPost.author?.image ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[var(--border)] shrink-0">
                    <Image
                      src={featuredPost.author.image}
                      alt={featuredPost.author.name || "Author"}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101820] text-white text-xs font-bold shrink-0">
                    {featuredPost.author?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </div>
                )}

                <div>
                  <Link
                    href={
                      featuredPost.author?.slug
                        ? `/author/${featuredPost.author.slug}`
                        : "/about"
                    }
                    className="text-xs sm:text-sm font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors block leading-tight"
                  >
                    {featuredPost.author?.name || "Kraviona Editorial Desk"}
                  </Link>
                  <span className="text-[11px] font-mono text-[var(--color-muted-text)]">
                    Senior Technology Desk
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)] group-hover:translate-x-1 transition-transform">
                <span>Read Dispatch</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </article>

          {/* Secondary Featured Stories Column (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <h2 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]">
                    Briefing Wire
                  </h2>
                </div>
                <Link
                  href="/archive"
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--accent)] hover:underline"
                >
                  <span>Full Wire</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {secondary.map((post) => {
                  const pDate = post.publishedAt || post.createdAt;
                  return (
                    <article
                      key={post._id || post.slug}
                      className="py-4 first:pt-1 last:pb-1 group relative"
                    >
                      <div className="flex gap-3.5 items-start">
                        {/* Crisp Compact Thumbnail */}
                        {post.coverImage && (
                          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--color-secondary-surface)]">
                            <Image
                              src={post.coverImage}
                              alt={post.coverImageAlt || post.title}
                              fill
                              sizes="96px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider mb-1">
                            <span className="font-bold text-[var(--accent)] truncate">
                              {post.category?.name || "Intelligence"}
                            </span>
                            {pDate && (
                              <span className="text-[var(--color-muted-text)] shrink-0">
                                {formatRelativeTime(pDate)}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-sm font-bold text-[var(--color-heading)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                            <Link href={`/blog/${post.slug}`}>
                              <span className="absolute inset-0 z-0" aria-hidden="true" />
                              {post.title}
                            </Link>
                          </h3>

                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-muted-text)]">
                            {post.readingTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.readingTime} min
                              </span>
                            )}
                            {post.author?.name && (
                              <>
                                <span>·</span>
                                <span className="truncate">{post.author.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Secondary Wire Footer CTA */}
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <Link
                href="/category/ai-news"
                className="flex items-center justify-between rounded-lg bg-[var(--color-main-background)] hover:bg-[#101820] hover:text-white dark:hover:bg-[#E05A42] px-4 py-2.5 text-xs font-bold text-[var(--color-heading)] transition-colors"
              >
                <span>Explore All AI Headlines</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
