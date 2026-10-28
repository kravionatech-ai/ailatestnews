"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Edit3,
  X,
  Save,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  FolderTree,
  Hash,
} from "lucide-react";
import type { ISeoMetadata } from "@/lib/seo/types";
import { SeoEditorPanel } from "@/components/admin/seo/seo-editor-panel";
import { BulkSeoTable, type BulkSeoItem } from "@/components/admin/seo/bulk-seo-table";
import { saveEntitySeoAction } from "@/actions/seo";
import { estimateTitlePixelWidth } from "@/lib/seo/analyzer";

export interface SeoInventoryItem {
  id: string;
  title: string;
  slug: string;
  route: string;
  type: "home" | "page" | "category" | "post" | "tag";
  status?: string;
  seo: ISeoMetadata;
  excerpt?: string;
  coverImage?: string;
  contentHtml?: string;
}

interface SeoHubProps {
  items: SeoInventoryItem[];
}

export function SeoHub({ items: initialItems }: SeoHubProps) {
  const router = useRouter();
  const [items, setItems] = useState<SeoInventoryItem[]>(initialItems);
  const [viewMode, setViewMode] = useState<"inventory" | "bulk">("inventory");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");

  // Modal full editor state
  const [activeEditItem, setActiveEditItem] = useState<SeoInventoryItem | null>(null);
  const [editingSeo, setEditingSeo] = useState<ISeoMetadata>({});
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Diagnostic helper per item
  const getDiagnostics = (item: SeoInventoryItem) => {
    const warnings: string[] = [];
    const seo = item.seo || {};
    const title = seo.metaTitle || item.title || "";
    const desc = seo.metaDescription || item.excerpt || "";

    if (!seo.metaTitle) warnings.push("Missing custom meta title");
    if (!seo.metaDescription) warnings.push("Missing meta description");
    if (!seo.focusKeyword) warnings.push("Missing focus keyword");
    if (!seo.ogImage && !item.coverImage) warnings.push("Missing OG image");

    if (title.length > 65) warnings.push(`Title long (${title.length} chars)`);
    if (desc.length > 165) warnings.push(`Description long (${desc.length} chars)`);
    if (seo.robots?.index === false) warnings.push("Noindex active");

    return warnings;
  };

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const title = (item.seo?.metaTitle || item.title || "").toLowerCase();
      const slug = item.slug.toLowerCase();
      const route = item.route.toLowerCase();
      const q = search.toLowerCase().trim();

      if (q && !title.includes(q) && !slug.includes(q) && !route.includes(q)) {
        return false;
      }

      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (healthFilter !== "all") {
        const diagnostics = getDiagnostics(item);
        if (healthFilter === "missing_desc" && !diagnostics.includes("Missing meta description"))
          return false;
        if (healthFilter === "missing_kw" && !diagnostics.includes("Missing focus keyword"))
          return false;
        if (healthFilter === "missing_og" && !diagnostics.includes("Missing OG image"))
          return false;
        if (healthFilter === "noindex" && !diagnostics.includes("Noindex active")) return false;
        if (healthFilter === "warnings_only" && diagnostics.length === 0) return false;
      }

      return true;
    });
  }, [items, search, typeFilter, healthFilter]);

  // Open modal editor
  const handleOpenEdit = (item: SeoInventoryItem) => {
    setActiveEditItem(item);
    setEditingSeo(item.seo ? JSON.parse(JSON.stringify(item.seo)) : {});
  };

  // Save from full modal editor
  const handleSaveModal = () => {
    if (!activeEditItem) return;
    const targetId = activeEditItem.id;
    const targetType = activeEditItem.type === "home" ? "page" : activeEditItem.type;

    startTransition(async () => {
      const res = await saveEntitySeoAction({
        id: targetId,
        type: targetType as "post" | "category" | "page" | "tag",
        seo: editingSeo,
        partial: false,
      });

      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === targetId ? { ...i, seo: res.seo || editingSeo } : i))
        );
        setFeedback({
          type: "success",
          message: `SEO settings for "${activeEditItem.title}" saved & revalidated.`,
        });
        setActiveEditItem(null);
        setTimeout(() => setFeedback(null), 4000);
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save SEO settings.",
        });
      }
    });
  };

  // Save from quick bulk table (safe partial update)
  const handleSaveBulkItem = async (id: string, updatedSeo: ISeoMetadata) => {
    const item = items.find((i) => i.id === id);
    if (!item) return false;

    const targetType = item.type === "home" ? "page" : item.type;
    const res = await saveEntitySeoAction({
      id,
      type: targetType as "post" | "category" | "page" | "tag",
      seo: updatedSeo,
      partial: true, // Only update fields touched in bulk editor
    });

    if (res.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, seo: res.seo || updatedSeo } : i))
      );
      router.refresh();
      return true;
    }
    return false;
  };

  // Map to bulk editor items
  const bulkTableItems: BulkSeoItem[] = useMemo(() => {
    return items.map((i) => ({
      _id: i.id,
      title: i.title,
      slug: i.slug,
      type: i.type === "home" ? "page" : (i.type as "post" | "category" | "page"),
      seo: i.seo,
    }));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Control Deck: View Switcher & Global Diagnostics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
            SEO Command Center &amp; Page Inventory
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Manage meta titles, descriptions, canonical URLs, robots directives, OpenGraph visuals, and sitemap rules across all {items.length} public routes.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("inventory")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "inventory"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Page Inventory ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("bulk")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "bulk"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Spreadsheet Quick Editor</span>
          </button>
        </div>
      </div>

      {/* ──────────────── VIEW A: PAGE INVENTORY TABLE ──────────────── */}
      {viewMode === "inventory" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, slug, or route..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Route Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">All Routes ({items.length})</option>
                <option value="home">Homepage (1)</option>
                <option value="page">Static Pages</option>
                <option value="category">Category Hubs</option>
                <option value="post">Articles / Posts</option>
                <option value="tag">Topic Tags</option>
              </select>
            </div>

            {/* Health Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">SEO Health:</span>
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">All States</option>
                <option value="warnings_only">Needs Attention (Warnings)</option>
                <option value="missing_desc">Missing Description</option>
                <option value="missing_kw">Missing Focus Keyword</option>
                <option value="missing_og">Missing OG Image</option>
                <option value="noindex">Noindex Active</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Route &amp; Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Meta Description</th>
                    <th className="px-4 py-3">Canonical &amp; Robots</th>
                    <th className="px-4 py-3">SEO Health</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredItems.map((item) => {
                    const seo = item.seo || {};
                    const title = seo.metaTitle || item.title;
                    const desc = seo.metaDescription || item.excerpt || "—";
                    const diagnostics = getDiagnostics(item);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Route & Title */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{item.title}</div>
                          <div className="text-[11px] font-mono text-indigo-600 flex items-center gap-1 mt-0.5">
                            <span>{item.route}</span>
                            <a
                              href={item.route}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-600 inline-block"
                              title="Open public page"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              item.type === "home"
                                ? "bg-amber-100 text-amber-800"
                                : item.type === "page"
                                ? "bg-blue-100 text-blue-800"
                                : item.type === "category"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.type === "post"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>

                        {/* Meta Description */}
                        <td className="px-4 py-3 max-w-sm">
                          <p className="line-clamp-2 text-slate-600 text-[11px] leading-relaxed">
                            {desc}
                          </p>
                          {seo.metaDescription && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block">
                              {seo.metaDescription.length} chars
                            </span>
                          )}
                        </td>

                        {/* Canonical & Robots */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-[11px] font-mono text-slate-500">
                            {seo.canonicalUrl ? (
                              <span className="text-emerald-700 font-semibold truncate max-w-[150px] inline-block">
                                Custom Canonical
                              </span>
                            ) : (
                              <span>Default (Self)</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                seo.robots?.index === false
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {seo.robots?.index === false ? "noindex" : "index"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {seo.robots?.follow === false ? "nofollow" : "follow"}
                            </span>
                          </div>
                        </td>

                        {/* Health Warnings */}
                        <td className="px-4 py-3">
                          {diagnostics.length === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Optimal
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {diagnostics.slice(0, 2).map((warn, wIdx) => (
                                <span
                                  key={wIdx}
                                  className="block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 truncate max-w-[180px]"
                                >
                                  ⚠️ {warn}
                                </span>
                              ))}
                              {diagnostics.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  +{diagnostics.length - 2} more warning(s)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit Full SEO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── VIEW B: SPREADSHEET QUICK BULK EDITOR ──────────────── */}
      {viewMode === "bulk" && (
        <BulkSeoTable items={bulkTableItems} onSaveItem={handleSaveBulkItem} />
      )}

      {/* ──────────────── MODAL: FULL 5-TAB SEO EDITOR ──────────────── */}
      {activeEditItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveEditItem(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    SEO Editor: {activeEditItem.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500">• {activeEditItem.route}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeEditItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveEditItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Complete SeoEditorPanel */}
            <div className="p-6 overflow-y-auto flex-1">
              <SeoEditorPanel
                seo={editingSeo}
                onChange={setEditingSeo}
                entityType={activeEditItem.type === "home" ? "page" : activeEditItem.type}
                title={activeEditItem.title}
                slug={activeEditItem.slug}
                excerpt={activeEditItem.excerpt}
                coverImage={activeEditItem.coverImage}
                contentHtml={activeEditItem.contentHtml}
                baseUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ailatestnews.in"}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Saving will update MongoDB and trigger immediate cache revalidation &amp; IndexNow.
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveEditItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveModal}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>{isPending ? "Saving..." : "Save SEO Settings"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
