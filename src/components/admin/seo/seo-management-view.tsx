"use client";

import { useState } from "react";
import { Globe, ListOrdered } from "lucide-react";
import { SeoControlCenter } from "@/components/admin/seo/seo-control-center";
import { SeoHub, type SeoInventoryItem } from "@/components/admin/seo/seo-hub";
import type { ISeoSettings } from "@/lib/db/models/seo-settings.model";

interface SeoManagementViewProps {
  initialSettings: ISeoSettings;
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    noindexPosts: number;
    totalCategories: number;
    totalPages: number;
    noindexPages: number;
    totalIndexableUrls: number;
    totalUrlsInSitemap: number;
    newsArticlesCount: number;
    sitemapLastGenerated?: string | Date;
    robotsLastPublished?: string | Date;
    lastError?: string;
  };
  indexingItems: Array<{
    id: string;
    title: string;
    slug: string;
    route: string;
    type: "post" | "category" | "page" | "tag";
    status?: string;
    index: boolean;
    follow: boolean;
  }>;
  inventoryItems: SeoInventoryItem[];
  defaultView?: "control-center" | "bulk";
}

export function SeoManagementView({
  initialSettings,
  stats,
  indexingItems,
  inventoryItems,
  defaultView = "control-center",
}: SeoManagementViewProps) {
  const [activeView, setActiveView] = useState<"control-center" | "bulk">(defaultView);

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic Engine Active
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">Next.js 16 App Router</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            SEO & Search Architecture
          </h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Configure dynamic XML sitemaps, robots.txt, Google News feed, per-page indexing directives, and crawler discovery.
          </p>
        </div>

        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveView("control-center")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeView === "control-center"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="h-4 w-4" />
            SEO Control Center
          </button>
          <button
            type="button"
            onClick={() => setActiveView("bulk")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeView === "bulk"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            Bulk Meta Editor
          </button>
        </div>
      </div>

      {activeView === "control-center" ? (
        <SeoControlCenter
          initialSettings={initialSettings}
          stats={stats}
          inventoryItems={indexingItems}
        />
      ) : (
        <SeoHub items={inventoryItems} />
      )}
    </div>
  );
}
