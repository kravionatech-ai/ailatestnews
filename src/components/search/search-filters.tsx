"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface CategoryOption {
  name: string;
  slug: string;
  postCount?: number;
}

interface SearchFiltersProps {
  query: string;
  activeCategory: string;
  activeSort: string;
  categories: CategoryOption[];
  totalResults: number;
}

export function SearchFilters({
  activeCategory,
  activeSort,
  categories,
  totalResults,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleFilterChange = (catSlug?: string, sortValue?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (catSlug !== undefined) {
      if (catSlug) params.set("category", catSlug);
      else params.delete("category");
    }

    if (sortValue !== undefined) {
      if (sortValue && sortValue !== "latest") params.set("sort", sortValue);
      else params.delete("sort");
    }

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-8">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <button
          type="button"
          onClick={() => handleFilterChange("")}
          className={`shrink-0 rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
            !activeCategory
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)]"
          }`}
        >
          All Topics {!activeCategory && `(${totalResults})`}
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleFilterChange(cat.slug)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Sort Select */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <label
          htmlFor="search-sort"
          className="font-mono text-xs font-semibold text-[var(--color-muted-text)] flex items-center gap-1"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent)]" />
          Sort:
        </label>
        <select
          id="search-sort"
          value={activeSort || "latest"}
          onChange={(e) => handleFilterChange(undefined, e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] outline-none focus:border-[var(--accent)] cursor-pointer"
        >
          <option value="latest">Latest Dispatches</option>
          <option value="popular">Most Read</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
