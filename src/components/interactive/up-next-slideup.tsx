"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, X, Sparkles } from "lucide-react";

interface UpNextProps {
  currentSlug: string;
  nextPost?: {
    title: string;
    slug: string;
    excerpt?: string;
    coverImage?: string;
    readingTime?: number;
    category?: {
      name: string;
      slug: string;
    };
  } | null;
}

export function UpNextSlideup({ currentSlug, nextPost }: UpNextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!nextPost || isDismissed) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = window.scrollY / scrollHeight;

      // Show when user passes 65% scroll depth
      if (progress > 0.65 && !isDismissed) {
        setIsVisible(true);
      } else if (progress < 0.4) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextPost, isDismissed]);

  if (!nextPost || isDismissed || !isVisible) return null;

  return (
    <aside
      aria-label="Next recommended article"
      className="hidden sm:block fixed bottom-20 right-5 z-40 max-w-sm w-full animate-in slide-in-from-bottom-6 duration-300 shadow-xl rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-[var(--color-card-background)] p-4"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
          <Sparkles className="h-3 w-3" />
          <span>Up Next Dispatch</span>
        </span>
        <button
          onClick={() => {
            setIsDismissed(true);
            setIsVisible(false);
          }}
          className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] transition-colors p-1 cursor-pointer"
          aria-label="Dismiss up next preview"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link
        href={`/blog/${nextPost.slug}`}
        className="group flex gap-3 items-start"
      >
        {nextPost.coverImage && (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--color-secondary-surface)] border border-[var(--border)]">
            <Image
              src={nextPost.coverImage}
              alt={nextPost.title}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          {nextPost.category && (
            <span className="block font-mono text-[9px] font-bold uppercase text-[var(--color-muted-text)]">
              {nextPost.category.name}
            </span>
          )}
          <h5 className="text-xs font-bold text-[var(--color-heading)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors">
            {nextPost.title}
          </h5>
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-[var(--accent)] pt-0.5">
            <span>Continue Reading</span>
            <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </aside>
  );
}
