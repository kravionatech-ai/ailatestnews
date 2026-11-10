"use client";

import { useState } from "react";
import { X, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { quickUpdatePostAction } from "@/actions/posts";

interface QuickEditPost {
  _id: string;
  title: string;
  slug: string;
  status: string;
  category?: { _id: string; name: string } | string;
  author?: { _id: string; name: string } | string;
  featured?: boolean;
  publishedAt?: string | Date;
  seo?: {
    canonicalUrl?: string;
    robots?: {
      index?: boolean;
    };
  };
}

interface QuickEditDrawerProps {
  post: QuickEditPost | null;
  categories: { _id: string; name: string }[];
  authors: { _id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickEditDrawer({
  post,
  categories,
  authors,
  isOpen,
  onClose,
  onSuccess,
}: QuickEditDrawerProps) {
  if (!isOpen || !post) return null;

  return (
    <QuickEditForm
      post={post}
      categories={categories}
      authors={authors}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function QuickEditForm({
  post,
  categories,
  authors,
  onClose,
  onSuccess,
}: {
  post: QuickEditPost;
  categories: { _id: string; name: string }[];
  authors: { _id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState(post.status);
  const [categoryId, setCategoryId] = useState(
    typeof post.category === "object" ? post.category?._id : post.category || categories[0]?._id || ""
  );
  const [authorId, setAuthorId] = useState(
    typeof post.author === "object" ? post.author?._id : post.author || authors[0]?._id || ""
  );
  const [noindex, setNoindex] = useState(
    post.seo?.robots?.index === false
  );
  const [canonicalUrl, setCanonicalUrl] = useState(post.seo?.canonicalUrl || "");
  const [featured, setFeatured] = useState(post.featured ?? false);
  const [publishedAt, setPublishedAt] = useState(
    post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await quickUpdatePostAction(post._id, {
        title,
        slug,
        status,
        categoryId,
        authorId,
        noindex,
        canonicalUrl,
        featured,
        publishedAt: publishedAt || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to update article");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[var(--color-card-background)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="font-display text-base font-extrabold text-[var(--color-heading)]">Quick Edit</h2>
              <p className="text-[11px] text-[var(--color-muted-text)]">
                Update core attributes without opening the full rich-text editor.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-muted-text)] hover:text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-500/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="quick-edit-form" onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                Article Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2.5 outline-none focus:border-[var(--accent)] font-medium"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                URL Slug
              </label>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-2.5">
                <span className="text-[11px] text-[var(--color-muted-text)]">/blog/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-transparent text-[var(--color-heading)] p-2 text-xs font-mono outline-none"
                />
              </div>
            </div>

            {/* Status & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none focus:border-[var(--accent)]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none focus:border-[var(--accent)]"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Author */}
            {authors.length > 0 && (
              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Author
                </label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none focus:border-[var(--accent)]"
                >
                  {authors.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Published / Scheduled Date */}
            <div>
              <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                Publication Timestamp
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none focus:border-[var(--accent)] font-mono text-[11px]"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                Custom Canonical URL (optional)
              </label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://example.com/original-article"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Featured Story Toggle */}
            <div className="pt-2 border-t border-[var(--border)]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[var(--accent)] accent-[var(--accent)] h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-[var(--color-heading)] flex items-center gap-1">
                    ★ Homepage Featured Story
                  </span>
                  <p className="text-[10px] text-[var(--color-muted-text)]">
                    Promote this published article to the prime editorial slot on the homepage.
                  </p>
                </div>
              </label>
            </div>

            {/* Noindex Toggle */}
            <div className="pt-2 border-t border-[var(--border)]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noindex}
                  onChange={(e) => setNoindex(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-[var(--color-heading)] block">
                    Set Search Engine NoIndex
                  </span>
                  <span className="text-[10px] text-[var(--color-muted-text)] block">
                    Blocks Google &amp; Bing crawlers from indexing this post.
                  </span>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--color-main-background)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quick-edit-form"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? "Saving..." : "Update Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
