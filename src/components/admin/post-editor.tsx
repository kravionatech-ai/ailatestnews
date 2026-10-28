"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  Sparkles,
  Globe,
  Plus,
  Trash2,
  History,
  RotateCcw,
  HelpCircle,
  Link as LinkIcon,
  Crosshair,
  X,
  FileCheck,
} from "lucide-react";
import {
  createPostAction,
  updatePostAction,
  getPostRevisionsAction,
  restorePostRevisionAction,
} from "@/actions/posts";
import { createCategoryAction, createTagAction } from "@/actions/taxonomies";
import { slugify, formatDate } from "@/lib/utils";
import { SeoEditorPanel } from "@/components/admin/seo/seo-editor-panel";
import { analyzeSeoContent } from "@/lib/seo/analyzer";
import type { ISeoMetadata } from "@/lib/seo/types";

interface PostEditorProps {
  initialData?: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    contentHtml: string;
    category: string;
    tags?: string[];
    author?: string;
    status: string;
    coverImage?: string;
    coverImageAlt?: string;
    coverImageCaption?: string;
    focalPoint?: { x: number; y: number };
    relatedPosts?: string[];
    faqs?: { question: string; answer: string }[];
    scheduledAt?: string | Date;
    featured?: boolean;
    seo?: ISeoMetadata;
  };
  categories: { _id: string; name: string }[];
  allTags?: { _id: string; name: string; slug: string }[];
  allAuthors?: { _id: string; name: string }[];
  publishedPosts?: { _id: string; title: string; slug: string }[];
}

