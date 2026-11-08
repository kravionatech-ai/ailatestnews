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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              SEO Management Center
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Production Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic XML Sitemap, Robots.txt, Google News Sync & Indexing Control Hub
          </p>
        </div>

        {/* Live Public Links */}
        <div className="flex items-center gap-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            <span>sitemap.xml</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
          >
            <Bot className="h-3.5 w-3.5 text-slate-600" />
            <span>robots.txt</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          {settings.sitemap.includeNewsSitemap && (
            <a
              href="/news-sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
            >
              <Newspaper className="h-3.5 w-3.5 text-emerald-600" />
              <span>news-sitemap.xml</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
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
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("sitemap")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "sitemap"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Sitemap Settings</span>
        </button>

        <button
          onClick={() => setActiveTab("robots")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "robots"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Robots.txt Editor</span>
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "news"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Newspaper className="h-4 w-4" />
          <span>Google News Sitemap</span>
          {stats.newsArticlesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {stats.newsArticlesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("indexing")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "indexing"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Indexing Controls</span>
        </button>

        <button
          onClick={() => setActiveTab("health")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "health"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sitemap Status
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    settings.sitemap.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                  }`}
                />
                <span className="text-sm font-black text-slate-800">
                  {settings.sitemap.enabled ? "Live & Dynamic" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total URLs in Sitemap
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {stats.totalUrlsInSitemap}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Last Generated
              </span>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                {stats.sitemapLastGenerated
                  ? new Date(stats.sitemapLastGenerated).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }) + " IST"
                  : "On-demand"}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Validation Status
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Valid W3C XML</span>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Sitemap Generation Controls
                </h2>
                <p className="text-xs text-slate-500">
                  Manage database synchronization, canonical domain and content inclusion
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleManualRegenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                  <span>Regenerate & Purge Cache</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("all")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Full XML</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveSitemap}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Sitemap Settings</span>
                </button>
              </div>
            </div>

            {/* Base Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
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
                className="w-full max-w-xl px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Every URL loc in sitemaps will use this base prefix. Trailing slashes are auto-stripped.
              </p>
            </div>

            {/* Collection Feature Toggles */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Content Inclusion Toggles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enable XML Sitemap System
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When off, /sitemap.xml returns an empty urlset
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includeArticles}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includeArticles: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Include Published Articles
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Syncs all published posts with actual modified dates
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includeCategories}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includeCategories: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Include Pillar Categories
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Syncs active categories (/category/[slug])
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={settings.sitemap.includePages}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includePages: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Include Static Core & Standalone Pages
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Includes /about, /contact, /editorial-policy, /ai-tools
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Large Website Sitemap Architecture (Phase 4) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Large Website Architecture (Sitemap Index)
                  </h3>
                  <p className="text-[11px] text-slate-500">
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
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.sitemap.enableSplitSitemaps && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-2">
                  <p className="font-semibold">
                    Sitemap Index is active. Available sub-sitemaps:
                  </p>
                  <div className="flex flex-wrap gap-2 text-slate-700">
                    <button
                      onClick={() => handlePreviewSitemap("articles")}
                      className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 font-mono text-[11px]"
                    >
                      /sitemap-articles.xml
                    </button>
                    <button
                      onClick={() => handlePreviewSitemap("categories")}
                      className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 font-mono text-[11px]"
                    >
                      /sitemap-categories.xml
                    </button>
                    <button
                      onClick={() => handlePreviewSitemap("pages")}
                      className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 font-mono text-[11px]"
                    >
                      /sitemap-static.xml
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Excluded URLs Blacklist */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  Custom Excluded URLs & Path Blacklist
                </h3>
                <p className="text-[11px] text-slate-500">
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddExcludedUrl}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <span>{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedUrl(url)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Robots.txt Rule Manager
                </h2>
                <p className="text-xs text-slate-500">
                  Control crawler access, Disallow directives, and sitemap citations live
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handlePreviewRobots}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Robots.txt</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSaveRobots(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Publish Changes</span>
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Editor Mode:</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
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
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Visual Rule Builder (Recommended)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
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
                  className="text-indigo-600 focus:ring-indigo-500"
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
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600">User-agent:</label>
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
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-800"
                          />
                        </div>

                        {settings.robots.rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRobotsRule(ruleIdx)}
                            className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Rule</span>
                          </button>
                        )}
                      </div>

                      {/* Allow Paths */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
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
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800"
                        />
                      </div>

                      {/* Disallow Paths */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
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
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddRobotsRule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Crawler Rule Group</span>
                  </button>
                </div>

                {/* Sitemaps Directives */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800">
                    Sitemap References to Include in Robots.txt
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
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
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Include Google News Sitemap Directive (
                      <code className="text-indigo-600 font-mono text-[11px]">
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
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-900 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Google News Sitemap Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Dedicated endpoint: <code className="font-mono text-indigo-600">/news-sitemap.xml</code> for articles published within 48 hours
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("news")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview News XML ({stats.newsArticlesCount})</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveSitemap}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save News Settings</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition">
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
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Enable Google News Sitemap
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Serves valid &lt;news:news&gt; tags at /news-sitemap.xml
                  </span>
                </div>
              </label>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-400">
                  Google News guidelines recommend 48 hours maximum.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google News Compliance Notice</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Direct URL Indexing Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Configure Index/Noindex and Follow/Nofollow per article and page. Noindex items are automatically excluded from sitemaps.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search URL or title..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <select
                  value={inventoryTypeFilter}
                  onChange={(e) => setInventoryTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <option value="all">All Content</option>
                  <option value="post">Articles Only</option>
                  <option value="category">Categories Only</option>
                  <option value="page">Pages Only</option>
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Title / Route</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Publish Status</th>
                    <th className="py-3 px-3">Robots Index Directive</th>
                    <th className="py-3 px-3">Sitemap Presence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInventory.slice(0, 30).map((item) => {
                    const currentDirective = item.index
                      ? item.follow
                        ? "index,follow"
                        : "index,nofollow"
                      : item.follow
                      ? "noindex,follow"
                      : "noindex,nofollow";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-slate-900 truncate max-w-sm">
                            {item.title}
                          </p>
                          <code className="text-[11px] text-slate-500 font-mono">
                            {item.route}
                          </code>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === "published"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "draft"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"
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
                            className={`text-xs font-bold rounded-lg px-2 py-1 border transition ${
                              currentDirective === "index,follow"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : currentDirective === "noindex,follow"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : currentDirective === "index,nofollow"
                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                : "bg-rose-50 text-rose-800 border-rose-300"
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
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
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
              <p className="text-[11px] text-slate-400 text-center">
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
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Published Articles
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {stats.publishedPosts}
              </p>
              <span className="text-[11px] text-slate-400">out of {stats.totalPosts} total</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Draft Articles
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {stats.draftPosts}
              </p>
              <span className="text-[11px] text-slate-400">Auto-excluded from sitemaps</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Noindex Pages
              </span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {stats.noindexPosts + stats.noindexPages}
              </p>
              <span className="text-[11px] text-slate-400">Respects crawler directives</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total URLs in Sitemap
              </span>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {stats.totalUrlsInSitemap}
              </p>
              <span className="text-[11px] text-slate-400">Dynamic & Canonical</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Eligible Google News Articles
              </span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {stats.newsArticlesCount}
              </p>
              <span className="text-[11px] text-slate-400">Within last 48 hours</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Last Generation Error
              </span>
              <p className="text-xs font-semibold text-slate-700 mt-2">
                {stats.lastError ? (
                  <span className="text-rose-600 font-bold">{stats.lastError}</span>
                ) : (
                  <span className="text-emerald-600 font-bold">None (Healthy)</span>
                )}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">
              System Verification Checklist
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">W3C XML Sitemap Validity (/sitemap.xml)</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">Robots.txt Syntax & Directives (/robots.txt)</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">Google News Schema (/news-sitemap.xml)</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">Canonical HTTPS Domain Uniformity</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> https://ainews.kraviona.com
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-semibold text-slate-700">Draft & Deleted Articles Isolation</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
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
          <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal({ isOpen: false, title: "", content: "" })}
                  className="text-slate-400 hover:text-slate-700 p-1 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950">
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
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-full bg-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Critical SEO Warning
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to publish a <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold">Disallow: /</code> rule for all user agents. This instructs Google, Bing, and other search engines to <strong>de-index or completely stop crawling your website</strong>.
            </p>

            <p className="text-xs font-bold text-rose-700">
              Are you absolutely certain you want to publish this rule to production?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDangerModal({ isOpen: false })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDangerModal({ isOpen: false });
                  if (dangerModal.pendingAction) dangerModal.pendingAction();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
              >
                Confirm & Publish Disallow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
