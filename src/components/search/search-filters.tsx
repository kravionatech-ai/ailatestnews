"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Check } from "lucide-react";

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
  query,
  activeCategory,
  activeSort,
  categories,
  totalResults,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (catSlug?: string, sortValue?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset pagination on filter change

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-8">
      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          onClick={() => handleFilterChange("")}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            !activeCategory
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Sort Select */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <label htmlFor="search-sort" className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Sort by:
        </label>
        <select
          id="search-sort"
          value={activeSort || "latest"}
          onChange={(e) => handleFilterChange(undefined, e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
        >
          <option value="latest">Latest Dispatches</option>
          <option value="popular">Most Read / Views</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
