"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Calendar, ArrowRight } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { CardImage } from "./card-image";
import type { NewsCardBaseProps } from "./types";

export function LargeFeaturedCard({
  post,
  aspectRatio = "16:9",
  showBadges = true,
  showAuthorAvatar = true,
  showReadingTime = true,
  showViewsCount = true,
  showExcerpt = true,
  showDate = true,
  priorityImage = true,
  className,
}: NewsCardBaseProps) {
  const dateVal = post.publishedAt || post.createdAt;
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden",
        "bg-[var(--color-card-background)] border border-[var(--color-border)] rounded-[var(--radius-card)]",
        "shadow-xs hover:shadow-md hover:border-[var(--color-primary-accent)] transition-all duration-300",
        className
      )}
    >
      <div>
        <CardImage
          post={post}
          aspectRatio={aspectRatio}
          priority={priorityImage}
          showBadge={showBadges}
          badgeText="Lead Investigation"
          sizes="(max-width: 1024px) 100vw, 75vw"
        />

        <div className="p-6 sm:p-8 lg:p-10">
          {/* Kicker Row */}
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-[var(--color-muted-text)] mb-3">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 font-bold text-[var(--color-primary-accent)] hover:underline"
              >
                {post.category.name}
              </Link>
            )}
            {showDate && dateVal && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={new Date(dateVal).toISOString()}>{formatDate(dateVal)}</time>
                </span>
              </>
            )}
            {showReadingTime && post.readingTime && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 normal-case font-sans">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </span>
              </>
            )}
          </div>

          {/* Prominent Typography */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] tracking-tight leading-[1.15] transition-colors">
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className="mt-4 text-base sm:text-lg text-[var(--color-body-text)] leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Author Byline & CTA */}
      <div className="px-6 pb-6 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
        <div className="flex items-center gap-3 relative z-10">
          {showAuthorAvatar && (
            post.author?.image ? (
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-full border border-[var(--color-border)]">
                <Image
                  src={post.author.image}
                  alt={post.author.name || "Author"}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[var(--color-secondary-surface)] font-bold text-[var(--color-heading)] text-xs font-mono">
                {post.author?.name?.charAt(0) || "AI"}
              </div>
            )
          )}
          <div>
            {post.author?.slug ? (
              <Link
                href={`/author/${post.author.slug}`}
                className="font-bold text-[var(--color-heading)] text-sm hover:text-[var(--color-primary-accent)] transition-colors block leading-tight"
              >
                {post.author.name || "Editorial Staff"}
              </Link>
            ) : (
              <span className="font-bold text-[var(--color-heading)] text-sm block leading-tight">
                {post.author?.name || "Editorial Staff"}
              </span>
            )}
            <span className="text-[11px] text-[var(--color-muted-text)]">Senior Technology Desk</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showViews && (
            <span className="hidden sm:flex items-center gap-1 text-[11px]">
              <Eye className="h-3.5 w-3.5" />
              {post.views!.toLocaleString()} reads
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary-accent)] group-hover:translate-x-1 transition-transform">
            <span>Read Story</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