export function PostEditor({
  initialData,
  categories: initialCategories,
  allTags: initialTags = [],
  allAuthors = [],
  publishedPosts = [],
}: PostEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?._id);
  const postId = initialData?._id || "new";

  // Taxonomy lists with local append support
  const [categories, setCategories] = useState(initialCategories);
  const [tagsList, setTagsList] = useState(initialTags);

  // Form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugAuto, setIsSlugAuto] = useState(!isEditing);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || "");
  const [category, setCategory] = useState(
    initialData?.category || initialCategories[0]?._id || ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags || []
  );
  const [author, setAuthor] = useState(
    initialData?.author || allAuthors[0]?._id || ""
  );
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : ""
  );
  const [featured, setFeatured] = useState(initialData?.featured || false);

  // Media states
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [coverImageAlt, setCoverImageAlt] = useState(initialData?.coverImageAlt || "");
  const [coverImageCaption, setCoverImageCaption] = useState(initialData?.coverImageCaption || "");
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(
    initialData?.focalPoint || { x: 50, y: 50 }
  );

  // Related posts & FAQ states
  const [relatedPosts, setRelatedPosts] = useState<string[]>(
    initialData?.relatedPosts || []
  );
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(
    initialData?.faqs || []
  );

  // Reusable SEO state
  const [seo, setSeo] = useState<ISeoMetadata>(
    initialData?.seo || {
      metaTitle: initialData?.title || "",
      metaDescription: initialData?.excerpt || "",
      focusKeyword: "",
      schemaType: "NewsArticle",
      robots: { index: true, follow: true, maxImagePreview: "large" },
      sitemap: { include: true, priority: 0.8, changefreq: "daily" },
    }
  );

  // UI state
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "faqs-related" | "preview">("content");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals & Drawers
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  // Autosave banner
  const [hasAutosaveDraft, setHasAutosaveDraft] = useState(false);
  const [autosaveTimestamp, setAutosaveTimestamp] = useState<string | null>(null);

  // Check for autosave on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`post_draft_${postId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title && parsed.title !== initialData?.title) {
          setHasAutosaveDraft(true);
          setAutosaveTimestamp(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString() : null);
        }
      }
    } catch {
      // ignore
    }
  }, [postId, initialData?.title]);

  // Periodic autosave to LocalStorage every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      if (title.trim()) {
        try {
          const draftPayload = {
            title,
            slug,
            excerpt,
            contentHtml,
            category,
            selectedTags,
            coverImage,
            coverImageAlt,
            coverImageCaption,
            faqs,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(`post_draft_${postId}`, JSON.stringify(draftPayload));
        } catch {
          // ignore
        }
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [title, slug, excerpt, contentHtml, category, selectedTags, coverImage, coverImageAlt, coverImageCaption, faqs, postId]);

  const restoreAutosaveDraft = () => {
    try {
      const saved = localStorage.getItem(`post_draft_${postId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.contentHtml) setContentHtml(parsed.contentHtml);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
        if (parsed.coverImage) setCoverImage(parsed.coverImage);
        if (parsed.coverImageAlt) setCoverImageAlt(parsed.coverImageAlt);
        if (parsed.coverImageCaption) setCoverImageCaption(parsed.coverImageCaption);
        if (Array.isArray(parsed.faqs)) {
          setFaqs(
            parsed.faqs.map((f: { question?: string; answer?: string }) => ({
              question: f.question || "",
              answer: f.answer || "",
            }))
          );
        }
        setHasAutosaveDraft(false);
        setMessage({ type: "success", text: "Restored unsaved draft from local storage." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to restore autosaved draft." });
    }
  };

  const dismissAutosaveDraft = () => {
    localStorage.removeItem(`post_draft_${postId}`);
    setHasAutosaveDraft(false);
  };

  // Title change handler
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isSlugAuto) {
      setSlug(slugify(val));
    }
  };

  // Content formatting helpers
  const insertFormatting = (tag: string) => {
    let snippet = "";
    if (tag === "h2") snippet = "\n<h2>Section Heading</h2>\n<p>Content goes here...</p>\n";
    if (tag === "h3") snippet = "\n<h3>Sub-section Heading</h3>\n";
    if (tag === "b") snippet = "<strong>Bold Text</strong>";
    if (tag === "i") snippet = "<em>Italic Text</em>";
    if (tag === "code") snippet = "\n<pre><code>// Insert code snippet\nconst response = await ai.generate();</code></pre>\n";
    if (tag === "quote") snippet = "\n<blockquote>Insightful perspective or announcement summary.</blockquote>\n";
    if (tag === "list") snippet = "\n<ul>\n  <li>Key feature 1</li>\n  <li>Key feature 2</li>\n</ul>\n";
    if (tag === "callout") snippet = '\n<div class="p-4 rounded-xl bg-indigo-50 border-l-4 border-indigo-600 my-4 text-xs"><strong>Key Takeaway:</strong> Foundational benchmark result.</div>\n';

    setContentHtml((prev) => prev + snippet);
  };

  // Real-time SEO analysis
  const quickAnalysis = useMemo(() => {
    return analyzeSeoContent({
      title,
      slug,
      contentHtml,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      focusKeyword: seo.focusKeyword,
      coverImage,
    });
  }, [title, slug, contentHtml, seo, coverImage]);

  // AI Alt Text Generator
  const generateAltTextWithAi = () => {
    if (!title) return;
    const generated = `Editorial illustration and visual preview for ${title}`;
    setCoverImageAlt(generated);
  };

  // Inline Category Creation
  const handleCreateCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const fd = new FormData();
    fd.append("name", newCategoryName.trim());
    fd.append("slug", slugify(newCategoryName.trim()));

    const res = await createCategoryAction(fd);
    if (res.success && res.category) {
      setCategories((prev) => [...prev, { _id: res.category._id, name: res.category.name }]);
      setCategory(res.category._id);
      setNewCategoryName("");
      setShowCategoryModal(false);
    }
  };

  // Inline Tag Creation
  const handleCreateTagInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const fd = new FormData();
    fd.append("name", newTagName.trim());
    fd.append("slug", slugify(newTagName.trim()));

    const res = await createTagAction(fd);
    if (res.success && res.tag) {
      setTagsList((prev) => [...prev, { _id: res.tag._id, name: res.tag.name, slug: res.tag.slug }]);
      setSelectedTags((prev) => Array.from(new Set([...prev, res.tag._id])));
      setNewTagName("");
      setShowTagModal(false);
    }
  };

  // Fetch Revisions
  const handleOpenRevisions = async () => {
    if (!initialData?._id) return;
    setShowRevisionsModal(true);
    setRevisionsLoading(true);
    try {
      const res = await getPostRevisionsAction(initialData._id);
      if (res.success) {
        setRevisions(res.revisions || []);
      }
    } catch {
      // ignore
    } finally {
      setRevisionsLoading(false);
    }
  };

  // Restore Revision
  const handleRestoreRevision = async (revId: string) => {
    if (!confirm("Are you sure you want to restore this revision? Current draft changes will be superseded.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await restorePostRevisionAction(revId);
      if (res.success) {
        setMessage({ type: "success", text: "Article successfully restored to chosen revision!" });
        setShowRevisionsModal(false);
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to restore revision." });
    } finally {
      setLoading(false);
    }
  };

  // FAQ helpers
  const addFaqItem = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const updateFaqItem = (index: number, field: "question" | "answer", val: string) => {
    setFaqs((prev) => {
      const next = [...prev];
      const item = next[index];
      if (item) {
        next[index] = {
          question: field === "question" ? val : item.question,
          answer: field === "answer" ? val : item.answer,
        };
      }
      return next;
    });
  };

  const removeFaqItem = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (submitStatus?: string) => {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("contentHtml", contentHtml);
    formData.append("category", category);
    formData.append("tags", JSON.stringify(selectedTags));
    formData.append("author", author);
    formData.append("status", submitStatus || status);
    formData.append("scheduledAt", scheduledAt || "");
    formData.append("coverImage", coverImage);
    formData.append("coverImageAlt", coverImageAlt);
    formData.append("coverImageCaption", coverImageCaption);
    formData.append("focalPoint", JSON.stringify(focalPoint));
    formData.append("relatedPosts", JSON.stringify(relatedPosts));
    formData.append("faqs", JSON.stringify(faqs.filter((f) => f.question.trim())));
    formData.append("featured", featured.toString());

    // Pack complete SEO metadata
    const updatedSeoWithScore = {
      ...seo,
      seoScore: quickAnalysis.score,
    };
    formData.append("seo", JSON.stringify(updatedSeoWithScore));

    try {
      let res;
      if (isEditing && initialData?._id) {
        res = await updatePostAction(initialData._id, formData);
      } else {
        res = await createPostAction(formData);
      }

      if (res.success) {
        // Clear local storage draft
        localStorage.removeItem(`post_draft_${postId}`);
        setMessage({ type: "success", text: "Article saved and index updated successfully!" });
        setTimeout(() => {
          router.push("/admin/posts");
          router.refresh();
        }, 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to save article" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Crash Recovery / Autosave Banner */}
      {hasAutosaveDraft && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-4 text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Unsaved Local Draft Detected:</strong> You have unsaved changes from a previous session
              {autosaveTimestamp && ` (${autosaveTimestamp})`}.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={restoreAutosaveDraft}
              className="px-3 py-1 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              Restore Changes
            </button>
            <button
              onClick={dismissAutosaveDraft}
              className="px-2 py-1 text-amber-700 hover:underline font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            {isEditing ? "Edit Article" : "Compose New Article"}
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Author with real-time SEO scoring, Claude AI generation, FAQ JSON-LD, and revisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {message && (
            <span
              className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {message.text}
            </span>
          )}

          {isEditing && (
            <button
              type="button"
              onClick={handleOpenRevisions}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              title="View revision history"
            >
              <History className="h-3.5 w-3.5 text-indigo-600" /> Revisions
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("draft")}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(status === "scheduled" ? "scheduled" : "published")}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {status === "scheduled" ? "Schedule Article" : "Publish Now"}
          </button>
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "content"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold shadow-3xs"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <span>1. Content &amp; Media</span>
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "seo"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold shadow-3xs"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>2. Advanced SEO Engine</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              quickAnalysis.score >= 80
                ? "bg-emerald-100 text-emerald-800"
                : quickAnalysis.score >= 50
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {quickAnalysis.score}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab("faqs-related")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "faqs-related"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold shadow-3xs"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>3. FAQs &amp; Related Stories ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "preview"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold shadow-3xs"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>4. Live Preview</span>
        </button>
      </div>

      {/* TAB 1: CONTENT & MEDIA */}
      {activeTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                Headline (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. OpenAI Announces GPT-5: Architectural Innovations and Benchmark Results"
                className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 text-base sm:text-lg font-bold outline-none focus:border-[var(--accent)] shadow-2xs"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)]">
                  URL Slug
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugAuto(!isSlugAuto)}
                  className="text-[10px] text-[var(--accent)] font-semibold hover:underline"
                >
                  {isSlugAuto ? "Lock Slug" : "Auto-generate"}
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 text-xs text-[var(--foreground-muted)]">
                <span>/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugAuto(false);
                    setSlug(e.target.value);
                  }}
                  className="w-full bg-transparent px-1 py-2 font-mono outline-none text-[var(--foreground)]"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
                Summary / Excerpt (Lead Paragraph)
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A concise, high-signal summary of the breakthrough and its impact."
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-xs outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Rich Editor Toolbar & Area */}
            <div className="rounded-2xl border border-[var(--border)] bg-white shadow-2xs overflow-hidden">
              <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--background-secondary)] p-2">
                <button
                  type="button"
                  onClick={() => insertFormatting("h2")}
                  className="p-1.5 rounded hover:bg-white text-xs font-bold"
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("h3")}
                  className="p-1.5 rounded hover:bg-white text-xs font-bold"
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </button>
                <span className="h-4 w-px bg-slate-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("b")}
                  className="p-1.5 rounded hover:bg-white"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("i")}
                  className="p-1.5 rounded hover:bg-white"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <span className="h-4 w-px bg-slate-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("code")}
                  className="p-1.5 rounded hover:bg-white"
                  title="Code snippet"
                >
                  <Code className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("quote")}
                  className="p-1.5 rounded hover:bg-white"
                  title="Blockquote"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("list")}
                  className="p-1.5 rounded hover:bg-white"
                  title="Bulleted List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("callout")}
                  className="p-1.5 rounded hover:bg-white text-[11px] font-semibold text-[var(--accent)]"
                  title="Callout Box"
                >
                  + Callout
                </button>
              </div>

              <textarea
                rows={16}
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="Write article HTML or markdown here..."
                className="w-full p-4 font-mono text-xs leading-relaxed outline-none"
              />
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Publishing Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Document Settings
              </h3>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                  <option value="scheduled">Scheduled (Future)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Scheduled Date Picker */}
              {status === "scheduled" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                    Scheduled Publication Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)] font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Author */}
              {allAuthors.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                    Assigned Author
                  </label>
                  <select
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                  >
                    {allAuthors.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category with Inline New Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-[10px] text-[var(--accent)] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> New
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags with Inline New Tag */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                    Topic Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTagModal(true)}
                    className="text-[10px] text-[var(--accent)] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> New Tag
                  </button>
                </div>

                {/* Selected Tag Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTags.map((tId) => {
                    const tagObj = tagsList.find((t) => t._id === tId);
                    return (
                      <span
                        key={tId}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                      >
                        #{tagObj?.name || tId}
                        <button
                          type="button"
                          onClick={() => setSelectedTags((prev) => prev.filter((id) => id !== tId))}
                          className="hover:text-rose-600"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedTags((prev) => Array.from(new Set([...prev, e.target.value])));
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                >
                  <option value="">+ Add an existing tag...</option>
                  {tagsList
                    .filter((t) => !selectedTags.includes(t._id))
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Featured Story Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-[var(--border)]">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[var(--accent)] h-4 w-4"
                />
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  Highlight as Featured Story
                </span>
              </label>
            </div>

            {/* Media & Cover Image Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Featured Cover Image
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                  Image URL (1200x630 optimal)
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Alt Text (SEO Essential) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                    Image Alt Text <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateAltTextWithAi}
                    className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> AI Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={coverImageAlt}
                  onChange={(e) => setCoverImageAlt(e.target.value)}
                  placeholder="Accurate description for screen readers and SEO"
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-secondary)] mb-1">
                  Photo Caption / Credit
                </label>
                <input
                  type="text"
                  value={coverImageCaption}
                  onChange={(e) => setCoverImageCaption(e.target.value)}
                  placeholder="Credit: TechCrunch / Midjourney"
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Focal Point Picker */}
              {coverImage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--foreground-secondary)] flex items-center gap-1">
                      <Crosshair className="h-3.5 w-3.5 text-indigo-600" />
                      Focal Point ({focalPoint.x}%, {focalPoint.y}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFocalPoint({ x: 50, y: 50 })}
                      className="text-[10px] text-slate-500 hover:underline"
                    >
                      Reset Center
                    </button>
                  </div>
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                      setFocalPoint({ x, y });
                    }}
                    className="relative w-full h-32 rounded-xl overflow-hidden cursor-crosshair border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Crop Preview"
                      className="w-full h-full object-cover"
                    />
                    <div
                      style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-indigo-600 shadow-md pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick SEO Health Snapshot */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Live SEO Health
                </h3>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    quickAnalysis.score >= 80
                      ? "bg-green-100 text-green-700"
                      : quickAnalysis.score >= 50
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {quickAnalysis.score} / 100
                </span>
              </div>

              <p className="text-[11px] text-[var(--foreground-muted)]">
                {quickAnalysis.checklist.filter((c) => c.status === "pass").length} of{" "}
                {quickAnalysis.checklist.length} audit checks passing.
              </p>

              <button
                type="button"
                onClick={() => setActiveTab("seo")}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" /> Open Full SEO Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED SEO ENGINE */}
      {activeTab === "seo" && (
        <SeoEditorPanel
          seo={seo}
          onChange={setSeo}
          entityType="post"
          title={title}
          slug={slug}
          contentHtml={contentHtml}
          coverImage={coverImage}
          excerpt={excerpt}
          baseUrl={process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com"}
        />
      )}

      {/* TAB 3: FAQS & RELATED STORIES */}
      {activeTab === "faqs-related" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Post-Level FAQ Builder */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Post-Level FAQs (FAQPage JSON-LD)
                </h2>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Add Q&amp;A pairs rendered as accordions and automatically injected into Google Schema.
                </p>
              </div>
              <button
                type="button"
                onClick={addFaqItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Q&amp;A
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaqItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaqItem(idx, "question", e.target.value)}
                    placeholder="e.g. Is this model open source for commercial use in India?"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none font-semibold focus:border-[var(--accent)]"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaqItem(idx, "answer", e.target.value)}
                    placeholder="Clear, authoritative answer explaining the terms or benchmarks."
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
              ))}

              {faqs.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No FAQs added yet. Click &quot;Add Q&amp;A&quot; to enrich this article with FAQPage rich snippets.
                </div>
              )}
            </div>
          </div>

          {/* Related Posts Curated Picker */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-5">
            <div className="border-b border-[var(--border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Curated Related Articles (Max 4)
              </h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Explicitly select stories to recommend at the end of this article.
              </p>
            </div>

            {/* Selected Related Posts */}
            <div className="space-y-2">
              {relatedPosts.map((rId) => {
                const postObj = publishedPosts.find((p) => p._id === rId);
                return (
                  <div
                    key={rId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-semibold text-[var(--foreground)]"
                  >
                    <span className="truncate pr-2">{postObj?.title || rId}</span>
                    <button
                      type="button"
                      onClick={() => setRelatedPosts((prev) => prev.filter((id) => id !== rId))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {relatedPosts.length < 4 && (
                <div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        setRelatedPosts((prev) => Array.from(new Set([...prev, e.target.value])));
                      }
                    }}
                    className="w-full rounded-xl border border-dashed border-slate-300 p-2.5 text-xs outline-none focus:border-[var(--accent)] bg-slate-50"
                  >
                    <option value="">+ Search &amp; attach a related article...</option>
                    {publishedPosts
                      .filter((p) => p._id !== initialData?._id && !relatedPosts.includes(p._id))
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE PREVIEW */}
      {activeTab === "preview" && (
        <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-xs space-y-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]">
              {title || "Untitled Article"}
            </h1>
            <p className="text-base text-[var(--foreground-muted)]">
              {excerpt || "Excerpt preview..."}
            </p>
            {coverImage && (
              <figure className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt={coverImageAlt || "Cover Preview"}
                  className="w-full rounded-2xl max-h-96 object-cover"
                />
                {coverImageCaption && (
                  <figcaption className="text-center text-xs text-slate-500 mt-2">
                    {coverImageCaption}
                  </figcaption>
                )}
              </figure>
            )}
            <div
              className="prose-article mt-8"
              dangerouslySetInnerHTML={{
                __html: contentHtml || "<p>Write some content to preview...</p>",
              }}
            />

            {/* FAQs Preview */}
            {faqs.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[var(--border)] space-y-3">
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Frequently Asked Questions
                </h3>
                {faqs.map((f, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="font-bold text-xs text-[var(--foreground)]">{f.question}</p>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">{f.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Create New Category</h3>
            <form onSubmit={handleCreateCategoryInline} className="space-y-3">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Autonomous Agents"
                className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs outline-none focus:border-[var(--accent)]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                >
                  Create &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Create Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Create New Tag</h3>
            <form onSubmit={handleCreateTagInline} className="space-y-3">
              <input
                type="text"
                required
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. claude-3-7"
                className="w-full rounded-xl border border-[var(--border)] p-2.5 text-xs outline-none focus:border-[var(--accent)]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
                >
                  Create &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revisions History Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" /> Revision History
              </h3>
              <button onClick={() => setShowRevisionsModal(false)}>
                <X className="h-4 w-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            {revisionsLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">Loading revisions...</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">
                        Version {rev.version}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatDate(rev.createdAt)} • by {rev.author?.name || "Staff"}
                      </span>
                      {rev.changeNote && (
                        <span className="text-[10px] text-indigo-700 font-medium block mt-0.5">
                          {rev.changeNote}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev._id)}
                      className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-[11px]"
                    >
                      Restore
                    </button>
                  </div>
                ))}

                {revisions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No revision snapshots recorded yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
