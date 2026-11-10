"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { CardImage } from "./card-image";
import type { NewsCardBaseProps } from "./types";

export function ClassicEditorialCard({
  post,
  aspectRatio = "16:9",
  showBadges = true,
  showAuthorAvatar = true,
  showReadingTime = true,
  showViewsCount = true,
  showExcerpt = true,
  showDate = true,
  priorityImage = false,
  className,
}: NewsCardBaseProps) {
  const dateVal = post.publishedAt || post.createdAt;
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden",
        "border border-[var(--color-border)] bg-[var(--color-card-background)] rounded-[var(--radius-card)]",
        "shadow-2xs transition-all duration-300 hover:border-[var(--color-primary-accent)] hover:shadow-sm",
        className
      )}
    >
      <div>
        <CardImage
          post={post}
          aspectRatio={aspectRatio}
          priority={priorityImage}
          showBadge={showBadges}
        />

        <div className="p-5 sm:p-6">
          {/* Metadata Row: Category & Date */}
          <div className="flex items-center justify-between text-xs mb-3">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-accent)] hover:underline"
              >
                {post.category.name}
              </Link>
            )}
            {showDate && dateVal && (
              <span className="flex items-center gap-1 text-[var(--color-muted-text)] text-[11px]">
                <Calendar className="h-3 w-3" />
                <time dateTime={new Date(dateVal).toISOString()}>{formatDate(dateVal)}</time>
              </span>
            )}
          </div>

          {/* Headline with Serif Authority */}
          <h3 className="font-serif font-black tracking-tight leading-snug text-lg sm:text-xl text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] transition-colors">
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {post.title}
            </Link>
          </h3>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[var(--color-body-text)] line-clamp-2 sm:line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Footer Byline */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
        <div className="flex items-center gap-2 relative z-10">
          {showAuthorAvatar && (
            post.author?.image ? (
              <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[var(--color-border)]">
                <Image
                  src={post.author.image}
                  alt={post.author.name || "Author"}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary-surface)] font-bold text-[var(--color-heading)] text-[10px]">
                {post.author?.name?.charAt(0) || "A"}
              </div>
            )
          )}
          {post.author?.slug ? (
            <Link
              href={`/author/${post.author.slug}`}
              className="font-semibold text-[var(--color-heading)] hover:text-[var(--color-primary-accent)] transition-colors truncate max-w-[120px] sm:max-w-[160px]"
            >
              {post.author.name || "Editorial Staff"}
            </Link>
          ) : (
            <span className="font-semibold text-[var(--color-heading)] truncate max-w-[120px] sm:max-w-[160px]">
              {post.author?.name || "Editorial Staff"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showReadingTime && post.readingTime && (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3" />
              {post.readingTime} min
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Eye className="h-3 w-3" />
              {post.views!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
