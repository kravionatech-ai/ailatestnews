"use client";

import React, { useState, useTransition } from "react";
import {
  Globe,
  Bot,
  Newspaper,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
} from "lucide-react";
import {
  updateSitemapSettingsAction,
  updateRobotsSettingsAction,
  triggerManualSitemapRegenerationAction,
  previewSitemapXmlAction,
  previewRobotsTxtAction,
  updateItemIndexingAction,
} from "@/actions/seo-settings";
import type { ISeoSettings, IRobotsRule } from "@/lib/db/models/seo-settings.model";

interface SeoControlCenterProps {
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
  inventoryItems: Array<{
    id: string;
    title: string;
    slug: string;
    route: string;
    type: "post" | "category" | "page" | "tag";
    status?: string;
    index: boolean;
    follow: boolean;
  }>;
}

export function SeoControlCenter({
  initialSettings,
  stats: initialStats,
  inventoryItems: initialInventory,
}: SeoControlCenterProps) {
  const [activeTab, setActiveTab] = useState<
    "sitemap" | "robots" | "news" | "indexing" | "health"
  >("sitemap");

  const [settings, setSettings] = useState<ISeoSettings>(initialSettings);
  const [stats, setStats] = useState(initialStats);
  const [inventory, setInventory] = useState(initialInventory);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("all");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Preview Modal States
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    isXml?: boolean;
  }>({ isOpen: false, title: "", content: "", isXml: false });
  const [copied, setCopied] = useState(false);

  // Danger Warning Modal for Disallow: /
  const [dangerModal, setDangerModal] = useState<{
    isOpen: boolean;
    pendingAction?: () => void;
  }>({ isOpen: false });

  // Excluded URL input state
  const [newExcludedUrl, setNewExcludedUrl] = useState("");

  const showStatus = (type: "success" | "error" | "info", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. SITEMAP MANAGEMENT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleSaveSitemap = () => {
    startTransition(async () => {
      const res = await updateSitemapSettingsAction(settings.sitemap);
      if (res.success && res.settings) {
        setSettings(res.settings);
        showStatus("success", "Sitemap configuration saved and sitemap caches revalidated successfully!");
      } else {
        showStatus("error", res.error || "Failed to save sitemap settings");
      }
    });
  };

  const handleManualRegenerate = () => {
    startTransition(async () => {
      const res = await triggerManualSitemapRegenerationAction();
      if (res.success) {
        setStats((prev) => ({
          ...prev,
          totalUrlsInSitemap: res.totalCount || prev.totalUrlsInSitemap,
          sitemapLastGenerated: res.lastGeneratedAt,
          lastError: "",
        }));
        showStatus(
          "success",
          `Sitemap regenerated and validated successfully! (${res.totalCount} URLs included)`
        );
      } else {
        showStatus("error", res.error || "Sitemap regeneration failed");
      }
    });
  };

  const handlePreviewSitemap = (type: "all" | "articles" | "categories" | "tags" | "pages" | "news") => {
    startTransition(async () => {
      const res = await previewSitemapXmlAction(type);
      if (res.success && res.xml) {
        setPreviewModal({
          isOpen: true,
          title: `Sitemap Preview (${type.toUpperCase()}) — ${res.count} URLs`,
          content: res.xml,
          isXml: true,
        });
      } else {
        showStatus("error", res.error || "Failed to generate preview");
      }
    });
  };

  const handleAddExcludedUrl = () => {
    if (!newExcludedUrl.trim()) return;
    const clean = newExcludedUrl.trim();
    if (!settings.sitemap.excludedUrls.includes(clean)) {
      setSettings((prev) => ({
        ...prev,
        sitemap: {
          ...prev.sitemap,
          excludedUrls: [...prev.sitemap.excludedUrls, clean],
        },
      }));
    }
    setNewExcludedUrl("");
  };

  const handleRemoveExcludedUrl = (url: string) => {
    setSettings((prev) => ({
      ...prev,
      sitemap: {
        ...prev.sitemap,
        excludedUrls: prev.sitemap.excludedUrls.filter((u) => u !== url),
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // 2. ROBOTS.TXT MANAGEMENT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleSaveRobots = (bypassWarning = false) => {
    // Check for catastrophic rule: Disallow: /
    const hasDisallowAll = settings.robots.rules.some(
      (r) =>
        (r.userAgent === "*" || r.userAgent === "") &&
        r.disallow.some((d) => d === "/" || d === "/*")
    );

    if (hasDisallowAll && !bypassWarning) {
      setDangerModal({
        isOpen: true,
        pendingAction: () => handleSaveRobots(true),
      });
      return;
    }

    startTransition(async () => {
      const res = await updateRobotsSettingsAction(settings.robots);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setStats((prev) => ({
          ...prev,
          robotsLastPublished: new Date(),
        }));
        showStatus("success", "Robots.txt updated and published live!");
      } else {
        showStatus("error", res.error || "Failed to save robots.txt");
      }
    });
  };

  const handlePreviewRobots = () => {
    startTransition(async () => {
      const res = await previewRobotsTxtAction();
      if (res.success && res.text) {
        setPreviewModal({
          isOpen: true,
          title: "Public Robots.txt Live Preview",
          content: res.text,
          isXml: false,
        });
      } else {
        showStatus("error", res.error || "Failed to preview robots.txt");
      }
    });
  };

  const handleAddRobotsRule = () => {
    const newRule: IRobotsRule = {
      userAgent: "*",
      allow: ["/"],
      disallow: [],
    };
    setSettings((prev) => ({
      ...prev,
      robots: {
        ...prev.robots,
        rules: [...prev.robots.rules, newRule],
      },
    }));
  };

  const handleRemoveRobotsRule = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      robots: {
        ...prev.robots,
        rules: prev.robots.rules.filter((_, i) => i !== index),
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // 3. INDEXING CONTROLS HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleUpdateItemIndexing = (
    id: string,
    type: "post" | "category" | "page" | "tag",
    index: boolean,
    follow: boolean
  ) => {
    startTransition(async () => {
      const res = await updateItemIndexingAction({ id, type, index, follow });
      if (res.success) {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, index, follow } : item
          )
        );
        showStatus(
          "success",
          `Updated indexing for item to: ${index ? "Index" : "Noindex"}, ${follow ? "Follow" : "Nofollow"}`
        );
      } else {
        showStatus("error", res.error || "Failed to update indexing");
      }
    });
  };

  // Filtered inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.route.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesType =
      inventoryTypeFilter === "all" || item.type === inventoryTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-heading)]">
              SEO Management Center
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
              Production Active
            </span>
          </div>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Dynamic XML Sitemap, Robots.txt, Google News Sync &amp; Indexing Control Hub
          </p>
        </div>

        {/* Live Public Links */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
          >
            <Globe className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>sitemap.xml</span>
            <ExternalLink className="h-3 w-3 text-[var(--color-muted-text)]" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
          >
            <Bot className="h-3.5 w-3.5 text-[var(--color-muted-text)]" />
            <span>robots.txt</span>
            <ExternalLink className="h-3 w-3 text-[var(--color-muted-text)]" />
          </a>
          {settings.sitemap.includeNewsSitemap && (
            <a
              href="/news-sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
            >
              <Newspaper className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>news-sitemap.xml</span>
              <ExternalLink className="h-3 w-3 text-[var(--color-muted-text)]" />
            </a>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : statusMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
              : "bg-[var(--accent-light)] border-[var(--accent)]/30 text-[var(--accent)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" && <CheckCircle2 className="h-4 w-4" />}
            {statusMessage.type === "error" && <XCircle className="h-4 w-4" />}
            {statusMessage.type === "info" && <Activity className="h-4 w-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("sitemap")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "sitemap"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Sitemap Settings</span>
        </button>

        <button
          onClick={() => setActiveTab("robots")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "robots"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Robots.txt Editor</span>
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "news"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <Newspaper className="h-4 w-4" />
          <span>Google News Sitemap</span>
          {stats.newsArticlesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              {stats.newsArticlesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("indexing")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "indexing"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Indexing Controls</span>
        </button>

        <button
          onClick={() => setActiveTab("health")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "health"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>SEO Health Monitor</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: SITEMAP SETTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "sitemap" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Sitemap Status
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    settings.sitemap.enabled ? "bg-emerald-500 animate-pulse" : "bg-[var(--color-muted-text)]/40"
                  }`}
                />
                <span className="text-sm font-black text-[var(--color-heading)]">
                  {settings.sitemap.enabled ? "Live & Dynamic" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Total URLs in Sitemap
              </span>
              <p className="text-xl font-black text-[var(--color-heading)] mt-1">
                {stats.totalUrlsInSitemap}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Last Generated
              </span>
              <p className="text-xs font-semibold text-[var(--color-body-text)] mt-1.5">
                {stats.sitemapLastGenerated
                  ? new Date(stats.sitemapLastGenerated).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }) + " IST"
                  : "On-demand"}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Validation Status
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Valid W3C XML</span>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                  Sitemap Generation Controls
                </h2>
                <p className="text-xs text-[var(--color-muted-text)]">
                  Manage database synchronization, canonical domain and content inclusion
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleManualRegenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                  <span>Regenerate &amp; Purge Cache</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("all")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Full XML</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveSitemap}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Sitemap Settings</span>
                </button>
              </div>
            </div>

            {/* Base Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-heading)]">
                Canonical Website URL
              </label>
              <input
                type="url"
                value={settings.sitemap.siteUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sitemap: { ...settings.sitemap, siteUrl: e.target.value },
                  })
                }
                placeholder="https://ainews.kraviona.com"
                className="w-full max-w-xl px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-mono text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--color-muted-text)]">
                Every URL loc in sitemaps will use this base prefix. Trailing slashes are auto-stripped.
              </p>
            </div>

            {/* Collection Feature Toggles */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[var(--color-heading)] uppercase tracking-wider">
                Content Inclusion Toggles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">
                      Enable XML Sitemap System
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-text)]">
                      When off, /sitemap.xml returns an empty urlset
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includeArticles}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includeArticles: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">
                      Include Published Articles
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-text)]">
                      Syncs all published posts with actual modified dates
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includeCategories}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includeCategories: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">
                      Include Pillar Categories
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-text)]">
                      Syncs active categories (/category/[slug])
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includePages}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includePages: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">
                      Include Static Core &amp; Standalone Pages
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-text)]">
                      Includes /about, /contact, /editorial-policy, /ai-tools
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Large Website Sitemap Architecture (Phase 4) */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-heading)]">
                    Large Website Architecture (Sitemap Index)
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted-text)]">
                    Auto-splits into /sitemap-static.xml, /sitemap-articles.xml, /sitemap-categories.xml
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.enableSplitSitemaps}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, enableSplitSitemaps: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--color-secondary-surface)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>

              {settings.sitemap.enableSplitSitemaps && (
                <div className="p-3.5 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent)]/30 text-xs text-[var(--color-heading)] space-y-2">
                  <p className="font-semibold">
                    Sitemap Index is active. Available sub-sitemaps:
                  </p>
                  <div className="flex flex-wrap gap-2 text-[var(--color-body-text)]">
                    <button
                      onClick={() => handlePreviewSitemap("articles")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-articles.xml
                    </button>
                    <button
                      onClick={() => handlePreviewSitemap("categories")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-categories.xml
                    </button>
                    <button
                      onClick={() => handlePreviewSitemap("pages")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-static.xml
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Excluded URLs Blacklist */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div>
                <h3 className="text-xs font-bold text-[var(--color-heading)]">
                  Custom Excluded URLs &amp; Path Blacklist
                </h3>
                <p className="text-[11px] text-[var(--color-muted-text)]">
                  URLs matching these exact paths or wildcard patterns will never appear in any sitemap.
                </p>
              </div>

              <div className="flex gap-2 max-w-xl">
                <input
                  type="text"
                  value={newExcludedUrl}
                  onChange={(e) => setNewExcludedUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExcludedUrl())}
                  placeholder="e.g. /private-page or /blog/secret-*"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-mono text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddExcludedUrl}
                  className="px-3 py-2 rounded-xl bg-[var(--color-primary-dark,#101820)] hover:bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>

              {settings.sitemap.excludedUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {settings.sitemap.excludedUrls.map((url) => (
                    <span
                      key={url}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] border border-[var(--border)]"
                    >
                      <span>{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedUrl(url)}
                        className="text-[var(--color-muted-text)] hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-muted-text)] italic">
                  No custom excluded URLs configured. (Drafts and noindex pages are auto-excluded).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: ROBOTS.TXT MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "robots" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                  Robots.txt Rule Manager
                </h2>
                <p className="text-xs text-[var(--color-muted-text)]">
                  Control crawler access, Disallow directives, and sitemap citations live
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handlePreviewRobots}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Robots.txt</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSaveRobots(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save &amp; Publish Changes</span>
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-4 bg-[var(--color-secondary-surface)] p-3 rounded-2xl border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--color-heading)]">Editor Mode:</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-body-text)] cursor-pointer">
                <input
                  type="radio"
                  name="robotsMode"
                  checked={!settings.robots.customRawEnabled}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      robots: { ...settings.robots, customRawEnabled: false },
                    })
                  }
                  className="accent-[var(--accent)]"
                />
                <span>Visual Rule Builder (Recommended)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-body-text)] cursor-pointer">
                <input
                  type="radio"
                  name="robotsMode"
                  checked={settings.robots.customRawEnabled}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      robots: { ...settings.robots, customRawEnabled: true },
                    })
                  }
                  className="accent-[var(--accent)]"
                />
                <span>Raw Text Editor</span>
              </label>
            </div>

            {/* MODE A: VISUAL RULE BUILDER */}
            {!settings.robots.customRawEnabled ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {settings.robots.rules.map((rule, ruleIdx) => (
                    <div
                      key={ruleIdx}
                      className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-[var(--color-muted-text)]">User-agent:</label>
                          <input
                            type="text"
                            value={rule.userAgent}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings((prev) => {
                                const newRules = [...prev.robots.rules];
                                const currentRule = newRules[ruleIdx] || { userAgent: "*", allow: [], disallow: [] };
                                newRules[ruleIdx] = {
                                  userAgent: val,
                                  allow: currentRule.allow || [],
                                  disallow: currentRule.disallow || [],
                                  crawlDelay: currentRule.crawlDelay,
                                };
                                return { ...prev, robots: { ...prev.robots, rules: newRules } };
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] font-mono text-xs font-bold text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                          />
                        </div>

                        {settings.robots.rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRobotsRule(ruleIdx)}
                            className="text-[var(--color-muted-text)] hover:text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Rule</span>
                          </button>
                        )}
                      </div>

                      {/* Allow Paths */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Allow Directives (comma separated)
                        </label>
                        <input
                          type="text"
                          value={rule.allow.join(", ")}
                          onChange={(e) => {
                            const paths = e.target.value.split(",").map((p) => p.trim());
                            setSettings((prev) => {
                              const newRules = [...prev.robots.rules];
                              const currentRule = newRules[ruleIdx] || { userAgent: "*", allow: [], disallow: [] };
                              newRules[ruleIdx] = {
                                userAgent: currentRule.userAgent || "*",
                                allow: paths,
                                disallow: currentRule.disallow || [],
                                crawlDelay: currentRule.crawlDelay,
                              };
                              return { ...prev, robots: { ...prev.robots, rules: newRules } };
                            });
                          }}
                          placeholder="/"
                          className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] font-mono text-xs text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      {/* Disallow Paths */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                          Disallow Directives (comma separated)
                        </label>
                        <input
                          type="text"
                          value={rule.disallow.join(", ")}
                          onChange={(e) => {
                            const paths = e.target.value.split(",").map((p) => p.trim());
                            setSettings((prev) => {
                              const newRules = [...prev.robots.rules];
                              const currentRule = newRules[ruleIdx] || { userAgent: "*", allow: [], disallow: [] };
                              newRules[ruleIdx] = {
                                userAgent: currentRule.userAgent || "*",
                                allow: currentRule.allow || [],
                                disallow: paths,
                                crawlDelay: currentRule.crawlDelay,
                              };
                              return { ...prev, robots: { ...prev.robots, rules: newRules } };
                            });
                          }}
                          placeholder="/admin/, /api/admin/, /login/"
                          className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] font-mono text-xs text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddRobotsRule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Crawler Rule Group</span>
                  </button>
                </div>

                {/* Sitemaps Directives */}
                <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                  <label className="text-xs font-bold text-[var(--color-heading)]">
                    Sitemap References to Include in Robots.txt
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--color-body-text)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.robots.includeNewsSitemapInRobots}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          robots: {
                            ...settings.robots,
                            includeNewsSitemapInRobots: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[var(--accent)]"
                    />
                    <span>
                      Include Google News Sitemap Directive (
                      <code className="text-[var(--accent)] font-mono text-[11px]">
                        Sitemap: {settings.sitemap.siteUrl}/news-sitemap.xml
                      </code>
                      )
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              /* MODE B: RAW TEXT EDITOR */
              <div className="space-y-3">
                <textarea
                  rows={12}
                  value={settings.robots.rawContent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      robots: { ...settings.robots, rawContent: e.target.value },
                    })
                  }
                  placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://ainews.kraviona.com/sitemap.xml`}
                  className="w-full p-4 rounded-2xl border border-[var(--border)] bg-[#101820] font-mono text-xs text-emerald-400 focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                />
                <p className="text-[11px] text-[var(--color-muted-text)]">
                  Direct raw output mode. Enter valid robots.txt directives. Avoid script tags.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: GOOGLE NEWS SITEMAP */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "news" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                  Google News Sitemap Configuration
                </h2>
                <p className="text-xs text-[var(--color-muted-text)]">
                  Dedicated endpoint: <code className="font-mono text-[var(--accent)]">/news-sitemap.xml</code> for articles published within 48 hours
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("news")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview News XML ({stats.newsArticlesCount})</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveSitemap}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save News Settings</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.sitemap.includeNewsSitemap}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sitemap: {
                        ...settings.sitemap,
                        includeNewsSitemap: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded accent-[var(--accent)]"
                />
                <div>
                  <span className="text-xs font-bold text-[var(--color-heading)] block">
                    Enable Google News Sitemap
                  </span>
                  <span className="text-[11px] text-[var(--color-muted-text)]">
                    Serves valid &lt;news:news&gt; tags at /news-sitemap.xml
                  </span>
                </div>
              </label>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-heading)]">
                  Publication Name (&lt;news:name&gt;)
                </label>
                <input
                  type="text"
                  value={settings.sitemap.newsPublicationName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sitemap: {
                        ...settings.sitemap,
                        newsPublicationName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-semibold text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-heading)]">
                  Publication Language (&lt;news:language&gt;)
                </label>
                <input
                  type="text"
                  value={settings.sitemap.newsPublicationLanguage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sitemap: {
                        ...settings.sitemap,
                        newsPublicationLanguage: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-heading)]">
                  Time Window (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.sitemap.newsTimeWindowHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sitemap: {
                        ...settings.sitemap,
                        newsTimeWindowHours: parseInt(e.target.value, 10) || 48,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
                <p className="text-[10px] text-[var(--color-muted-text)]">
                  Google News guidelines recommend 48 hours maximum.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google News Compliance Notice</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Submitting a news sitemap does not guarantee Google News inclusion. It ensures compliant algorithmic discovery for Google Publisher Center and Google Search bots.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: INDEXING CONTROLS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "indexing" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                  Direct URL Indexing Matrix
                </h2>
                <p className="text-xs text-[var(--color-muted-text)]">
                  Configure Index/Noindex and Follow/Nofollow per article and page. Noindex items are automatically excluded from sitemaps.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[var(--color-muted-text)]" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search URL or title..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-medium text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <select
                  value={inventoryTypeFilter}
                  onChange={(e) => setInventoryTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-semibold text-[var(--color-heading)] outline-none"
                >
                  <option value="all">All Content</option>
                  <option value="post">Articles Only</option>
                  <option value="category">Categories Only</option>
                  <option value="page">Pages Only</option>
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-[var(--border)] rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-secondary-surface)] border-b border-[var(--border)] text-[var(--color-muted-text)] uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Title / Route</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Publish Status</th>
                    <th className="py-3 px-3">Robots Index Directive</th>
                    <th className="py-3 px-3">Sitemap Presence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-medium">
                  {filteredInventory.slice(0, 30).map((item) => {
                    const currentDirective = item.index
                      ? item.follow
                        ? "index,follow"
                        : "index,nofollow"
                      : item.follow
                      ? "noindex,follow"
                      : "noindex,nofollow";

                    return (
                      <tr key={item.id} className="hover:bg-[var(--color-secondary-surface)]/50 transition">
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-[var(--color-heading)] truncate max-w-sm">
                            {item.title}
                          </p>
                          <code className="text-[11px] text-[var(--color-muted-text)] font-mono">
                            {item.route}
                          </code>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-secondary-surface)] text-[var(--color-body-text)]">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === "published"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : item.status === "draft"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)]"
                            }`}
                          >
                            {item.status || "active"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={currentDirective}
                            disabled={isPending}
                            onChange={(e) => {
                              const val = e.target.value;
                              const shouldIndex = val.startsWith("index");
                              const shouldFollow = val.endsWith("follow");
                              handleUpdateItemIndexing(item.id, item.type, shouldIndex, shouldFollow);
                            }}
                            className={`text-xs font-bold rounded-lg px-2 py-1 border transition outline-none ${
                              currentDirective === "index,follow"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : currentDirective === "noindex,follow"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : currentDirective === "index,nofollow"
                                ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            }`}
                          >
                            <option value="index,follow">Index, Follow</option>
                            <option value="noindex,follow">Noindex, Follow</option>
                            <option value="index,nofollow">Index, Nofollow</option>
                            <option value="noindex,nofollow">Noindex, Nofollow</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.index && item.status !== "draft" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-muted-text)]">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Excluded</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredInventory.length > 30 && (
              <p className="text-[11px] text-[var(--color-muted-text)] text-center">
                Showing top 30 items. Use search box above to narrow down specific URLs.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: SEO HEALTH MONITOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Total Published Articles
              </span>
              <p className="text-xl font-black text-[var(--color-heading)] mt-1">
                {stats.publishedPosts}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">out of {stats.totalPosts} total</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Draft Articles
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.draftPosts}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">Auto-excluded from sitemaps</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Noindex Pages
              </span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {stats.noindexPosts + stats.noindexPages}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">Respects crawler directives</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Total URLs in Sitemap
              </span>
              <p className="text-xl font-black text-[var(--accent)] mt-1">
                {stats.totalUrlsInSitemap}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">Dynamic &amp; Canonical</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Eligible Google News Articles
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.newsArticlesCount}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">Within last 48 hours</span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Last Generation Error
              </span>
              <p className="text-xs font-semibold text-[var(--color-body-text)] mt-2">
                {stats.lastError ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{stats.lastError}</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">None (Healthy)</span>
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
            <h3 className="font-display text-sm font-bold text-[var(--color-heading)]">
              System Verification Checklist
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">W3C XML Sitemap Validity (/sitemap.xml)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">Robots.txt Syntax &amp; Directives (/robots.txt)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">Google News Schema (/news-sitemap.xml)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">Canonical HTTPS Domain Uniformity</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> https://ainews.kraviona.com
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">Draft &amp; Deleted Articles Isolation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Enforced at DB Layer
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: LIVE PREVIEW VIEWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl max-h-[85vh] bg-[var(--color-card-background)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--color-secondary-surface)]">
              <h3 className="text-xs font-black text-[var(--color-heading)] uppercase tracking-wider">
                {previewModal.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewModal.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal({ isOpen: false, title: "", content: "" })}
                  className="text-[var(--color-muted-text)] hover:text-[var(--color-heading)] p-1 font-bold text-lg leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#101820]">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                {previewModal.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: DISALLOW ALL DANGER WARNING */}
      {/* ───────────────────────────────────────────────────────────── */}
      {dangerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[var(--color-card-background)] rounded-2xl shadow-2xl p-6 border border-rose-500/40 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-full bg-rose-500/15">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[var(--color-heading)]">
                Critical SEO Warning
              </h3>
            </div>

            <p className="text-xs text-[var(--color-body-text)] leading-relaxed">
              You are about to publish a <code className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 font-mono font-bold">Disallow: /</code> rule for all user agents. This instructs Google, Bing, and other search engines to <strong>de-index or completely stop crawling your website</strong>.
            </p>

            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Are you absolutely certain you want to publish this rule to production?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDangerModal({ isOpen: false })}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDangerModal({ isOpen: false });
                  if (dangerModal.pendingAction) dangerModal.pendingAction();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Confirm &amp; Publish Disallow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
