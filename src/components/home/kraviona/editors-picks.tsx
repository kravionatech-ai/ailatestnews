"use client";

import Link from "next/link";
import Image from "next/image";
import { Award, Calendar, Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { NewsCardPost } from "@/components/blog/cards/types";

interface EditorsPicksProps {
  posts: NewsCardPost[];
}

export function EditorsPicksSection({ posts = [] }: EditorsPicksProps) {
  if (!posts.length) return null;

  const spotlightPosts = posts.slice(0, 2);
  const supportPosts = posts.slice(2, 4);

  return (
    <section
      aria-label="Editor's Picks"
      className="border-b border-[var(--border)] bg-[var(--color-card-background)] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
              <Award className="h-3.5 w-3.5" />
              <span>Curated Analysis</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading)]">
              Editor&apos;s Picks
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[var(--color-muted-text)] max-w-md">
            Essential long-form investigations, deep model architecture teardowns, and strategic industry briefings chosen by our senior editors.
          </p>
        </div>

        {/* Large 2-Column Featured Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {spotlightPosts.map((post) => {
            const pDate = post.publishedAt || post.createdAt;
            return (
              <article
                key={post._id || post.slug}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-secondary-surface)] border-b border-[var(--border)]">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#101820] to-[#263B50]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/50 via-transparent to-transparent" />
                    <span className="relative z-10 inline-block m-4 rounded bg-[var(--accent)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      Editor&apos;s Pick {post.category ? `· ${post.category.name}` : ""}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    <h3 className="font-editorial text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-[var(--color-heading)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        <span className="absolute inset-0 z-0" aria-hidden="true" />
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className="mt-3 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 sm:px-8 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {post.author?.name && (
                      <span className="font-semibold text-[var(--color-heading)]">
                        {post.author.name}
                      </span>
                    )}
                    {pDate && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(pDate, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </>
                    )}
                    {post.readingTime && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min
                        </span>
                      </>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)] group-hover:translate-x-1 transition-transform">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Supporting Editorial Duo (if > 2 items) */}
        {supportPosts.length > 0 && (
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportPosts.map((post) => {
              const pDate = post.publishedAt || post.createdAt;
              return (
                <article
                  key={post._id || post.slug}
                  className="group relative flex flex-col sm:flex-row gap-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-4 sm:p-5 hover:border-[var(--accent)] hover:shadow-sm transition-all"
                >
                  {post.coverImage && (
                    <div className="relative aspect-[16/10] sm:aspect-square sm:w-36 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--color-secondary-surface)]">
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 144px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1.5">
                        <span>{post.category?.name || "Deep Dive"}</span>
                        {pDate && (
                          <span className="text-[var(--color-muted-text)] font-normal">
                            · {formatDate(pDate, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-extrabold text-[var(--color-heading)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          <span className="absolute inset-0 z-0" aria-hidden="true" />
                          {post.title}
                        </Link>
                      </h3>

                      {post.excerpt && (
                        <p className="mt-1.5 text-xs text-[var(--color-muted-text)] line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-muted-text)]">
                      <span>{post.readingTime ? `${post.readingTime} min read` : "Analysis"}</span>
                      <span className="text-[var(--accent)] font-bold group-hover:translate-x-1 transition-transform">
                        Read →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
