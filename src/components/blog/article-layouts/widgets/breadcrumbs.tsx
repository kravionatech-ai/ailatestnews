import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleCategory } from "../types";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  category?: ArticleCategory | null;
  title: string;
  className?: string;
}

export function ArticleBreadcrumbs({ category, title, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-xs text-[var(--color-muted-text)] flex-wrap",
        className
      )}
    >
      <Link href="/" className="hover:text-[var(--color-heading)] transition-colors">
        Home
      </Link>
      <ChevronRight className="h-3 w-3 opacity-60" />
      <Link href="/blog" className="hover:text-[var(--color-heading)] transition-colors">
        Articles
      </Link>
      {category && (
        <>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link
            href={`/category/${category.slug}`}
            className="hover:text-[var(--color-heading)] transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}
      <ChevronRight className="h-3 w-3 opacity-60" />
      <span className="text-[var(--color-body-text)] font-medium max-w-[240px] truncate" title={title}>
        {title}
      </span>
    </nav>
  );
}
