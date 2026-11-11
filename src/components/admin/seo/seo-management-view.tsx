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
    customUrlsCount?: number;
    feedItemsCount?: number;
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic Engine Active
            </span>
            <span className="text-xs font-mono text-[var(--color-muted-text)]">Next.js 16 App Router</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-heading)] mt-1">
            SEO &amp; Search Architecture
          </h1>
          <p className="text-xs text-[var(--color-muted-text)]">
            Configure dynamic XML sitemaps, robots.txt, Google News feed, per-page indexing directives, and crawler discovery.
          </p>
        </div>

        <div className="inline-flex items-center rounded-xl bg-[var(--color-secondary-surface)] p-1 border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveView("control-center")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "control-center"
                ? "bg-[var(--color-card-background)] text-[var(--accent)] shadow-xs"
                : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
            }`}
          >
            <Globe className="h-4 w-4" />
            SEO Control Center
          </button>
          <button
            type="button"
            onClick={() => setActiveView("bulk")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "bulk"
                ? "bg-[var(--color-card-background)] text-[var(--accent)] shadow-xs"
                : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
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
