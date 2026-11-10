import Link from "next/link";
import { NewsCard } from "@/components/blog/cards/news-card";
import { RelatedPostItem } from "../types";
import { cn } from "@/lib/utils";

interface RelatedPostsProps {
  relatedPosts?: RelatedPostItem[];
  title?: string;
  className?: string;
}

export function RelatedPostsGrid({
  relatedPosts = [],
  title = "Recommended Reading",
  className = "",
}: RelatedPostsProps) {
  if (!relatedPosts || relatedPosts.length === 0) return null;

  return (
    <section className={cn("mt-16 pt-12 border-t border-[var(--color-border)]", className)} aria-label="Related Dispatches">
      <div className="flex items-end justify-between mb-8 pb-3 border-b border-[var(--color-heading)]">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] block mb-1">
            Related Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading)]">
            {title}
          </h2>
        </div>
        <Link
          href="/blog"
          className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] hover:text-[var(--color-primary-accent)] transition-colors"
        >
          All Articles →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {relatedPosts.map((r) => (
          <NewsCard key={r._id || r.slug} post={r as any} variant="classic-editorial" />
        ))}
      </div>
    </section>
  );
}

export default RelatedPostsGrid;
