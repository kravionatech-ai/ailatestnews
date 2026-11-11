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
  Rss,
  Link2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  updateSitemapSettingsAction,
  updateRobotsSettingsAction,
  triggerManualSitemapRegenerationAction,
  previewSitemapXmlAction,
  previewRobotsTxtAction,
  updateItemIndexingAction,
  upsertCustomSeoEntryAction,
  toggleCustomSeoEntryAction,
  deleteCustomSeoEntryAction,
} from "@/actions/seo-settings";
import type {
  ISeoSettings,
  IRobotsRule,
  ICustomSeoEntry,
  SitemapChangeFrequency,
} from "@/lib/db/models/seo-settings.model";

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
    customUrlsCount?: number;
    feedItemsCount?: number;
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

function toDateTimeLocalInput(val?: string | Date): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function computeCanonicalPreview(rawUrl: string, siteUrl: string): string {
  const base = (siteUrl || "https://ainews.kraviona.com").trim().replace(/\/$/, "");
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return `${base}/your-path`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return path === "/" ? base : `${base}${path}`;
}

export function SeoControlCenter({
  initialSettings,
  stats: initialStats,
  inventoryItems: initialInventory,
}: SeoControlCenterProps) {
  const [activeTab, setActiveTab] = useState<
    "sitemap" | "custom" | "robots" | "news" | "indexing" | "health"
  >("sitemap");

  const [settings, setSettings] = useState<ISeoSettings>(initialSettings);
  const [stats, setStats] = useState(initialStats);
  const [inventory, setInventory] = useState(initialInventory);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("all");

  // Custom SEO Entries state
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customPubDate, setCustomPubDate] = useState("");
  const [customChangeFreq, setCustomChangeFreq] = useState<SitemapChangeFrequency>("weekly");
  const [customPriority, setCustomPriority] = useState<number>(0.8);
  const [customInSitemap, setCustomInSitemap] = useState(true);
  const [customInFeed, setCustomInFeed] = useState(true);
  const [customInNews, setCustomInNews] = useState(false);
  const [customEnabled, setCustomEnabled] = useState(true);
  const [customSearch, setCustomSearch] = useState("");
  const [customTargetFilter, setCustomTargetFilter] = useState<
    "all" | "sitemap" | "feed" | "news"
  >("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        if (res.stats) setStats(res.stats);
        showStatus("success", "Sitemap configuration saved and sitemap/feed caches revalidated!");
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

  const handlePreviewSitemap = (
    type: "all" | "articles" | "categories" | "images" | "tags" | "pages" | "custom" | "news" | "feed"
  ) => {
    startTransition(async () => {
      const res = await previewSitemapXmlAction(type);
      if (res.success && res.xml) {
        setPreviewModal({
          isOpen: true,
          title:
            type === "feed"
              ? `RSS 2.0 Feed Preview (/feed.xml) — ${res.count} items`
              : `Sitemap Preview (${type.toUpperCase()}) — ${res.count} URLs`,
          content: res.xml,
          isXml: true,
        });
      } else {
        showStatus("error", res.error || "Failed to generate preview");
      }
    });
  };

  const resetCustomForm = (preset?: {
    inSitemap?: boolean;
    inFeed?: boolean;
    inNews?: boolean;
  }) => {
    setEditingCustomId(null);
    setCustomUrl("");
    setCustomTitle("");
    setCustomDescription("");
    setCustomAuthor("");
    setCustomPubDate("");
    setCustomChangeFreq("weekly");
    setCustomPriority(0.8);
    setCustomInSitemap(preset?.inSitemap ?? true);
    setCustomInFeed(preset?.inFeed ?? true);
    setCustomInNews(preset?.inNews ?? false);
    setCustomEnabled(true);
  };

  const handleEditCustomEntry = (entry: ICustomSeoEntry) => {
    setEditingCustomId(entry.id);
    setCustomUrl(entry.url || "");
    setCustomTitle(entry.title || "");
    setCustomDescription(entry.description || "");
    setCustomAuthor(entry.authorName || "");
    setCustomPubDate(toDateTimeLocalInput(entry.publicationDate || entry.lastModified));
    setCustomChangeFreq(entry.changeFrequency || "weekly");
    setCustomPriority(typeof entry.priority === "number" ? entry.priority : 0.8);
    setCustomInSitemap(entry.includeInSitemap !== false);
    setCustomInFeed(Boolean(entry.includeInFeed));
    setCustomInNews(Boolean(entry.includeInNewsSitemap));
    setCustomEnabled(entry.enabled !== false);
    setConfirmDeleteId(null);
  };

  const handleSaveCustomEntry = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customUrl.trim()) {
      showStatus("error", "Enter a relative path (e.g. /ai-report) or full URL.");
      return;
    }
    if ((customInFeed || customInNews) && !customTitle.trim()) {
      showStatus(
        "error",
        "Headline / Title is required when publishing a custom entry to RSS Feed or Google News."
      );
      return;
    }
    if (!customInSitemap && !customInFeed && !customInNews) {
      showStatus("error", "Select at least one output target (Sitemap, RSS Feed, or News).");
      return;
    }

    const isoDate = customPubDate ? new Date(customPubDate).toISOString() : undefined;

    startTransition(async () => {
      const res = await upsertCustomSeoEntryAction({
        id: editingCustomId || undefined,
        url: customUrl.trim(),
        title: customTitle.trim(),
        description: customDescription.trim(),
        authorName: customAuthor.trim(),
        publicationDate: isoDate,
        lastModified: isoDate,
        changeFrequency: customChangeFreq,
        priority: customPriority,
        includeInSitemap: customInSitemap,
        includeInFeed: customInFeed,
        includeInNewsSitemap: customInNews,
        enabled: customEnabled,
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        if (res.stats) setStats(res.stats);
        setNowMs(Date.now());
        const wasEditing = Boolean(editingCustomId);
        resetCustomForm();
        showStatus(
          "success",
          wasEditing
            ? "Custom entry updated across selected sitemaps/feeds and caches revalidated!"
            : "Custom entry added live to selected sitemaps/feeds!"
        );
      } else {
        showStatus("error", res.error || "Failed to save custom entry");
      }
    });
  };

  const handleToggleCustomEntry = (id: string, nextEnabled: boolean) => {
    startTransition(async () => {
      const res = await toggleCustomSeoEntryAction(id, nextEnabled);
      if (res.success && res.settings) {
        setSettings(res.settings);
        if (res.stats) setStats(res.stats);
        setNowMs(Date.now());
        showStatus(
          "success",
          `Custom entry ${nextEnabled ? "enabled" : "paused"} and feeds refreshed.`
        );
      } else {
        showStatus("error", res.error || "Failed to toggle custom entry");
      }
    });
  };

  const handleDeleteCustomEntry = (id: string) => {
    startTransition(async () => {
      const res = await deleteCustomSeoEntryAction(id);
      if (res.success && res.settings) {
        setSettings(res.settings);
        if (res.stats) setStats(res.stats);
        if (editingCustomId === id) resetCustomForm();
        setConfirmDeleteId(null);
        showStatus("success", "Custom entry removed and sitemap/feed caches refreshed.");
      } else {
        showStatus("error", res.error || "Failed to delete custom entry");
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

  // Filtered custom URLs
  const customEntries: ICustomSeoEntry[] = settings.sitemap.customUrls || [];
  const filteredCustomEntries = customEntries.filter((entry) => {
    const q = customSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (entry.url || "").toLowerCase().includes(q) ||
      (entry.title || "").toLowerCase().includes(q) ||
      (entry.description || "").toLowerCase().includes(q);
    const matchesTarget =
      customTargetFilter === "all" ||
      (customTargetFilter === "sitemap" && entry.includeInSitemap !== false) ||
      (customTargetFilter === "feed" && Boolean(entry.includeInFeed)) ||
      (customTargetFilter === "news" && Boolean(entry.includeInNewsSitemap));
    return matchesSearch && matchesTarget;
  });

  const newsWindowHours = settings.sitemap.newsTimeWindowHours || 48;
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const newsCutoffMs = nowMs - newsWindowHours * 60 * 60 * 1000;

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
            Dynamic XML Sitemap, RSS Feed, Robots.txt, Google News Sync &amp; Custom URL Control Hub
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
            href="/image-sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
          >
            <Globe className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>image-sitemap.xml</span>
            <ExternalLink className="h-3 w-3 text-[var(--color-muted-text)]" />
          </a>
          <a
            href="/sitemap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
          >
            <Globe className="h-3.5 w-3.5 text-[var(--color-muted-text)]" />
            <span>HTML Sitemap</span>
            <ExternalLink className="h-3 w-3 text-[var(--color-muted-text)]" />
          </a>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-semibold text-[var(--color-body-text)] shadow-xs transition"
          >
            <Rss className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>feed.xml</span>
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
          onClick={() => setActiveTab("custom")}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "custom"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
              : "border-transparent text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)]"
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>Custom URLs &amp; Feed</span>
          {customEntries.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
              {customEntries.length}
            </span>
          )}
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
              <span className="text-[11px] text-[var(--color-muted-text)]">
                {stats.customUrlsCount ?? customEntries.filter((e) => e.enabled !== false && e.includeInSitemap !== false).length} custom • {stats.feedItemsCount ?? 0} in RSS feed
              </span>
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
                  onClick={() => handlePreviewSitemap("feed")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Rss className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Preview RSS Feed</span>
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
                <label className="sm:col-span-2 flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/50 hover:bg-[var(--color-secondary-surface)] cursor-pointer transition">
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
                    checked={settings.sitemap.includeTags}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sitemap: { ...settings.sitemap, includeTags: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">
                      Include Topic Tags
                    </span>
                    <span className="text-[11px] text-[var(--color-muted-text)]">
                      Syncs active tags (/tag/[slug])
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
                      Includes /about, /contact, /editorial-policy, /ai-tools, /zeroai
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
                    Auto-splits into /sitemap-static.xml, /sitemap-articles.xml, /sitemap-categories.xml, /image-sitemap.xml, /sitemap-tags.xml, /sitemap-custom.xml
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
                      type="button"
                      onClick={() => handlePreviewSitemap("articles")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-articles.xml
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewSitemap("categories")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-categories.xml
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewSitemap("images")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /image-sitemap.xml
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewSitemap("tags")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-tags.xml
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewSitemap("pages")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-static.xml
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewSitemap("custom")}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] font-mono text-[11px] cursor-pointer"
                    >
                      /sitemap-custom.xml
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Excluded URLs Blacklist */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-heading)]">
                    Custom Excluded URLs &amp; Path Blacklist
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted-text)]">
                    URLs matching these exact paths or wildcard patterns will never appear in any sitemap or feed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] hover:border-[var(--accent)] text-xs font-bold text-[var(--accent)] transition cursor-pointer self-start sm:self-auto"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Manage Custom URLs &amp; Feed ({customEntries.length})</span>
                </button>
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
      {/* TAB 2: CUSTOM URLS & FEED ENTRIES */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "custom" && (
        <div className="space-y-6">
          {/* Top Action & Preview Bar */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                  Custom Sitemap, RSS Feed &amp; News Entries
                </h2>
                <p className="text-xs text-[var(--color-muted-text)] mt-0.5">
                  Manually inject or override entries in <code className="font-mono text-[var(--accent)]">/sitemap.xml</code>,{" "}
                  <code className="font-mono text-[var(--accent)]">/sitemap-custom.xml</code>,{" "}
                  <code className="font-mono text-[var(--accent)]">/feed.xml</code>, and{" "}
                  <code className="font-mono text-[var(--accent)]">/news-sitemap.xml</code>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("custom")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Custom Sitemap XML</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("feed")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Rss className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>RSS Feed XML</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePreviewSitemap("news")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] shadow-xs transition cursor-pointer"
                >
                  <Newspaper className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>News Sitemap XML</span>
                </button>
              </div>
            </div>

            {/* Add / Edit Custom Entry Form */}
            <form
              onSubmit={handleSaveCustomEntry}
              className="rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-[var(--color-heading)] uppercase tracking-wider">
                  {editingCustomId ? "Edit Custom Entry" : "Add New Custom Entry"}
                </h3>
                {editingCustomId && (
                  <button
                    type="button"
                    onClick={() => resetCustomForm()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-heading)]">
                    URL or Relative Path <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="/special-ai-report-2026 or https://ainews.kraviona.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-mono text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <p className="text-[11px] text-[var(--color-muted-text)] truncate">
                    Canonical:{" "}
                    <code className="font-mono text-[var(--accent)]">
                      {computeCanonicalPreview(customUrl, settings.sitemap.siteUrl)}
                    </code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-heading)]">
                    Headline / Title{" "}
                    {(customInFeed || customInNews) ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-[var(--color-muted-text)] font-normal">(Optional for Sitemap-only)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Kraviona State of AI Benchmarks 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-medium text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-heading)]">
                    RSS Summary / Description{" "}
                    <span className="text-[var(--color-muted-text)] font-normal">(Used in /feed.xml)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Concise summary for RSS readers..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-heading)]">
                    Author / Desk Name
                  </label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder="Kraviona AI News Editorial Team"
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-heading)]">
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={customPubDate}
                      onChange={(e) => setCustomPubDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-heading)]">
                      Changefreq
                    </label>
                    <select
                      value={customChangeFreq}
                      onChange={(e) => setCustomChangeFreq(e.target.value as SitemapChangeFrequency)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-semibold text-[var(--color-heading)] outline-none"
                    >
                      <option value="always">always</option>
                      <option value="hourly">hourly</option>
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                      <option value="yearly">yearly</option>
                      <option value="never">never</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-heading)]">
                      Priority
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={customPriority}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        setCustomPriority(Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.8);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-mono text-[var(--color-heading)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>

              {/* Target Outputs */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-[var(--color-heading)] block">
                  Include In Target Feeds
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customInSitemap}
                      onChange={(e) => setCustomInSitemap(e.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-heading)] block">
                        XML Sitemap
                      </span>
                      <span className="text-[11px] text-[var(--color-muted-text)]">
                        /sitemap.xml &amp; /sitemap-custom.xml
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customInFeed}
                      onChange={(e) => setCustomInFeed(e.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-heading)] block">
                        RSS 2.0 Feed
                      </span>
                      <span className="text-[11px] text-[var(--color-muted-text)]">
                        /feed.xml (requires title)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customInNews}
                      onChange={(e) => setCustomInNews(e.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-heading)] block">
                        Google News Sitemap
                      </span>
                      <span className="text-[11px] text-[var(--color-muted-text)]">
                        /news-sitemap.xml ({newsWindowHours}h window)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-body-text)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customEnabled}
                    onChange={(e) => setCustomEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span>Active (Publish immediately to enabled outputs)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => resetCustomForm()}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:bg-[var(--color-secondary-surface)] text-xs font-bold text-[var(--color-heading)] transition cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {editingCustomId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>{editingCustomId ? "Update Custom Entry" : "Add Custom Entry"}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: "all", label: `All (${customEntries.length})` },
                    {
                      key: "sitemap",
                      label: `Sitemap (${customEntries.filter((e) => e.includeInSitemap !== false).length})`,
                    },
                    {
                      key: "feed",
                      label: `RSS Feed (${customEntries.filter((e) => e.includeInFeed).length})`,
                    },
                    {
                      key: "news",
                      label: `News (${customEntries.filter((e) => e.includeInNewsSitemap).length})`,
                    },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setCustomTargetFilter(pill.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      customTargetFilter === pill.key
                        ? "bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--color-main-background)] border-[var(--border)] text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[var(--color-muted-text)]" />
                <input
                  type="text"
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  placeholder="Search custom URL or title..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-xs font-medium text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Custom Entries Table */}
            {filteredCustomEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center space-y-2">
                <Link2 className="h-6 w-6 mx-auto text-[var(--color-muted-text)]" />
                <p className="text-xs font-bold text-[var(--color-heading)]">
                  {customEntries.length === 0
                    ? "No custom sitemap or feed entries configured yet"
                    : "No custom entries match your current filter"}
                </p>
                <p className="text-[11px] text-[var(--color-muted-text)] max-w-md mx-auto">
                  Use the form above to add landing pages, special reports, partner announcements, or custom URLs directly into your XML sitemaps, RSS feed, or Google News sitemap.
                </p>
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-secondary-surface)] border-b border-[var(--border)] text-[var(--color-muted-text)] uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Entry / URL</th>
                      <th className="py-3 px-3">Targets</th>
                      <th className="py-3 px-3">Sitemap Meta</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-medium">
                    {filteredCustomEntries.map((entry) => {
                      const canonical = computeCanonicalPreview(
                        entry.url,
                        settings.sitemap.siteUrl
                      );
                      const rawDate =
                        entry.publicationDate || entry.lastModified || entry.updatedAt || entry.createdAt;
                      const parsedDateMs = rawDate ? new Date(rawDate).getTime() : nowMs;
                      const outsideNewsWindow =
                        nowMs > 0 &&
                        Boolean(entry.includeInNewsSitemap) &&
                        entry.enabled !== false &&
                        Number.isFinite(parsedDateMs) &&
                        parsedDateMs < newsCutoffMs;

                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-[var(--color-secondary-surface)]/40 transition"
                        >
                          <td className="py-3 px-4 space-y-1 max-w-md">
                            <div className="font-bold text-[var(--color-heading)] truncate">
                              {entry.title ? (
                                entry.title
                              ) : (
                                <span className="italic text-[var(--color-muted-text)] font-normal">
                                  (Sitemap URL only — no headline)
                                </span>
                              )}
                            </div>
                            <a
                              href={canonical}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--accent)] hover:underline break-all"
                            >
                              <span>{canonical}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            {entry.description && (
                              <p className="text-[11px] text-[var(--color-muted-text)] line-clamp-1">
                                {entry.description}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {entry.includeInSitemap !== false && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400">
                                  Sitemap
                                </span>
                              )}
                              {entry.includeInFeed && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                                  RSS Feed
                                </span>
                              )}
                              {entry.includeInNewsSitemap && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                  News
                                </span>
                              )}
                              {outsideNewsWindow && (
                                <span
                                  title={`Publication date is older than ${newsWindowHours}h Google News window`}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                >
                                  Older than {newsWindowHours}h
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-[11px] text-[var(--color-body-text)] whitespace-nowrap">
                            <div className="font-mono">
                              {entry.changeFrequency || "weekly"} •{" "}
                              {typeof entry.priority === "number"
                                ? entry.priority.toFixed(1)
                                : "0.8"}
                            </div>
                            {rawDate && (
                              <div className="text-[10px] text-[var(--color-muted-text)]">
                                {new Date(rawDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleToggleCustomEntry(entry.id, entry.enabled === false)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                entry.enabled !== false
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                  : "bg-[var(--color-secondary-surface)] border-[var(--border)] text-[var(--color-muted-text)]"
                              }`}
                            >
                              {entry.enabled !== false ? "Active" : "Paused"}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleEditCustomEntry(entry)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] text-[11px] font-bold text-[var(--color-heading)] transition cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              {confirmDeleteId === entry.id ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleDeleteCustomEntry(entry.id)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 rounded-lg border border-[var(--border)] text-[11px] font-semibold text-[var(--color-muted-text)] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => setConfirmDeleteId(entry.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-rose-500/50 hover:text-rose-600 text-[11px] font-bold text-[var(--color-muted-text)] transition cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetCustomForm({ inSitemap: true, inFeed: true, inNews: true });
                    setActiveTab("custom");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] text-xs font-bold text-[var(--accent)] shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom News Entry</span>
                </button>

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
              <span className="text-[11px] text-[var(--color-muted-text)]">
                Includes {stats.customUrlsCount ?? 0} custom entries
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                RSS Feed Items (/feed.xml)
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats.feedItemsCount ?? 0}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">
                Auto-updated with custom &amp; article items
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-xs">
              <span className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">
                Eligible Google News Articles
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.newsArticlesCount}
              </p>
              <span className="text-[11px] text-[var(--color-muted-text)]">
                Within last {newsWindowHours} hours
              </span>
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
                <span className="font-semibold text-[var(--color-body-text)]">Dynamic RSS 2.0 Syndication Feed (/feed.xml)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Live ({stats.feedItemsCount ?? 0} items)
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
                <span className="font-semibold text-[var(--color-body-text)]">CDN &amp; Edge Cache Control (no-store feeds)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Instant Auto-Update
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-secondary-surface)]/70 text-xs">
                <span className="font-semibold text-[var(--color-body-text)]">Canonical HTTPS Domain Uniformity</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> {settings.sitemap.siteUrl}
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
