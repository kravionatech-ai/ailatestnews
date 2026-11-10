"use client";

import Link from "next/link";
import { Flame, Clock, ArrowUpRight } from "lucide-react";
import type { NewsCardPost } from "@/components/blog/cards/types";

interface TrendingNowProps {
  posts: NewsCardPost[];
}

export function TrendingNowSection({ posts = [] }: TrendingNowProps) {
  if (!posts.length) return null;

  return (
    <section
      aria-label="Trending Now"
      className="border-b border-[var(--border)] bg-[var(--color-card-background)] py-10 sm:py-12"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
              <Flame className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-[var(--color-heading)]">
              Trending Now
            </h2>
          </div>

          <Link
            href="/search?sort=popular"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] hover:text-[var(--accent)] transition-colors"
          >
            <span>Most Read</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal 5-Item Numbered Ranking Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {posts.slice(0, 5).map((post, idx) => (
            <article
              key={post._id || post.slug}
              className="group relative flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-4 sm:p-5 hover:border-[var(--accent)] hover:bg-[var(--color-card-background)] transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-editorial text-3xl font-black tracking-tighter text-[var(--accent)] leading-none">
                    0{idx + 1}
                  </span>
                  {post.category && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] truncate">
                      {post.category.name}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-sm font-bold text-[var(--color-heading)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-3">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" aria-hidden="true" />
                    {post.title}
                  </Link>
                </h3>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--color-muted-text)]">
                {post.readingTime ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min
                  </span>
                ) : (
                  <span>Dispatch</span>
                )}
                <span className="text-[var(--accent)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
