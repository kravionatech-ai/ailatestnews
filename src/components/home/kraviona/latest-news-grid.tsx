"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight, Newspaper } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { NewsCardPost } from "@/components/blog/cards/types";

interface LatestNewsGridProps {
  posts: NewsCardPost[];
}

export function LatestNewsSection({ posts = [] }: LatestNewsGridProps) {
  if (!posts.length) return null;

  return (
    <section
      aria-label="Latest News"
      className="border-b border-[var(--border)] bg-[var(--color-main-background)] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              <span>Latest Dispatches</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading)]">
              Latest News
            </h2>
          </div>

          <Link
            href="/archive"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors shrink-0"
          >
            <span>Browse All Dispatches</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 3-Column Modern Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {posts.slice(0, 6).map((post) => {
            const dateVal = post.publishedAt || post.createdAt;
            return (
              <article
                key={post._id || post.slug}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs hover:border-[var(--accent)]/60 hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* Featured Article Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-secondary-surface)] border-b border-[var(--border)]">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#101820] to-[#263B50]" />
                    )}
                    {post.category && (
                      <Link
                        href={`/category/${post.category.slug}`}
                        className="relative z-10 inline-block m-3 rounded bg-[#101820]/90 hover:bg-[var(--accent)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-colors"
                      >
                        {post.category.name}
                      </Link>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-5 sm:p-6">
                    <h3 className="font-display text-lg font-extrabold text-[var(--color-heading)] tracking-tight leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        <span className="absolute inset-0 z-0" aria-hidden="true" />
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className="mt-2.5 text-sm text-[var(--color-muted-text)] leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata Footer: Date & Reading Time */}
                <div className="px-5 pb-5 sm:px-6 pt-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {dateVal && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[var(--accent)]" />
                        <time dateTime={new Date(dateVal).toISOString()}>
                          {formatDate(dateVal, { month: "short", day: "numeric", year: "numeric" })}
                        </time>
                      </span>
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

                  <span className="font-mono text-[11px] font-bold text-[var(--accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                    Read →
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
