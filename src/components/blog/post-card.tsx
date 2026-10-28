"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Calendar, BookOpen } from "lucide-react";
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
  const showViews = typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs transition-all duration-300 hover:border-slate-400 hover:shadow-sm ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
          {post.coverImage && !imageError ? (
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              unoptimized
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-100 text-slate-400">
              <BookOpen className="h-8 w-8 mb-2" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {post.category?.name || "AI Latest News"}
              </span>
            </div>
          )}

          {featured && (
            <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-slate-900/90 backdrop-blur-xs px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              Lead Feature
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
                className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700 hover:text-indigo-600 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            {dateValue && (
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Calendar className="h-3 w-3" />
                {formatDate(dateValue)}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className={`font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug ${
              featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            }`}
          >
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" />
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-2">
            {post.excerpt}
          </p>
        </div>
      </div>

      {/* Footer: Author, Reading Time, and Views */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 relative z-10">
          {post.author?.image ? (
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-slate-200">
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
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-800 text-[10px]">
              {post.author?.name?.charAt(0) || "A"}
            </div>
          )}
          <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-[160px]">
            {post.author?.name || "Editorial Staff"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {post.readingTime && (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3" />
              {post.readingTime} min
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Eye className="h-3 w-3" />
              {post.views!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
