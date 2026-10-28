"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { ISeoMetadata } from "@/lib/seo/types";
import { estimateTitlePixelWidth } from "@/lib/seo/analyzer";

export interface BulkSeoItem {
  _id: string;
  title: string;
  slug: string;
  type: "post" | "category" | "page";
  seo: ISeoMetadata;
}

interface BulkSeoTableProps {
  items: BulkSeoItem[];
  onSaveItem: (id: string, updatedSeo: ISeoMetadata) => Promise<boolean>;
}

export function BulkSeoTable({ items, onSaveItem }: BulkSeoTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "missing_title" | "missing_desc" | "title_too_long" | "desc_too_long">("all");
  const [editingRows, setEditingRows] = useState<Record<string, ISeoMetadata>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saved" | "error">>({});

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const seo = editingRows[item._id] || item.seo || {};
      const title = seo.metaTitle || item.title || "";
      const desc = seo.metaDescription || "";

      if (search && !title.toLowerCase().includes(search.toLowerCase()) && !item.slug.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (filter === "missing_title") return !seo.metaTitle;
      if (filter === "missing_desc") return !seo.metaDescription;
      if (filter === "title_too_long") return title.length > 65;
      if (filter === "desc_too_long") return desc.length > 165;

      return true;
    });
  }, [items, search, filter, editingRows]);

  const handleFieldChange = (id: string, field: keyof ISeoMetadata, value: unknown) => {
    const current = editingRows[id] || items.find((i) => i._id === id)?.seo || {};
    setEditingRows({
      ...editingRows,
      [id]: {
        ...current,
        [field]: value,
      },
    });
  };

  const handleSave = async (id: string) => {
    const updated = editingRows[id];
    if (!updated) return;
    setSavingId(id);
    try {
      const success = await onSaveItem(id, updated);
      if (success) {
        setSaveStatus({ ...saveStatus, [id]: "saved" });
        setTimeout(() => {
          setSaveStatus((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 3000);
      }
    } catch {
      setSaveStatus({ ...saveStatus, [id]: "error" });
    } finally {
      setSavingId(null);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ["ID", "Title", "Slug", "Type", "Focus Keyword", "Meta Title", "Meta Description", "Canonical"];
    const rows = items.map((item) => {
      const seo = item.seo || {};
      return [
        `"${item._id}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.slug}"`,
        `"${item.type}"`,
        `"${(seo.focusKeyword || "").replace(/"/g, '""')}"`,
        `"${(seo.metaTitle || "").replace(/"/g, '""')}"`,
        `"${(seo.metaDescription || "").replace(/"/g, '""')}"`,
        `"${(seo.canonicalUrl || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ailatestnews-seo-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dirtyCount = Object.keys(editingRows).length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-2xs overflow-hidden">
      {/* Unsaved changes banner */}
      {dirtyCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              You have <strong>{dirtyCount}</strong> unsaved item{dirtyCount > 1 ? "s" : ""}. Click &ldquo;Save&rdquo; on each row to persist changes to MongoDB.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditingRows({})}
            className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
          >
            Discard Edits
          </button>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles or slugs..."
            className="w-full rounded-xl border border-[var(--border)] bg-white pl-9 pr-3 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Content</option>
              <option value="missing_title">Missing Meta Title</option>
              <option value="missing_desc">Missing Meta Description</option>
              <option value="title_too_long">Title Too Long (&gt;65)</option>
              <option value="desc_too_long">Description Too Long (&gt;165)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50 shadow-3xs"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-[var(--border)] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 w-44">Content / Slug</th>
              <th className="py-3 px-4 w-48">Focus Keyword</th>
              <th className="py-3 px-4 w-72">Meta Title</th>
              <th className="py-3 px-4">Meta Description</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredItems.map((item) => {
              const currentSeo = editingRows[item._id] || item.seo || {};
              const titleValue = currentSeo.metaTitle ?? item.title ?? "";
              const descValue = currentSeo.metaDescription ?? "";
              const isDirty = Boolean(editingRows[item._id]);
              const isSaving = savingId === item._id;
              const titlePx = estimateTitlePixelWidth(titleValue);

              return (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Title & Slug */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-[var(--foreground)] block truncate max-w-[170px]">
                      {item.title}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--foreground-muted)] block truncate max-w-[170px]">
                      /{item.slug}
                    </span>
                    <span className="inline-block mt-0.5 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                  </td>

                  {/* Focus Keyword */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={currentSeo.focusKeyword || ""}
                      onChange={(e) => handleFieldChange(item._id, "focusKeyword", e.target.value)}
                      placeholder="Add keyword..."
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
                    />
                  </td>

                  {/* Meta Title */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={titleValue}
                      onChange={(e) => handleFieldChange(item._id, "metaTitle", e.target.value)}
                      placeholder={item.title}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
                    />
                    <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] mt-1">
                      <span>{titleValue.length}/60 chars</span>
                      <span className={titlePx > 580 ? "text-rose-600 font-bold" : ""}>
                        ~{titlePx}px
                      </span>
                    </div>
                  </td>

                  {/* Meta Description */}
                  <td className="py-3 px-4">
                    <textarea
                      rows={2}
                      value={descValue}
                      onChange={(e) => handleFieldChange(item._id, "metaDescription", e.target.value)}
                      placeholder="Write meta description..."
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
                    />
                    <div className="text-[10px] text-[var(--foreground-muted)] text-right mt-0.5">
                      {descValue.length}/160 chars
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSave(item._id)}
                      disabled={!isDirty || isSaving}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 font-bold shadow-3xs cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : saveStatus[item._id] === "saved" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      <span>{saveStatus[item._id] === "saved" ? "Saved" : "Save"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
