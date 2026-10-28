"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  ExternalLink,
  Copy,
  Trash2,
  Zap,
  Globe,
  CheckSquare,
  Square,
  Clock,
  Eye,
  AlertTriangle,
  Send,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  bulkActionPostsAction,
  deletePostAction,
  duplicatePostAction,
} from "@/actions/posts";
import { QuickEditDrawer } from "./quick-edit-drawer";

export interface ManagedPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published" | "scheduled" | "archived";
  category?: { _id: string; name: string; slug: string };
  author?: { _id: string; name: string; email?: string };
  tags?: { _id: string; name: string }[];
  views: number;
  readingTime: number;
  featured?: boolean;
  publishedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    seoScore?: number;
    canonicalUrl?: string;
    indexNowStatus?: string;
    indexNowLastPing?: string | Date;
    robots?: {
      index?: boolean;
      follow?: boolean;
    };
  };
}

interface PostsManagerTableProps {
  initialPosts: ManagedPost[];
  categories: { _id: string; name: string }[];
  authors: { _id: string; name: string }[];
}

export function PostsManagerTable({
  initialPosts,
  categories,
  authors,
}: PostsManagerTableProps) {
  const router = useRouter();

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [seoScoreFilter, setSeoScoreFilter] = useState<string>("all");
  const [specialFilter, setSpecialFilter] = useState<"all" | "featured" | "needs-update" | "missing-meta">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "views-desc" | "seo-desc" | "seo-asc">("date-desc");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Quick edit drawer state
  const [quickEditPost, setQuickEditPost] = useState<ManagedPost | null>(null);

  // Category quick-reassign state in bulk bar
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>("");

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtered and sorted dataset
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesSlug = post.slug.toLowerCase().includes(q);
        const matchesExcerpt = post.excerpt?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug && !matchesExcerpt) return false;
      }

      // 2. Status
      if (statusFilter !== "all" && post.status !== statusFilter) {
        return false;
      }

      // 3. Category
      if (categoryFilter !== "all") {
        if (post.category?._id !== categoryFilter && post.category?.name !== categoryFilter) {
          return false;
        }
      }

      // 4. SEO Score filter
      const score = post.seo?.seoScore ?? 60;
      if (seoScoreFilter === "high" && score < 80) return false;
      if (seoScoreFilter === "medium" && (score < 50 || score >= 80)) return false;
      if (seoScoreFilter === "low" && score >= 50) return false;

      // 5. Special filters
      if (specialFilter === "featured") {
        if (!post.featured) return false;
      }
      if (specialFilter === "needs-update") {
        const pubDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
        const daysOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 90) return false;
      }
      if (specialFilter === "missing-meta") {
        const hasMetaTitle = Boolean(post.seo?.metaTitle?.trim());
        const hasMetaDesc = Boolean(post.seo?.metaDescription?.trim());
        if (hasMetaTitle && hasMetaDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime();
      }
      if (sortBy === "views-desc") {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === "seo-desc") {
        return (b.seo?.seoScore ?? 60) - (a.seo?.seoScore ?? 60);
      }
      if (sortBy === "seo-asc") {
        return (a.seo?.seoScore ?? 60) - (b.seo?.seoScore ?? 60);
      }
      return 0;
    });
  }, [
    initialPosts,
    searchQuery,
    statusFilter,
    categoryFilter,
    seoScoreFilter,
    specialFilter,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Selection helpers
  const allCurrentPageSelected =
    paginatedPosts.length > 0 &&
    paginatedPosts.every((p) => selectedIds.includes(p._id));

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedPosts.some((p) => p._id === id))
      );
    } else {
      const pageIds = paginatedPosts.map((p) => p._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk action handler
  const handleBulkAction = async (
    action:
      | "publish"
      | "draft"
      | "archive"
      | "delete"
      | "category"
      | "noindex"
      | "index"
      | "indexnow"
      | "feature"
      | "unfeature",
    payload?: string
  ) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Permanently delete ${selectedIds.length} article(s)?`)) {
      return;
    }

    setIsBulkLoading(true);
    setBulkFeedback(null);

    try {
      const res = await bulkActionPostsAction(selectedIds, action, payload);
      if (res.success) {
        setBulkFeedback(`Successfully performed '${action}' on ${selectedIds.length} items`);
        setSelectedIds([]);
        router.refresh();
      }
    } catch {
      setBulkFeedback("Bulk operation failed");
    } finally {
      setIsBulkLoading(false);
      setTimeout(() => setBulkFeedback(null), 4000);
    }
  };

  const counts = useMemo(() => {
    return {
      all: initialPosts.length,
      published: initialPosts.filter((p) => p.status === "published").length,
      draft: initialPosts.filter((p) => p.status === "draft").length,
      scheduled: initialPosts.filter((p) => p.status === "scheduled").length,
      archived: initialPosts.filter((p) => p.status === "archived").length,
    };
  }, [initialPosts]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Top Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xs space-y-3.5">
        {/* Status navigation pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "All Posts", count: counts.all },
              { key: "published", label: "Published", count: counts.published },
              { key: "draft", label: "Drafts", count: counts.draft },
              { key: "scheduled", label: "Scheduled", count: counts.scheduled },
              { key: "archived", label: "Archived", count: counts.archived },
            ].map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-2xs"
                      : "bg-slate-50 text-[var(--foreground-secondary)] hover:bg-slate-100"
                  }`}
                >
                  {tab.label} <span className="opacity-70 ml-1">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by title, slug, excerpt..."
              className="w-full rounded-xl border border-[var(--border)] bg-white pl-9 pr-3.5 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--foreground-muted)] font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Score Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--foreground-muted)] font-medium">SEO Score:</span>
            <select
              value={seoScoreFilter}
              onChange={(e) => {
                setSeoScoreFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Scores</option>
              <option value="high">High (80-100)</option>
              <option value="medium">Medium (50-79)</option>
              <option value="low">Needs Attention (&lt;50)</option>
            </select>
          </div>

          {/* Special Audits Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--foreground-muted)] font-medium">Audit:</span>
            <select
              value={specialFilter}
              onChange={(e) => {
                setSpecialFilter(e.target.value as "all" | "featured" | "needs-update" | "missing-meta");
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="all">No Special Filter</option>
              <option value="featured">★ Featured Stories Only</option>
              <option value="needs-update">Needs Update (&gt;90 days old)</option>
              <option value="missing-meta">Missing Meta Description</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-[var(--border)] bg-white px-2.5 py-1.5 outline-none focus:border-[var(--accent)]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="views-desc">Most Viewed</option>
              <option value="seo-desc">Highest SEO Score</option>
              <option value="seo-asc">Lowest SEO Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-[var(--foreground)]">
              Article(s) selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-[var(--accent)] underline ml-2 font-medium"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("feature")}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors shadow-2xs disabled:opacity-50"
              title="Feature on Homepage"
            >
              ★ Feature
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("unfeature")}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Remove from Homepage Featured"
            >
              Unfeature
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("publish")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50"
            >
              Publish
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("draft")}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-[var(--foreground)] font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              Draft
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("archive")}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-[var(--foreground)] font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              Archive
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("indexnow")}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1 disabled:opacity-50"
              title="Ping Bing/IndexNow API"
            >
              <Zap className="h-3 w-3" /> IndexNow
            </button>
            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("noindex")}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-rose-700 font-semibold hover:bg-rose-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              Set Noindex
            </button>

            {/* Quick change category */}
            <div className="flex items-center gap-1">
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="">Move to Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {bulkCategoryTarget && (
                <button
                  onClick={() => {
                    handleBulkAction("category", bulkCategoryTarget);
                    setBulkCategoryTarget("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                >
                  Apply
                </button>
              )}
            </div>

            <button
              disabled={isBulkLoading}
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-2xs flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}

      {bulkFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">
                <th className="p-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-[var(--accent)]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 min-w-[280px]">Article Title &amp; Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">SEO Score</th>
                <th className="p-4">Index Status</th>
                <th className="p-4">Reads</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedPosts.map((post) => {
                const isSelected = selectedIds.includes(post._id);
                const seoScore = post.seo?.seoScore ?? 75;
                const authorName = post.author?.name || "Staff";
                const categoryName = post.category?.name || "Uncategorized";
                const isNoindex = post.seo?.robots?.index === false;
                const isIndexNowSubmitted = post.seo?.indexNowStatus === "submitted";

                return (
                  <tr
                    key={post._id}
                    className={`hover:bg-[var(--background-secondary)] transition-colors group ${
                      isSelected ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleSelectOne(post._id)}
                        className="cursor-pointer text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[var(--accent)]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Title + Slug */}
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        {post.featured && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shrink-0"
                            title="Homepage Featured Story"
                          >
                            ★ Featured
                          </span>
                        )}
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate block"
                        >
                          {post.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--foreground-muted)] font-mono truncate max-w-[200px]">
                          /blog/{post.slug}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">• by {authorName}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="rounded-lg bg-[var(--background-tertiary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--foreground-secondary)]">
                        {categoryName}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] capitalize ${
                          post.status === "published"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : post.status === "scheduled"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : post.status === "archived"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>

                    {/* SEO Score Badge */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-extrabold text-[11px] px-2 py-0.5 rounded-full ${
                          seoScore >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : seoScore >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {seoScore}
                      </span>
                    </td>

                    {/* Index Status */}
                    <td className="p-4">
                      {isNoindex ? (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          NoIndex
                        </span>
                      ) : isIndexNowSubmitted ? (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                          <Zap className="h-2.5 w-2.5" /> Pinged
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          Standard
                        </span>
                      )}
                    </td>

                    {/* Reads (Real view count) */}
                    <td className="p-4 text-[var(--foreground-secondary)] font-medium">
                      {post.views >= 100 ? post.views.toLocaleString() : "—"}
                    </td>

                    {/* Published Date */}
                    <td className="p-4 text-[var(--foreground-muted)]">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Edit */}
                        <button
                          type="button"
                          onClick={() => setQuickEditPost(post)}
                          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Quick Edit in drawer"
                        >
                          <Zap className="h-3.5 w-3.5" />
                        </button>

                        {/* Full Edit */}
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-slate-100 transition-colors"
                          title="Full Editor"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>

                        {/* Public Link */}
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="View Public Post"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={async () => {
                            await duplicatePostAction(post._id);
                            router.refresh();
                          }}
                          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Duplicate as draft"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Delete '${post.title}'?`)) {
                              await deletePostAction(post._id);
                              router.refresh();
                            }
                          }}
                          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedPosts.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-xs text-[var(--foreground-muted)]"
                  >
                    No articles found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredPosts.length)} of {filteredPosts.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-[var(--foreground)]">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Quick Edit Drawer */}
      <QuickEditDrawer
        post={quickEditPost}
        categories={categories}
        authors={authors}
        isOpen={Boolean(quickEditPost)}
        onClose={() => setQuickEditPost(null)}
        onSuccess={() => {
          setQuickEditPost(null);
          router.refresh();
        }}
      />
    </div>
  );
}
