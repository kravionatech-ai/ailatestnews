"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Calendar, Sparkles, Cpu } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  post: {
    _id?: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    coverImageAlt?: string;
    readingTime?: number;
    views?: number;
    publishedAt?: string | Date;
    createdAt?: string | Date;
    tags?: { name: string; slug: string }[] | string[];
    author?: {
      name: string;
      image?: string;
      slug?: string;
    };
    category?: {
      name: string;
      slug: string;
    };
  };
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const dateValue = post.publishedAt || post.createdAt;
  const showViews = typeof post.views === "number" && post.views >= 100;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-indigo-50/70 via-slate-50 to-sky-50/50 border-b border-[var(--border)]">
          {post.coverImage && !imageError ? (
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              unoptimized
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-slate-100 via-indigo-50/40 to-slate-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-indigo-100 text-indigo-600 mb-2">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {post.category?.name || "AI Latest News"}
              </span>
            </div>
          )}

          {featured && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-indigo-600/95 backdrop-blur-xs px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> Featured Story
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6">
          {/* Category & Date */}
          <div className="flex items-center justify-between text-xs mb-3">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 inline-block rounded-lg bg-[var(--accent-light)] px-2.5 py-1 font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            {dateValue && (
              <span className="flex items-center gap-1 text-[var(--foreground-muted)] text-[11px]">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(dateValue)}
              </span>
            )}
          </div>

          {/* Title (H2/H3 for semantic SEO) */}
          <h2
            className={`font-extrabold text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors leading-snug ${
              featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            }`}
          >
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" />
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[var(--foreground-secondary)] line-clamp-2">
            {post.excerpt}
          </p>
        </div>
      </div>

      {/* Footer: Author, Reading Time, and Real Views */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <div className="flex items-center gap-2 relative z-10">
          {post.author?.image ? (
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[var(--border)]">
              <Image
                src={post.author.image}
                alt={post.author.name || "Author"}
                fill
                unoptimized
                className="object-cover"
                sizes="24px"
              />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700 text-[10px]">
              {post.author?.name?.charAt(0) || "A"}
            </div>
          )}
          <span className="font-semibold text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[160px]">
            {post.author?.name || "Editorial Team"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {post.readingTime && (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <Eye className="h-3.5 w-3.5" />
              {post.views!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
