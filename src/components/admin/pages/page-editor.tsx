"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  Globe,
  CheckCircle2,
  AlertCircle,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  ExternalLink,
  Layout,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { createPageAction, updatePageAction } from "@/actions/pages";
import { slugify } from "@/lib/utils";
import { getSiteUrl } from "@/lib/seo/domain";
import { SeoEditorPanel } from "@/components/admin/seo/seo-editor-panel";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { analyzeSeoContent } from "@/lib/seo/analyzer";
import type { ISeoMetadata } from "@/lib/seo/types";

interface PageEditorProps {
  initialData?: {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    contentHtml?: string;
    blocks?: any[];
    template: string;
    status: string;
    showInMenu?: boolean;
    showInFooter?: boolean;
    order?: number;
    seo?: ISeoMetadata;
  };
}

export function PageEditor({ initialData }: PageEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?._id);

  // Core fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugAuto, setIsSlugAuto] = useState(!isEditing && initialData?.slug !== "home");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || "");
  const [template, setTemplate] = useState(initialData?.template || "default");
  const [status, setStatus] = useState(initialData?.status || "published");
  const [showInMenu, setShowInMenu] = useState(initialData?.showInMenu || false);
  const [showInFooter, setShowInFooter] = useState(initialData?.showInFooter || false);
  const [order, setOrder] = useState(initialData?.order || 0);

  const defaultHomeBlocks = [
    {
      type: "hero",
      title: "AI, Technology, Research and Innovation Intelligence",
      subtitle:
        "Independent reporting, frontier model evaluations, and sovereign compute analysis built for engineers, researchers, and technology leaders.",
      settings: {
        badge: "Kraviona AI News Editorial Hub",
        primaryCtaText: "Explore Latest AI News",
        primaryCtaLink: "/category/ai-news",
        secondaryCtaText: "Compare Models",
        secondaryCtaLink: "/category/guides-and-comparisons",
        showOrb: true,
      },
    },
    {
      type: "faq",
      title: "Everything You Need to Know",
      subtitle: "Common questions about Kraviona AI News, frontier models, and AI infrastructure",
      settings: {
        items: [
          {
            question: "What is Kraviona AI News and what does it cover?",
            answer:
              "Kraviona AI News is an independent digital news publication covering artificial intelligence, frontier foundation models, AI research papers, developer tooling, cybersecurity, and global technology policy.",
          },
          {
            question: "How do you evaluate and benchmark AI models?",
            answer:
              "We benchmark models across reasoning accuracy, multilingual comprehension, inference latency, token efficiency, and total deployment cost for engineering teams.",
          },
          {
            question: "Are open-weight models like DeepSeek-R1 and Sarvam-1 completely free to use?",
            answer:
              "Yes. Open-weight models like DeepSeek-R1 and Sarvam-1 can be downloaded freely from Hugging Face and self-hosted locally on your own hardware or Indian cloud instances without paying recurring per-token SaaS subscriptions.",
          },
          {
            question: "How can Indian startups access subsidized GPUs under the IndiaAI Mission?",
            answer:
              "The ₹10,372 crore IndiaAI Mission provides compute vouchers and subsidies for Indian AI startups, researchers, and academic institutions. Eligible teams can apply via the official IndiaAI portal to access subsidized clusters hosted at partner datacenters including CtrlS, Yotta, and Tata Communications.",
          },
          {
            question: "What is the difference between ChatGPT, Claude, and Gemini for Indian developers?",
            answer:
              "Claude 3.5 Sonnet excels at multi-file code refactoring and technical reasoning; Google Gemini 1.5 Pro offers massive 2M token context and native Hindi/Indic corpus grounding; ChatGPT (GPT-4o) provides strong general versatility, voice mode, and multimodal web tools.",
          },
        ],
      },
    },
    {
      type: "text",
      title: "Independent Intelligence for India's AI Ecosystem",
      content: "",
    },
  ];

  const [blocks, setBlocks] = useState<any[]>(() => {
    if (initialData?.blocks && initialData.blocks.length > 0) {
      return initialData.blocks;
    }
    if (initialData?.slug === "home") {
      return defaultHomeBlocks;
    }
    return [];
  });

  // SEO state
  const [seo, setSeo] = useState<ISeoMetadata>(
    initialData?.seo || {
      metaTitle: initialData?.title || "",
      metaDescription: initialData?.excerpt || "",
      schemaType: "WebPage",
      robots: { index: true, follow: true, maxImagePreview: "large" },
      sitemap: { include: true, priority: 0.7, changefreq: "weekly" },
    }
  );

  // UI state
  const [activeTab, setActiveTab] = useState<"content" | "blocks" | "seo" | "preview">("content");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isSlugAuto && initialData?.slug !== "home") {
      setSlug(slugify(val));
    }
  };

  const insertFormatting = (tag: string) => {
    let snippet = "";
    if (tag === "h2") snippet = "\n<h2>Section Heading</h2>\n<p>Content goes here...</p>\n";
    if (tag === "h3") snippet = "\n<h3>Sub-heading</h3>\n";
    if (tag === "b") snippet = "<strong>Bold Text</strong>";
    if (tag === "i") snippet = "<em>Italic Text</em>";
    if (tag === "code") snippet = "\n<pre><code>// Code block</code></pre>\n";
    if (tag === "quote") snippet = "\n<blockquote>Important statement</blockquote>\n";
    if (tag === "list") snippet = "\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n";

    setContentHtml((prev) => prev + snippet);
  };

  const quickAnalysis = useMemo(() => {
    return analyzeSeoContent({
      title,
      slug,
      contentHtml,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      focusKeyword: seo.focusKeyword,
    });
  }, [title, slug, contentHtml, seo]);

  const handleSubmit = async (submitStatus?: string) => {
    setLoading(true);
    setMessage(null);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("slug", slug || slugify(title));
    fd.append("excerpt", excerpt);
    fd.append("contentHtml", contentHtml);
    fd.append("template", template);
    fd.append("status", submitStatus || status);
    fd.append("showInMenu", showInMenu.toString());
    fd.append("showInFooter", showInFooter.toString());
    fd.append("order", String(order));
    fd.append("blocks", JSON.stringify(blocks));

    const updatedSeo = {
      ...seo,
      seoScore: quickAnalysis.score,
    };
    fd.append("seo", JSON.stringify(updatedSeo));

    try {
      let res;
      if (isEditing && initialData?._id) {
        res = await updatePageAction(initialData._id, fd);
      } else {
        res = await createPageAction(fd);
      }

      if (res.success) {
        setMessage({ type: "success", text: "Page updated and revalidated successfully!" });
        setTimeout(() => {
          router.push("/admin/pages");
          router.refresh();
        }, 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to save page" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const previewPath = slug === "home" ? "/" : `/${slug}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-heading)]">
            {isEditing ? `Edit Page: ${title}` : "Create Standalone Page"}
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Author static and directory landing pages with dedicated schema and meta controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {message && (
            <span
              className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                message.type === "success"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
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
            <a
              href={previewPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Live URL
            </a>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("draft")}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-2 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] transition-all shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("published")}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Publish Page
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "content"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
              : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <span>1. Content &amp; Template</span>
        </button>

        <button
          onClick={() => setActiveTab("blocks")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "blocks"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
              : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Layout className="h-3.5 w-3.5" />
          <span>2. Sections &amp; Blocks ({blocks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "seo"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
              : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>3. Full Page SEO Panel</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              quickAnalysis.score >= 80
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : quickAnalysis.score >= 50
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
            }`}
          >
            {quickAnalysis.score}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "preview"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
              : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>4. Live Reading Preview</span>
        </button>
      </div>

      {/* TAB 1: CONTENT & TEMPLATE */}
      {activeTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                Page Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Editorial Standards & Ethics Policy"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 text-base sm:text-lg font-bold text-[var(--color-heading)] outline-none focus:border-[var(--accent)] shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)]">
                  URL Path / Slug
                </label>
                {initialData?.slug !== "home" && (
                  <button
                    type="button"
                    onClick={() => setIsSlugAuto(!isSlugAuto)}
                    className="text-[10px] text-[var(--accent)] font-semibold hover:underline cursor-pointer"
                  >
                    {isSlugAuto ? "Lock Slug" : "Auto-generate"}
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--color-secondary-surface)] px-3 text-xs text-[var(--color-muted-text)]">
                <span>/</span>
                <input
                  type="text"
                  required
                  disabled={initialData?.slug === "home"}
                  value={slug}
                  onChange={(e) => {
                    setIsSlugAuto(false);
                    setSlug(e.target.value);
                  }}
                  className="w-full bg-transparent px-1 py-2 font-mono outline-none text-[var(--color-heading)] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                Excerpt / Meta Summary
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the page purpose."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-3 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Rich Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                  Page Content // Rich Text Editor
                </label>
                <span className="text-[11px] text-[var(--color-muted-text)] font-medium">
                  WYSIWYG Visual, HTML Source &amp; Split Preview
                </span>
              </div>
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="Write page content, editorial charter, or policy terms here..."
                minHeight="440px"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-[var(--color-heading)]">
                Page Attributes
              </h3>

              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Template Layout
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none"
                >
                  <option value="default">Default Article / Editorial</option>
                  <option value="landing">Landing Page Hero</option>
                  <option value="directory">Directory Grid (AI Tools / Models)</option>
                  <option value="legal">Legal &amp; Policy Document</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInMenu}
                    onChange={(e) => setShowInMenu(e.target.checked)}
                    className="rounded accent-[var(--accent)]"
                  />
                  <span className="font-medium text-[var(--color-heading)]">
                    Show link in main Header navigation
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInFooter}
                    onChange={(e) => setShowInFooter(e.target.checked)}
                    className="rounded accent-[var(--accent)]"
                  />
                  <span className="font-medium text-[var(--color-heading)]">
                    Show link in site Footer
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-muted-text)] mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2 outline-none"
                />
              </div>
            </div>

            {/* Quick SEO Health */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
                  SEO Health Score
                </h3>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    quickAnalysis.score >= 80
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : quickAnalysis.score >= 50
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {quickAnalysis.score} / 100
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("seo")}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-light)] py-2 text-xs font-bold text-[var(--accent)] hover:opacity-90 transition-colors cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5" /> Open Full Page SEO Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS & BLOCKS */}
      {activeTab === "blocks" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
                <Layout className="h-4 w-4 text-[var(--accent)]" />
                Page Sections &amp; Block Architecture
              </h2>
              <p className="text-xs text-[var(--color-muted-text)] mt-1">
                Configure hero headlines, call-to-actions, visual panels, and dynamic FAQ blocks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBlocks([
                    ...blocks,
                    {
                      type: "hero",
                      title: "AI, Technology, Research and Innovation Intelligence",
                      subtitle:
                        "Independent reporting, frontier model evaluations, and technology deep dives.",
                      settings: {
                        badge: "Kraviona AI News Editorial Hub",
                        primaryCtaText: "Explore Latest AI News",
                        primaryCtaLink: "/category/ai-news",
                        secondaryCtaText: "Compare Models",
                        secondaryCtaLink: "/category/guides-and-comparisons",
                        showOrb: true,
                      },
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30 hover:opacity-90 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Hero
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlocks([
                    ...blocks,
                    {
                      type: "faq",
                      title: "Frequently Asked Questions",
                      subtitle: "Clear answers to essential AI queries",
                      settings: {
                        items: [{ question: "New Question?", answer: "Comprehensive answer..." }],
                      },
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-secondary-surface)] text-[var(--color-heading)] hover:bg-[var(--border)] text-xs font-bold transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3 w-3" /> Add FAQ Block
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlocks([
                    ...blocks,
                    {
                      type: "text",
                      title: "Section Heading",
                      content: "<p>Custom content block paragraph.</p>",
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-secondary-surface)] text-[var(--color-heading)] hover:bg-[var(--border)] text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Text Block
              </button>
            </div>
          </div>

          {/* Blocks List */}
          <div className="space-y-6">
            {blocks.map((block: any, bIdx: number) => (
              <div
                key={bIdx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--color-muted-text)]">#{bIdx + 1}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent-light)] text-[var(--accent)]">
                      {block.type} Block
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBlocks(blocks.filter((_: any, i: number) => i !== bIdx));
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove Block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* HERO BLOCK CONTROLS */}
                {block.type === "hero" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                          Indicator Badge Text
                        </label>
                        <input
                          type="text"
                          value={block.settings?.badge || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            updated[bIdx].settings.badge = e.target.value;
                            setBlocks(updated);
                          }}
                          placeholder="e.g. Kraviona AI News Editorial Hub"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-2.5 text-xs font-semibold text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex items-center sm:pt-6">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-heading)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={block.settings?.showOrb !== false}
                            onChange={(e) => {
                              const updated = [...blocks];
                              if (!updated[bIdx].settings) updated[bIdx].settings = {};
                              updated[bIdx].settings.showOrb = e.target.checked;
                              setBlocks(updated);
                            }}
                            className="rounded accent-[var(--accent)]"
                          />
                          <span>Show Editorial Hero Accent Panel</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                        Hero H1 Headline
                      </label>
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[bIdx].title = e.target.value;
                          setBlocks(updated);
                        }}
                        placeholder="e.g. AI, Technology, Research and Innovation Intelligence"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-3 text-sm font-bold text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                        Hero 2-Line Subtitle / Description
                      </label>
                      <textarea
                        rows={2}
                        value={block.subtitle || ""}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[bIdx].subtitle = e.target.value;
                          setBlocks(updated);
                        }}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-2.5 text-xs text-[var(--color-body-text)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[var(--color-heading)]">
                          Primary CTA (Button)
                        </label>
                        <input
                          type="text"
                          placeholder="Label (e.g. Explore Latest AI News)"
                          value={block.settings?.primaryCtaText || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            updated[bIdx].settings.primaryCtaText = e.target.value;
                            setBlocks(updated);
                          }}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. /category/ai-news)"
                          value={block.settings?.primaryCtaLink || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            updated[bIdx].settings.primaryCtaLink = e.target.value;
                            setBlocks(updated);
                          }}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 text-xs font-mono text-[var(--color-body-text)]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[var(--color-heading)]">
                          Secondary CTA (Button)
                        </label>
                        <input
                          type="text"
                          placeholder="Label (e.g. Compare Models)"
                          value={block.settings?.secondaryCtaText || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            updated[bIdx].settings.secondaryCtaText = e.target.value;
                            setBlocks(updated);
                          }}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] px-3 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. /category/guides-and-comparisons)"
                          value={block.settings?.secondaryCtaLink || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            updated[bIdx].settings.secondaryCtaLink = e.target.value;
                            setBlocks(updated);
                          }}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 text-xs font-mono text-[var(--color-body-text)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ BLOCK CONTROLS */}
                {block.type === "faq" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                          FAQ Section Title
                        </label>
                        <input
                          type="text"
                          value={block.title || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            updated[bIdx].title = e.target.value;
                            setBlocks(updated);
                          }}
                          placeholder="Frequently Asked Questions"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2.5 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                          FAQ Subtitle
                        </label>
                        <input
                          type="text"
                          value={block.subtitle || ""}
                          onChange={(e) => {
                            const updated = [...blocks];
                            updated[bIdx].subtitle = e.target.value;
                            setBlocks(updated);
                          }}
                          placeholder="Common questions and answers"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                          FAQ Items ({(block.settings?.items || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...blocks];
                            if (!updated[bIdx].settings) updated[bIdx].settings = {};
                            if (!updated[bIdx].settings.items) updated[bIdx].settings.items = [];
                            updated[bIdx].settings.items.push({
                              question: "New Question?",
                              answer: "Answer text...",
                            });
                            setBlocks(updated);
                          }}
                          className="text-[11px] font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add FAQ Item
                        </button>
                      </div>

                      {(block.settings?.items || []).map((faq: any, fIdx: number) => (
                        <div
                          key={fIdx}
                          className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const updated = [...blocks];
                                updated[bIdx].settings.items[fIdx].question = e.target.value;
                                setBlocks(updated);
                              }}
                              placeholder="Question text"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-heading)]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...blocks];
                                updated[bIdx].settings.items = updated[
                                  bIdx
                                ].settings.items.filter((_: any, i: number) => i !== fIdx);
                                setBlocks(updated);
                              }}
                              className="text-[var(--color-muted-text)] hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[bIdx].settings.items[fIdx].answer = e.target.value;
                              setBlocks(updated);
                            }}
                            placeholder="Answer explanation"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] p-2.5 text-xs text-[var(--color-body-text)]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TEXT BLOCK CONTROLS */}
                {block.type === "text" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={block.title || ""}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[bIdx].title = e.target.value;
                          setBlocks(updated);
                        }}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] p-2.5 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
                        Content (HTML or Markdown)
                      </label>
                      <textarea
                        rows={4}
                        value={block.content || ""}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[bIdx].content = e.target.value;
                          setBlocks(updated);
                        }}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-3 text-xs font-mono text-[var(--color-heading)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--color-muted-text)] space-y-2">
                <p>No customized layout blocks configured for this page.</p>
                <p>Click &ldquo;Add Hero&rdquo; or &ldquo;Add FAQ Block&rdquo; above to structure dynamic sections.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FULL SEO PANEL */}
      {activeTab === "seo" && (
        <SeoEditorPanel
          seo={seo}
          onChange={setSeo}
          entityType="page"
          title={title}
          slug={slug}
          contentHtml={contentHtml}
          excerpt={excerpt}
          baseUrl={getSiteUrl()}
        />
      )}

      {/* TAB 3: LIVE PREVIEW */}
      {activeTab === "preview" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-8 shadow-xs space-y-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--color-heading)]">
              {title || "Untitled Page"}
            </h1>
            {excerpt && (
              <p className="text-base text-[var(--color-muted-text)]">{excerpt}</p>
            )}
            <div
              className="prose-article mt-8"
              dangerouslySetInnerHTML={{
                __html: contentHtml || "<p>Write some page content to preview...</p>",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
