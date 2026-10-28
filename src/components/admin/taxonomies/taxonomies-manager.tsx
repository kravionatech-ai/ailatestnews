"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  Hash,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Globe,
  ExternalLink,
  HelpCircle,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createTagAction,
  updateTagAction,
  deleteTagAction,
  mergeTagsAction,
} from "@/actions/taxonomies";
import { slugify } from "@/lib/utils";
import { SeoEditorPanel } from "@/components/admin/seo/seo-editor-panel";
import type { ISeoMetadata } from "@/lib/seo/types";

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  introHtml?: string;
  image?: string;
  icon?: string;
  color?: string;
  parent?: string | null;
  order?: number;
  postCount?: number;
  faqs?: { question: string; answer: string }[];
  seo?: ISeoMetadata;
}

interface TagData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  seo?: ISeoMetadata;
}

interface TaxonomiesManagerProps {
  categories: CategoryData[];
  tags: TagData[];
}

export function TaxonomiesManager({
  categories: initialCategories,
  tags: initialTags,
}: TaxonomiesManagerProps) {
  const router = useRouter();

  // Active modal states
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<"general" | "intro" | "faqs" | "seo">("general");

  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [isNewTag, setIsNewTag] = useState(false);

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Trigger feedback
  const notifySuccess = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
    router.refresh();
  };

  const notifyError = (msg: string) => {
    setErrorFeedback(msg);
    setTimeout(() => setErrorFeedback(null), 5000);
  };

  // Delete category handler
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category '${name}'? Articles assigned to it must be reassigned first.`)) {
      return;
    }
    const res = await deleteCategoryAction(id);
    if (res.success) {
      notifySuccess(`Category '${name}' deleted successfully.`);
    } else {
      notifyError(res.error || "Failed to delete category");
    }
  };

  // Delete tag handler
  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Delete tag '#${name}'? It will be unlinked from all articles.`)) {
      return;
    }
    const res = await deleteTagAction(id);
    if (res.success) {
      notifySuccess(`Tag '#${name}' removed.`);
    } else {
      notifyError(res.error || "Failed to delete tag");
    }
  };

  // Merge tags handler
  const handleExecuteMerge = async () => {
    if (!mergeSource || !mergeTarget) return;
    setMergeLoading(true);
    try {
      const res = await mergeTagsAction(mergeSource, mergeTarget);
      if (res.success) {
        notifySuccess(res.message || "Tags merged successfully.");
        setIsMergeModalOpen(false);
        setMergeSource("");
        setMergeTarget("");
      } else {
        notifyError(res.error || "Merge failed");
      }
    } catch {
      notifyError("An unexpected error occurred during merge");
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback alerts */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}
      {errorFeedback && (
        <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* CATEGORIES SECTION */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Categories ({initialCategories.length})
              </h2>
            </div>
            <button
              onClick={() => {
                setEditingCategory({
                  _id: "",
                  name: "",
                  slug: "",
                  description: "",
                  introHtml: "",
                  color: "#4f46e5",
                  order: 0,
                  faqs: [],
                  seo: { schemaType: "CollectionPage" },
                });
                setIsNewCategory(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Category
            </button>
          </div>

          <p className="text-[11px] text-[var(--foreground-muted)]">
            Category hub pages serve as primary topical pillars. Slugs automatically generate 301 redirects when renamed.
          </p>

          {/* Category List */}
          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
            {initialCategories.map((cat) => (
              <div
                key={cat._id}
                className="p-3 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#4f46e5" }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--foreground)]">
                        {cat.name}
                      </span>
                      {cat.parent && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-mono">
                          Sub-category
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                      /category/{cat.slug} • {cat.postCount || 0} article(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCategoryModalTab("seo");
                      setEditingCategory(cat);
                      setIsNewCategory(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Edit Dedicated Category SEO Metadata"
                  >
                    <Globe className="h-3 w-3" />
                    <span>SEO</span>
                  </button>

                  <a
                    href={`/category/${cat.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="View Public Hub"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      setCategoryModalTab("general");
                      setEditingCategory(cat);
                      setIsNewCategory(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit Category Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAGS SECTION */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Topic Tags ({initialTags.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-all shadow-2xs"
                title="Consolidate duplicate tags"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Merge Tags
              </button>
              <button
                onClick={() => {
                  setEditingTag({
                    _id: "",
                    name: "",
                    slug: "",
                    description: "",
                    seo: { schemaType: "CollectionPage" },
                  });
                  setIsNewTag(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" /> New Tag
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[var(--foreground-muted)]">
            Tags identify entities (e.g. #claude-3-7, #deepseek-r1). Use the Merge tool to consolidate duplicates.
          </p>

          {/* Tags Grid / List */}
          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            {initialTags.map((tag) => (
              <div
                key={tag._id}
                className="p-3 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors group"
              >
                <div>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    #{tag.name}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-muted)] font-mono block">
                    /tag/{tag.slug} • {tag.postCount || 0} article(s)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTag(tag);
                      setIsNewTag(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Tag & SEO"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteTag(tag._id, tag.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY FULL EDITOR MODAL (with Hub Intro, FAQs & Full SEO Panel) */}
      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory}
          isNew={isNewCategory}
          initialTab={categoryModalTab}
          allCategories={initialCategories}
          onClose={() => setEditingCategory(null)}
          onSuccess={(msg) => {
            setEditingCategory(null);
            notifySuccess(msg);
          }}
        />
      )}

      {/* TAG FULL EDITOR MODAL */}
      {editingTag && (
        <TagEditorModal
          tag={editingTag}
          isNew={isNewTag}
          onClose={() => setEditingTag(null)}
          onSuccess={(msg) => {
            setEditingTag(null);
            notifySuccess(msg);
          }}
        />
      )}

      {/* MERGE TAGS MODAL */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600" /> Merge Duplicate Tags
              </h3>
              <button onClick={() => setIsMergeModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <p className="text-xs text-[var(--foreground-muted)]">
              This will update all articles tagged with the <strong>Source Tag</strong> to point to the <strong>Target Tag</strong>, and permanently delete the Source Tag.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-rose-700 mb-1">
                  Source Tag (Will be merged and deleted):
                </label>
                <select
                  value={mergeSource}
                  onChange={(e) => setMergeSource(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Select source tag...</option>
                  {initialTags.map((t) => (
                    <option key={t._id} value={t._id}>
                      #{t.name} ({t.postCount || 0} articles)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-emerald-700 mb-1">
                  Target Tag (Will absorb articles and remain):
                </label>
                <select
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Select target destination tag...</option>
                  {initialTags
                    .filter((t) => t._id !== mergeSource)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        #{t.name} ({t.postCount || 0} articles)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!mergeSource || !mergeTarget || mergeLoading}
                onClick={handleExecuteMerge}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {mergeLoading ? "Merging..." : "Confirm & Merge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Category Editor Modal with Tabs & SEO Panel
// ─────────────────────────────────────────────────────────────

function CategoryEditorModal({
  category,
  isNew,
  allCategories,
  initialTab = "general",
  onClose,
  onSuccess,
}: {
  category: CategoryData;
  isNew: boolean;
  allCategories: CategoryData[];
  initialTab?: "general" | "intro" | "faqs" | "seo";
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [tab, setTab] = useState<"general" | "intro" | "faqs" | "seo">(initialTab);

  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description || "");
  const [introHtml, setIntroHtml] = useState(category.introHtml || "");
  const [parent, setParent] = useState(category.parent || "");
  const [color, setColor] = useState(category.color || "#4f46e5");
  const [icon, setIcon] = useState(category.icon || "Folder");
  const [order, setOrder] = useState(category.order || 0);

  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(category.faqs || []);
  const [seo, setSeo] = useState<ISeoMetadata>(
    category.seo || {
      metaTitle: category.name ? `${category.name} - Latest News & Analysis` : "",
      metaDescription: category.description || "",
      schemaType: "CollectionPage",
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("slug", slug || slugify(name));
    fd.append("description", description);
    fd.append("introHtml", introHtml);
    fd.append("parent", parent);
    fd.append("color", color);
    fd.append("icon", icon);
    fd.append("order", String(order));
    fd.append("faqs", JSON.stringify(faqs.filter((f) => f.question.trim())));
    fd.append("seo", JSON.stringify(seo));

    try {
      let res;
      if (isNew) {
        res = await createCategoryAction(fd);
      } else {
        res = await updateCategoryAction(category._id, fd);
      }

      if (res.success) {
        onSuccess(isNew ? "Category created!" : "Category updated and 301 redirects synced!");
      } else {
        setError(res.error || "Save failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[var(--foreground)]">
              {isNew ? "Create Category" : `Edit Category: ${category.name}`}
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Manage taxonomy metadata, rich intro content for SEO hub, and FAQ rich snippets.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--border)] text-xs font-semibold">
          {[
            { key: "general", label: "1. Core Details" },
            { key: "intro", label: "2. Hub Intro Content (100-150 words)" },
            { key: "faqs", label: "3. Category FAQs" },
            { key: "seo", label: "4. Full SEO Panel" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                tab === t.key
                  ? "border-[var(--accent)] text-[var(--accent)] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === "general" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (isNew) setSlug(slugify(e.target.value));
                    }}
                    className="w-full rounded-xl border border-[var(--border)] p-2.5 outline-none focus:border-[var(--accent)] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                    Slug (Auto creates 301 on change)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] p-2.5 font-mono outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                  Short Tagline / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise topic overview displayed on category cards and meta descriptions."
                  className="w-full rounded-xl border border-[var(--border)] p-2.5 outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                    Parent Hierarchy
                  </label>
                  <select
                    value={parent}
                    onChange={(e) => setParent(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] p-2 outline-none focus:border-[var(--accent)] bg-white"
                  >
                    <option value="">None (Top Level Category)</option>
                    {allCategories
                      .filter((c) => c._id !== category._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full rounded-xl border p-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] p-2 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "intro" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                  Rich Text Category Hub Intro (100–150 words)
                </label>
                <p className="text-[11px] text-[var(--foreground-muted)] mb-2">
                  This text appears at the top of the category hub page to provide search engines with contextual semantic depth.
                </p>
                <textarea
                  rows={8}
                  value={introHtml}
                  onChange={(e) => setIntroHtml(e.target.value)}
                  placeholder="<p>Comprehensive coverage of artificial intelligence models, benchmark breakdowns, and enterprise deployment strategies...</p>"
                  className="w-full rounded-2xl border border-[var(--border)] p-4 text-xs font-mono outline-none focus:border-[var(--accent)] leading-relaxed"
                />
              </div>
            </div>
          )}

          {tab === "faqs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">
                    Category Hub FAQs
                  </h4>
                  <p className="text-[11px] text-[var(--foreground-muted)]">
                    Injected into FAQPage JSON-LD schema on the category page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  + Add FAQ
                </button>
              </div>

              {faqs.map((f, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700">FAQ #{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={f.question}
                    onChange={(e) => {
                      const next = [...faqs];
                      const item = next[i];
                      if (item) {
                        next[i] = { question: e.target.value, answer: item.answer };
                        setFaqs(next);
                      }
                    }}
                    placeholder="Question..."
                    className="w-full rounded-lg border p-2 text-xs bg-white"
                  />
                  <textarea
                    rows={2}
                    value={f.answer}
                    onChange={(e) => {
                      const next = [...faqs];
                      const item = next[i];
                      if (item) {
                        next[i] = { question: item.question, answer: e.target.value };
                        setFaqs(next);
                      }
                    }}
                    placeholder="Answer..."
                    className="w-full rounded-lg border p-2 text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "seo" && (
            <SeoEditorPanel
              seo={seo}
              onChange={setSeo}
              entityType="category"
              title={name}
              slug={slug}
              excerpt={description}
              baseUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ailatestnews.in"}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? "Saving..." : "Save Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tag Editor Modal
// ─────────────────────────────────────────────────────────────

function TagEditorModal({
  tag,
  isNew,
  onClose,
  onSuccess,
}: {
  tag: TagData;
  isNew: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [name, setName] = useState(tag.name);
  const [slug, setSlug] = useState(tag.slug);
  const [description, setDescription] = useState(tag.description || "");
  const [seo, setSeo] = useState<ISeoMetadata>(
    tag.seo || {
      metaTitle: `${tag.name} - Latest News`,
      schemaType: "CollectionPage",
    }
  );
  const [showSeo, setShowSeo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("slug", slug || slugify(name));
    fd.append("description", description);
    fd.append("seo", JSON.stringify(seo));

    try {
      let res;
      if (isNew) {
        res = await createTagAction(fd);
      } else {
        res = await updateTagAction(tag._id, fd);
      }

      if (res.success) {
        onSuccess(isNew ? "Tag created!" : "Tag updated!");
      } else {
        setError(res.error || "Save failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {isNew ? "Create Tag" : `Edit Tag: #${tag.name}`}
          </h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-400 hover:text-slate-700" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
              Tag Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (isNew) setSlug(slugify(e.target.value));
              }}
              className="w-full rounded-xl border border-[var(--border)] p-2.5 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
              Slug
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] p-2 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--foreground-secondary)] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topic description for hub page..."
              className="w-full rounded-xl border border-[var(--border)] p-2 outline-none"
            />
          </div>

          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <Globe className="h-3.5 w-3.5" />
              {showSeo ? "Hide SEO Panel" : "Customize Tag SEO & Social Meta"}
            </button>

            {showSeo && (
              <div className="mt-3">
                <SeoEditorPanel
                  seo={seo}
                  onChange={setSeo}
                  entityType="tag"
                  title={name}
                  slug={slug}
                  excerpt={description}
                  baseUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ailatestnews.in"}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all"
            >
              {loading ? "Saving..." : "Save Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
