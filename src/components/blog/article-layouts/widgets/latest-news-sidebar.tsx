import Link from "next/link";
import { Clock, Newspaper, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { RelatedPostItem } from "../types";

export function LatestNewsSidebarWidget({
  posts = [],
}: {
  posts?: RelatedPostItem[];
}) {
  if (!posts.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading)] mb-4 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span>Latest News</span>
        </div>
        <Link
          href="/archive"
          className="text-[10px] text-[var(--accent)] hover:underline font-bold"
        >
          All →
        </Link>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {posts.slice(0, 5).map((item) => (
          <article key={item._id || item.slug} className="py-3 first:pt-0 last:pb-0 group">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider mb-1">
              <span className="font-bold text-[var(--accent)] truncate">
                {item.category?.name || "Dispatch"}
              </span>
              {item.publishedAt && (
                <span className="text-[var(--color-muted-text)] shrink-0">
                  {formatRelativeTime(item.publishedAt)}
                </span>
              )}
            </div>
            <h4 className="font-display text-xs font-bold text-[var(--color-heading)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
              <Link href={`/blog/${item.slug}`}>{item.title}</Link>
            </h4>
            {item.readingTime && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[var(--color-muted-text)]">
                <Clock className="h-3 w-3" />
                <span>{item.readingTime} min read</span>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <Link
          href="/category/ai-news"
          className="flex items-center justify-between text-xs font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors"
        >
          <span>View Full News Desk</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
