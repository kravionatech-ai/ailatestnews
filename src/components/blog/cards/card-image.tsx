"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsCardPost } from "./types";

interface CardImageProps {
  post: NewsCardPost;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "3:2";
  priority?: boolean;
  sizes?: string;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  imageClassName?: string;
}

const aspectClassMap = {
  "16:9": "aspect-16/9",
  "4:3": "aspect-4/3",
  "1:1": "aspect-square",
  "3:2": "aspect-3/2",
};

export function CardImage({
  post,
  aspectRatio = "16:9",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  showBadge = true,
  badgeText,
  className,
  imageClassName,
}: CardImageProps) {
  const [hasError, setHasError] = useState(false);

  const displayBadge =
    badgeText ||
    (post.isBreaking ? "Breaking" : post.isTrending ? "Trending" : post.category?.name);

  const badgeBg = post.isBreaking
    ? "bg-[var(--color-breaking-news)] text-white"
    : post.isTrending
    ? "bg-[var(--color-trending)] text-white"
    : "bg-[var(--color-primary-accent)] text-white";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[var(--color-secondary-surface)] border-b border-[var(--color-border)]",
        aspectClassMap[aspectRatio],
        className
      )}
    >
      {post.coverImage && !hasError ? (
        <Image
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          fill
          priority={priority}
          sizes={sizes}
          onError={() => setHasError(true)}
          className={cn(
            "object-cover transition-transform duration-500 ease-out group-hover:scale-105",
            imageClassName
          )}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[var(--color-muted-text)]">
          <BookOpen className="h-8 w-8 mb-2 opacity-60" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
            {post.category?.name || "Kraviona AI News"}
          </span>
        </div>
      )}

      {showBadge && displayBadge && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {post.category?.slug ? (
            <Link
              href={`/category/${post.category.slug}`}
              className={cn(
                "rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90 shadow-xs",
                badgeBg
              )}
            >
              {displayBadge}
            </Link>
          ) : (
            <span
              className={cn(
                "rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-xs",
                badgeBg
              )}
            >
              {displayBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
