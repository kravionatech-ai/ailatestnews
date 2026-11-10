import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AdjacentPostLink } from "../types";

export function PrevNextArticleNav({
  prevPost,
  nextPost,
}: {
  prevPost?: AdjacentPostLink | null;
  nextPost?: AdjacentPostLink | null;
}) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav
      aria-label="Previous and next articles"
      className="mt-10 pt-8 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {prevPost ? (
        <Link
          href={`/blog/${prevPost.slug}`}
          className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 hover:border-[var(--accent)] transition-all"
        >
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] group-hover:text-[var(--accent)] mb-2">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Previous Article</span>
          </div>
          <span className="font-display text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] leading-snug line-clamp-2">
            {prevPost.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextPost && (
        <Link
          href={`/blog/${nextPost.slug}`}
          className="group flex flex-col justify-between text-left sm:text-right rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 hover:border-[var(--accent)] transition-all"
        >
          <div className="flex items-center sm:justify-end gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] group-hover:text-[var(--accent)] mb-2">
            <span>Next Article</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
          <span className="font-display text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] leading-snug line-clamp-2">
            {nextPost.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
