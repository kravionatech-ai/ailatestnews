"use client";

import { useState, useMemo, useId } from "react";
import type { ISeoMetadata, EntityType } from "@/lib/seo/types";
import { analyzeSeoContent, estimateTitlePixelWidth, estimateDescriptionPixelWidth } from "@/lib/seo/analyzer";
import {
  Sparkles,
  Globe,
  Share2,
  Code2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  Monitor,
  Send,
  Loader2,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface SeoEditorPanelProps {
  seo: ISeoMetadata;
  onChange: (updatedSeo: ISeoMetadata) => void;
  entityType?: EntityType;
  title?: string;
  slug?: string;
  contentHtml?: string;
  coverImage?: string;
  excerpt?: string;
  baseUrl?: string;
}

export function SeoEditorPanel({
  seo,
  onChange,
  entityType = "post",
  title = "",
  slug = "",
  contentHtml = "",
  coverImage = "",
  excerpt = "",
  baseUrl = "https://ailatestnews.in",
}: SeoEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "social" | "advanced" | "schema" | "preview">("general");
  const [serpDevice, setSerpDevice] = useState<"desktop" | "mobile">("desktop");
  const [socialPlatform, setSocialPlatform] = useState<"facebook" | "x" | "whatsapp">("x");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [indexNowLoading, setIndexNowLoading] = useState(false);
  const [indexNowMessage, setIndexNowMessage] = useState<string | null>(null);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [showChecklist, setShowChecklist] = useState(true);

  // Field helpers
  const updateField = <K extends keyof ISeoMetadata>(key: K, value: ISeoMetadata[K]) => {
    onChange({
      ...seo,
      [key]: value,
    });
  };

  const effectiveTitle = seo.metaTitle || title || "Untitled Dispatches";
  const effectiveDescription = seo.metaDescription || excerpt || "Stay ahead with AI Latest News.";
  const effectiveSlug = slug || "post";
  const fullUrl = `${baseUrl}/${entityType === "post" ? "blog" : entityType === "category" ? "category" : ""}/${effectiveSlug}`.replace(/\/+/g, "/").replace("https:/", "https://");
  const effectiveOgImage = seo.ogImage || coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";

  // Real-time SEO analysis
  const analysis = useMemo(() => {
    return analyzeSeoContent({
      title,
      slug,
      contentHtml,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      focusKeyword: seo.focusKeyword,
      secondaryKeywords: seo.secondaryKeywords,
      ogImage: seo.ogImage,
      coverImage,
      canonicalUrl: seo.canonicalUrl,
    });
  }, [title, slug, contentHtml, seo, coverImage]);

  const titlePx = estimateTitlePixelWidth(effectiveTitle);
  const descPx = estimateDescriptionPixelWidth(effectiveDescription);

  // AI Generation Trigger
  const handleAiGenerate = async (action: "title" | "description" | "keywords" | "faq" | "schema") => {
    setAiLoading(action);
    try {
      const res = await fetch("/api/admin/seo/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title,
          excerpt,
          contentHtml,
          focusKeyword: seo.focusKeyword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "title") {
          updateField("metaTitle", data.result);
        } else if (action === "description") {
          updateField("metaDescription", data.result);
        } else if (action === "keywords") {
          onChange({
            ...seo,
            focusKeyword: data.result.focusKeyword,
            secondaryKeywords: data.result.secondaryKeywords,
          });
        } else if (action === "schema") {
          onChange({
            ...seo,
            schemaType: data.result.schemaType,
            schemaOverrides: data.result.schemaOverrides,
          });
        }
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setAiLoading(null);
    }
  };

  // Request IndexNow
  const handleRequestIndexNow = async () => {
    setIndexNowLoading(true);
    setIndexNowMessage(null);
    try {
      const res = await fetch("/api/admin/seo/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setIndexNowMessage("Submitted successfully to IndexNow engines (Bing, Yandex, etc.)!");
        updateField("indexNowStatus", {
          lastPingedAt: new Date().toISOString(),
          status: "submitted",
          message: data.message,
        });
      } else {
        setIndexNowMessage(data.message || "Submission failed");
      }
    } catch {
      setIndexNowMessage("Network error pinging IndexNow");
    } finally {
      setIndexNowLoading(false);
    }
  };

  // Score Badge Styling
  const scoreColor =
    analysis.score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : analysis.score >= 50
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-2xs overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-gradient-to-r from-indigo-50/40 via-white to-sky-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)]">
                AI Latest News SEO Engine
              </h3>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                v2.0
              </span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Real-time audit, schema generation &amp; indexing controls
            </p>
          </div>
        </div>

        {/* Live Score Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${scoreColor}`}
          >
            <span>SEO Score:</span>
            <span className="text-sm font-extrabold">{analysis.score}/100</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showChecklist ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Collapsible SEO Checklist & Recommendations */}
      {showChecklist && (
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-slate-50/50">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-[var(--foreground)]">
            <span>Audit Checklist ({analysis.checklist.filter((c) => c.status === "pass").length}/{analysis.checklist.length} Passed)</span>
            <span className="text-[var(--foreground-muted)]">
              {analysis.wordCount} words • ~{analysis.readingTime} min read
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {analysis.checklist.map((rule) => {
              const Icon =
                rule.status === "pass"
                  ? CheckCircle2
                  : rule.status === "warn"
                  ? AlertTriangle
                  : XCircle;
              const iconColor =
                rule.status === "pass"
                  ? "text-emerald-600"
                  : rule.status === "warn"
                  ? "text-amber-500"
                  : "text-rose-500";

              return (
                <div
                  key={rule.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-100 shadow-3xs"
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--foreground)] truncate">
                        {rule.label}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                        {rule.points}/{rule.maxPoints}pt
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--foreground-muted)] leading-tight mt-0.5">
                      {rule.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--border)] bg-white px-3 sm:px-5 overflow-x-auto no-scrollbar">
        {[
          { id: "general", label: "General", icon: Globe },
          { id: "social", label: "Social Cards", icon: Share2 },
          { id: "advanced", label: "Advanced & Robots", icon: ShieldCheck },
          { id: "schema", label: "Schema (JSON-LD)", icon: Code2 },
          { id: "preview", label: "SERP Preview", icon: Monitor },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ── 1. GENERAL TAB ── */}
        {activeTab === "general" && (
          <div className="space-y-5">
            {/* Focus Keyword & AI assist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  Focus Keyword
                  <span className="text-[10px] font-normal text-[var(--foreground-muted)]">
                    (Primary search topic)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAiGenerate("keywords")}
                  disabled={Boolean(aiLoading)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {aiLoading === "keywords" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>Suggest with AI</span>
                </button>
              </div>
              <input
                type="text"
                value={seo.focusKeyword || ""}
                onChange={(e) => updateField("focusKeyword", e.target.value)}
                placeholder="e.g. Sarvam-1 launch, DeepSeek-R1, ChatGPT vs Gemini"
                className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Secondary Keywords */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                Secondary Keywords
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {seo.secondaryKeywords?.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = seo.secondaryKeywords?.filter((_, i) => i !== idx);
                        updateField("secondaryKeywords", updated);
                      }}
                      className="text-indigo-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSecondaryKeyword}
                  onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newSecondaryKeyword.trim()) {
                        const current = seo.secondaryKeywords || [];
                        updateField("secondaryKeywords", [...current, newSecondaryKeyword.trim()]);
                        setNewSecondaryKeyword("");
                      }
                    }
                  }}
                  placeholder="Add secondary keyword and press Enter..."
                  className="flex-1 rounded-xl border border-[var(--border)] px-3.5 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSecondaryKeyword.trim()) {
                      const current = seo.secondaryKeywords || [];
                      updateField("secondaryKeywords", [...current, newSecondaryKeyword.trim()]);
                      setNewSecondaryKeyword("");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">
                  SEO Meta Title
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                    {effectiveTitle.length}/60 chars • ~{titlePx}/580px
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAiGenerate("title")}
                    disabled={Boolean(aiLoading)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "title" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    <span>Write Title with AI</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={seo.metaTitle || ""}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                placeholder={title ? `${title} | AI Latest News` : "Enter high-CTR SEO title..."}
                className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
              />
              {/* Pixel-width Visual Indicator */}
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    titlePx > 580
                      ? "bg-rose-500"
                      : titlePx > 450
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, (titlePx / 580) * 100)}%` }}
                />
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[var(--foreground)]">
                  Meta Description
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                    {effectiveDescription.length}/160 chars • ~{descPx}/960px
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAiGenerate("description")}
                    disabled={Boolean(aiLoading)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "description" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    <span>Write Description with AI</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={seo.metaDescription || ""}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                placeholder={excerpt || "Summarize this article with relevant keywords..."}
                className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
              />
              {/* Pixel-width Visual Indicator */}
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    descPx > 960
                      ? "bg-rose-500"
                      : descPx > 700
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, (descPx / 960) * 100)}%` }}
                />
              </div>
            </div>

            {/* Canonical URL & Breadcrumb Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                  Canonical URL Override
                </label>
                <input
                  type="text"
                  value={seo.canonicalUrl || ""}
                  onChange={(e) => updateField("canonicalUrl", e.target.value)}
                  placeholder={fullUrl}
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)] font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                  Breadcrumb Label
                </label>
                <input
                  type="text"
                  value={seo.breadcrumbTitle || ""}
                  onChange={(e) => updateField("breadcrumbTitle", e.target.value)}
                  placeholder={title || "Short navigation title"}
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 2. SOCIAL TAB ── */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--foreground)]">
                Social Card Customization
              </span>
              {/* Platform Switcher */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                {(["x", "facebook", "whatsapp"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSocialPlatform(p)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                      socialPlatform === p
                        ? "bg-white text-indigo-700 shadow-2xs"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {p === "x" ? "X / Twitter" : p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    OG / Social Title
                  </label>
                  <input
                    type="text"
                    value={seo.ogTitle || ""}
                    onChange={(e) => updateField("ogTitle", e.target.value)}
                    placeholder={effectiveTitle}
                    className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    OG / Social Description
                  </label>
                  <textarea
                    rows={3}
                    value={seo.ogDescription || ""}
                    onChange={(e) => updateField("ogDescription", e.target.value)}
                    placeholder={effectiveDescription}
                    className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    OG Image URL (1200x630)
                  </label>
                  <input
                    type="text"
                    value={seo.ogImage || ""}
                    onChange={(e) => updateField("ogImage", e.target.value)}
                    placeholder={coverImage || "https://..."}
                    className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)] font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    Twitter Card Format
                  </label>
                  <select
                    value={seo.twitterCard || "summary_large_image"}
                    onChange={(e) => updateField("twitterCard", e.target.value as "summary" | "summary_large_image")}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  >
                    <option value="summary_large_image">Large Image Card (1200x630 - Recommended)</option>
                    <option value="summary">Small Square Summary Card</option>
                  </select>
                </div>
              </div>

              {/* Live Social Card Preview */}
              <div>
                <span className="block text-xs font-bold text-[var(--foreground)] mb-2">
                  Live {socialPlatform.toUpperCase()} Preview
                </span>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {/* Image */}
                  <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveOgImage}
                      alt={seo.ogTitle || effectiveTitle}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Text Container */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      ailatestnews.in
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mt-0.5">
                      {seo.ogTitle || effectiveTitle}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                      {seo.ogDescription || effectiveDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. ADVANCED TAB ── */}
        {activeTab === "advanced" && (
          <div className="space-y-6">
            {/* Robots Configuration */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                Robots Meta Directives
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={seo.robots?.index ?? true}
                    onChange={(e) =>
                      updateField("robots", {
                        index: e.target.checked,
                        follow: seo.robots?.follow ?? true,
                        noarchive: seo.robots?.noarchive ?? false,
                        nosnippet: seo.robots?.nosnippet ?? false,
                        maxImagePreview: seo.robots?.maxImagePreview ?? "large",
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold">Index Page</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={seo.robots?.follow ?? true}
                    onChange={(e) =>
                      updateField("robots", {
                        index: seo.robots?.index ?? true,
                        follow: e.target.checked,
                        noarchive: seo.robots?.noarchive ?? false,
                        nosnippet: seo.robots?.nosnippet ?? false,
                        maxImagePreview: seo.robots?.maxImagePreview ?? "large",
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold">Follow Links</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={seo.robots?.noarchive ?? false}
                    onChange={(e) =>
                      updateField("robots", {
                        index: seo.robots?.index ?? true,
                        follow: seo.robots?.follow ?? true,
                        noarchive: e.target.checked,
                        nosnippet: seo.robots?.nosnippet ?? false,
                        maxImagePreview: seo.robots?.maxImagePreview ?? "large",
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold">No Archive</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={seo.robots?.nosnippet ?? false}
                    onChange={(e) =>
                      updateField("robots", {
                        index: seo.robots?.index ?? true,
                        follow: seo.robots?.follow ?? true,
                        noarchive: seo.robots?.noarchive ?? false,
                        nosnippet: e.target.checked,
                        maxImagePreview: seo.robots?.maxImagePreview ?? "large",
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold">No Snippet</span>
                </label>
              </div>
            </div>

            {/* Sitemap Settings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                XML Sitemap Controls
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seo.sitemap?.include ?? true}
                    onChange={(e) =>
                      updateField("sitemap", {
                        include: e.target.checked,
                        priority: seo.sitemap?.priority ?? 0.7,
                        changefreq: seo.sitemap?.changefreq ?? "weekly",
                      })
                    }
                  />
                  <span className="text-xs font-semibold">Include in sitemap.xml</span>
                </label>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    Priority ({seo.sitemap?.priority ?? 0.7})
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={seo.sitemap?.priority ?? 0.7}
                    onChange={(e) =>
                      updateField("sitemap", {
                        include: seo.sitemap?.include ?? true,
                        priority: parseFloat(e.target.value),
                        changefreq: seo.sitemap?.changefreq ?? "weekly",
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    Change Frequency
                  </label>
                  <select
                    value={seo.sitemap?.changefreq ?? "weekly"}
                    onChange={(e) =>
                      updateField("sitemap", {
                        include: seo.sitemap?.include ?? true,
                        priority: seo.sitemap?.priority ?? 0.7,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        changefreq: e.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs outline-none"
                  >
                    <option value="always">Always</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* IndexNow Immediate Ping Action */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900">
                      IndexNow Real-time Submission
                    </span>
                    <span className="text-[10px] font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                      Bing • Yandex • Seznam
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Instantly notifies search engines of content updates without waiting for re-crawl.
                  </p>
                  {seo.indexNowStatus?.lastPingedAt && (
                    <span className="block text-[10px] text-indigo-500 mt-1">
                      Last submitted: {new Date(seo.indexNowStatus.lastPingedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRequestIndexNow}
                  disabled={indexNowLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {indexNowLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Request Indexing</span>
                </button>
              </div>

              {indexNowMessage && (
                <div className="mt-3 p-2.5 rounded-xl bg-white border border-indigo-100 text-xs text-indigo-800 font-medium">
                  {indexNowMessage}
                </div>
              )}
            </div>

            {/* 301 Redirect Aliases */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Legacy 301 URL Aliases (redirectFrom)
              </label>
              <p className="text-[11px] text-[var(--foreground-muted)] mb-2">
                Comma-separated legacy URLs that should 301 redirect to this page.
              </p>
              <input
                type="text"
                value={seo.redirectFrom?.join(", ") || ""}
                onChange={(e) =>
                  updateField(
                    "redirectFrom",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="/old-post-slug, /ai-models/previous-review"
                className="w-full rounded-xl border border-[var(--border)] px-3.5 py-2 text-xs font-mono outline-none"
              />
            </div>
          </div>
        )}

        {/* ── 4. SCHEMA (JSON-LD) TAB ── */}
        {activeTab === "schema" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)]">
                  Primary Schema.org Type
                </label>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Structured data injected into the head for Google rich results
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAiGenerate("schema")}
                disabled={Boolean(aiLoading)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                {aiLoading === "schema" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Generate Schema with AI</span>
              </button>
            </div>

            <select
              value={seo.schemaType || "NewsArticle"}
              onChange={(e) => updateField("schemaType", e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[var(--accent)]"
            >
              <option value="NewsArticle">NewsArticle (Breaking News &amp; Reports)</option>
              <option value="TechArticle">TechArticle (Deep Dives &amp; Architectures)</option>
              <option value="BlogPosting">BlogPosting (Standard Blog Article)</option>
              <option value="Review">Review (Model &amp; Tool Benchmarks)</option>
              <option value="HowTo">HowTo (Step-by-step Tutorials)</option>
              <option value="CollectionPage">CollectionPage (Taxonomy Hubs)</option>
              <option value="FAQPage">FAQPage (Q&amp;A Knowledge Base)</option>
              <option value="ProfilePage">ProfilePage (Author Profiles)</option>
            </select>

            {/* Custom JSON-LD Overrides */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Custom JSON-LD Editor (Overrides / Extra Schema)
              </label>
              <p className="text-[11px] text-[var(--foreground-muted)] mb-2">
                Provide custom valid JSON-LD if you wish to override or extend the automated schema.
              </p>
              <textarea
                rows={8}
                value={seo.schemaOverrides || ""}
                onChange={(e) => updateField("schemaOverrides", e.target.value)}
                placeholder='{\n  "@context": "https://schema.org",\n  "@type": "TechArticle",\n  "headline": "..."\n}'
                className="w-full rounded-xl border border-[var(--border)] bg-slate-900 text-slate-100 font-mono text-xs p-3.5 outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}

        {/* ── 5. SERP PREVIEW TAB ── */}
        {activeTab === "preview" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--foreground)]">
                Live Google Search Snippet
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSerpDevice("desktop")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    serpDevice === "desktop"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Monitor className="h-3 w-3" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice("mobile")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    serpDevice === "mobile"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Smartphone className="h-3 w-3" /> Mobile
                </button>
              </div>
            </div>

            {/* Google Result Card */}
            <div
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all ${
                serpDevice === "mobile" ? "max-w-sm mx-auto" : "max-w-2xl"
              }`}
            >
              {/* Site Breadcrumbs */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-indigo-600">
                  AI
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium text-slate-800 leading-none">
                    AI Latest News
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono truncate leading-tight">
                    {fullUrl}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
                {effectiveTitle}
              </h3>

              {/* Description */}
              <p className="mt-1 text-xs sm:text-sm text-[#4d5156] line-clamp-2 leading-relaxed">
                {effectiveDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
