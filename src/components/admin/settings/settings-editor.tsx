"use client";

import { useState, useTransition } from "react";
import {
  Globe,
  FileCode,
  Building,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  HelpCircle,
  ExternalLink,
  Compass,
  Plus,
  Trash2,
} from "lucide-react";
import { saveGlobalSettingsAction } from "@/actions/settings";

interface SettingsEditorProps {
  initialSettings: any;
}

export function SettingsEditor({ initialSettings }: SettingsEditorProps) {
  const [activeTab, setActiveTab] = useState<
    "identity" | "templates" | "organization" | "verification" | "robots" | "navigation"
  >("identity");

  const [settings, setSettings] = useState(initialSettings || {});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const defaultNav = [
    { label: "Home", href: "/", order: 1 },
    { label: "AI News", href: "/category/ai-news", order: 2 },
    { label: "AI Models", href: "/category/model-launches", order: 3 },
    { label: "AI Research", href: "/category/research", order: 4 },
    { label: "AI Tools", href: "/category/ai-tools", order: 5 },
    { label: "Startups", href: "/category/startups", order: 6 },
    { label: "Cybersecurity", href: "/category/cybersecurity", order: 7 },
    { label: "Technology", href: "/category/technology", order: 8 },
  ];

  const defaultFooter = {
    aboutText:
      "Kraviona AI News — AI, Technology, Research and Innovation Intelligence. Independent reporting on foundational models, research breakthroughs, AI tools, startups, cybersecurity, and technology.",
    copyrightText: "Kraviona AI News (ainews.kraviona.com). All rights reserved.",
    sections: [
      {
        title: "Categories",
        links: [
          { label: "AI News", href: "/category/ai-news" },
          { label: "AI Models", href: "/category/model-launches" },
          { label: "AI Research", href: "/category/research" },
          { label: "AI Tools", href: "/category/ai-tools" },
          { label: "Startups", href: "/category/startups" },
          { label: "Cybersecurity", href: "/category/cybersecurity" },
          { label: "Technology", href: "/category/technology" },
        ],
      },
      {
        title: "Directories",
        links: [
          { label: "AI Tools Directory", href: "/ai-tools" },
          { label: "Model Launches Timeline", href: "/model-launches" },
          { label: "India AI Hub", href: "/india-ai" },
          { label: "Article Archive", href: "/archive" },
          { label: "Search Portal", href: "/search" },
        ],
      },
      {
        title: "Editorial & Legal",
        links: [
          { label: "About Kraviona", href: "/about" },
          { label: "Editorial Standards", href: "/editorial-policy" },
          { label: "Contact", href: "/contact" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
        ],
      },
    ],
  };

  const [navItems, setNavItems] = useState(
    Array.isArray(settings.navigation) && settings.navigation.length > 0
      ? settings.navigation
      : defaultNav
  );

  const [footerConfig, setFooterConfig] = useState(
    settings.footer?.sections ? settings.footer : defaultFooter
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      setFeedback(null);
      const res = await saveGlobalSettingsAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Settings saved successfully!" });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save settings." });
      }
    });
  };

  const inputCls =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-xs font-medium text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none focus:border-[var(--accent)]";
  const labelCls =
    "block text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border)] pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "identity"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Globe className="h-4 w-4" /> Site Identity &amp; Defaults
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "templates"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <FileCode className="h-4 w-4" /> SEO Metadata Templates
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "organization"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Building className="h-4 w-4" /> Schema &amp; Organization
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("verification")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "verification"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <KeyRound className="h-4 w-4" /> Search Console &amp; IndexNow
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("robots")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "robots"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Layers className="h-4 w-4" /> Robots.txt &amp; Telemetry
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("navigation")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "navigation"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--color-secondary-surface)] text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
          }`}
        >
          <Compass className="h-4 w-4" /> Navigation &amp; Footer
        </button>
      </div>

      {/* Hidden inputs to serialize Navigation and Footer */}
      <input type="hidden" name="navigation" value={JSON.stringify(navItems)} />
      <input type="hidden" name="footer" value={JSON.stringify(footerConfig)} />

      {/* ──────────────── TAB 1: SITE IDENTITY & DEFAULTS ──────────────── */}
      {activeTab === "identity" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--accent)]" />
              Site Identity &amp; Global SEO Defaults
            </h2>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Configure publication branding, canonical base URL, and fallback OpenGraph visuals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Publication Name</label>
              <input
                type="text"
                name="siteName"
                defaultValue={settings.siteName || "Kraviona AI News"}
                className={inputCls}
                placeholder="Kraviona AI News"
                required
              />
            </div>

            <div>
              <label className={labelCls}>Canonical Site URL (Production)</label>
              <input
                type="url"
                name="siteUrl"
                defaultValue={settings.siteUrl || "https://ainews.kraviona.com"}
                className={`${inputCls} font-mono`}
                placeholder="https://ainews.kraviona.com"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Global Tagline</label>
            <input
              type="text"
              name="tagline"
              defaultValue={settings.tagline || "AI, Technology, Research and Innovation Intelligence"}
              className={inputCls}
              placeholder="AI, Technology, Research and Innovation Intelligence"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Meta Title Separator</label>
              <select
                name="separator"
                defaultValue={settings.separator || "|"}
                className={inputCls}
              >
                <option value="|">| (Pipe)</option>
                <option value="-">- (Hyphen)</option>
                <option value="—">— (Em-dash)</option>
                <option value="•">• (Bullet)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Default Language</label>
              <input
                type="text"
                name="language"
                defaultValue={settings.language || "en-IN"}
                className={`${inputCls} font-mono`}
                placeholder="en-IN"
              />
            </div>

            <div>
              <label className={labelCls}>Timezone</label>
              <input
                type="text"
                name="timezone"
                defaultValue={settings.timezone || "Asia/Kolkata"}
                className={`${inputCls} font-mono`}
                placeholder="Asia/Kolkata"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Default OpenGraph Image URL</label>
              <input
                type="url"
                name="defaultOgImage"
                defaultValue={
                  settings.defaultOgImage ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                }
                className={`${inputCls} font-mono`}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className={labelCls}>Favicon Path / URL</label>
              <input
                type="text"
                name="favicon"
                defaultValue={settings.favicon || "/favicon.ico"}
                className={`${inputCls} font-mono`}
                placeholder="/favicon.ico"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: SEO TEMPLATES ──────────────── */}
      {activeTab === "templates" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FileCode className="h-4 w-4 text-[var(--accent)]" />
              Automated Metadata Templates
            </h2>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Define fallback metadata patterns for each entity type when an item lacks a custom override.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-mono text-[var(--accent)] bg-[var(--accent-light)] p-2.5 rounded-xl border border-[var(--accent)]/30">
              <span className="font-bold">Supported Variables:</span>
              <span>&#123;title&#125;</span>
              <span>&#123;site&#125;</span>
              <span>&#123;category&#125;</span>
              <span>&#123;author&#125;</span>
              <span>&#123;year&#125;</span>
              <span>&#123;month&#125;</span>
              <span>&#123;excerpt&#125;</span>
              <span>&#123;separator&#125;</span>
            </div>
          </div>

          {/* Post Template */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
              Article / Post Pages (/blog/[slug])
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  name="postTitleTemplate"
                  defaultValue={
                    settings.templates?.post?.titleTemplate || "{title} {separator} {site}"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Description Template
                </label>
                <input
                  type="text"
                  name="postDescTemplate"
                  defaultValue={settings.templates?.post?.descriptionTemplate || "{excerpt}"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Category Template */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Category Hubs (/category/[slug])
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  name="categoryTitleTemplate"
                  defaultValue={
                    settings.templates?.category?.titleTemplate ||
                    "{category} News, Tools & Guides {separator} {site}"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Description Template
                </label>
                <input
                  type="text"
                  name="categoryDescTemplate"
                  defaultValue={
                    settings.templates?.category?.descriptionTemplate ||
                    "Comprehensive coverage of {category}: breaking news, model benchmarks, and developer guides."
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Tag Template */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-secondary)] dark:text-sky-400">
              Tag Archives (/tag/[slug])
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  name="tagTitleTemplate"
                  defaultValue={
                    settings.templates?.tag?.titleTemplate ||
                    "{title} AI Updates & Articles {separator} {site}"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Description Template
                </label>
                <input
                  type="text"
                  name="tagDescTemplate"
                  defaultValue={
                    settings.templates?.tag?.descriptionTemplate ||
                    "Latest news, articles and technical breakdowns tagged with #{title} on {site}."
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Standalone Page Template */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Standalone &amp; Static Pages
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  name="pageTitleTemplate"
                  defaultValue={
                    settings.templates?.page?.titleTemplate || "{title} {separator} {site}"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Description Template
                </label>
                <input
                  type="text"
                  name="pageDescTemplate"
                  defaultValue={settings.templates?.page?.descriptionTemplate || "{excerpt}"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Author Template */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Author Profiles (/author/[slug])
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  name="authorTitleTemplate"
                  defaultValue={
                    settings.templates?.author?.titleTemplate ||
                    "{author}, AI Author {separator} {site}"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                  Description Template
                </label>
                <input
                  type="text"
                  name="authorDescTemplate"
                  defaultValue={
                    settings.templates?.author?.descriptionTemplate ||
                    "Read technical articles, model evaluations, and research by {author} at {site}."
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: ORGANIZATION & SCHEMA ──────────────── */}
      {activeTab === "organization" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
              <Building className="h-4 w-4 text-[var(--accent)]" />
              Organization &amp; JSON-LD Publisher Info
            </h2>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Google Knowledge Graph and Organization schema data embedded across all public views.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Organization Name</label>
              <input
                type="text"
                name="orgName"
                defaultValue={settings.organization?.name || "Kraviona AI News"}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Editorial Contact Email</label>
              <input
                type="email"
                name="orgEmail"
                defaultValue={settings.organization?.email || "kravionatech@gmail.com"}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Organization Description</label>
            <textarea
              name="orgDescription"
              rows={3}
              defaultValue={
                settings.organization?.description ||
                "Kraviona AI News — Independent artificial intelligence, research, and technology news publication."
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Social Profile Links (One per line for &ldquo;sameAs&rdquo; Schema)
            </label>
            <textarea
              name="socialProfiles"
              rows={4}
              defaultValue={(settings.organization?.socialProfiles || [
                "https://twitter.com/kraviona",
                "https://linkedin.com/company/kraviona",
                "https://github.com/kravionatech-ai",
              ]).join("\n")}
              placeholder="https://twitter.com/..."
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: VERIFICATION & INDEXNOW ──────────────── */}
      {activeTab === "verification" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[var(--accent)]" />
              Search Engine Verification &amp; IndexNow Instant Crawl
            </h2>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Verify domain ownership with search engines and trigger instant crawls on new post publications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Google Search Console Verification Tag</label>
              <input
                type="text"
                name="googleVerification"
                defaultValue={settings.verification?.google || ""}
                placeholder="google-site-verification=..."
                className={`${inputCls} font-mono`}
              />
            </div>

            <div>
              <label className={labelCls}>Bing Webmaster Verification</label>
              <input
                type="text"
                name="bingVerification"
                defaultValue={settings.verification?.bing || ""}
                placeholder="msvalidate.01=..."
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  IndexNow Protocol (Bing / Yandex Instant Indexing)
                </span>
                <p className="text-[11px] text-[var(--color-muted-text)]">
                  Instantly ping search engines whenever an article, category, or page is published.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="autoIndexNow"
                  defaultChecked={settings.indexNow?.autoSubmitOnPublish ?? true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--color-secondary-surface)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-muted-text)] mb-1">
                IndexNow API Key (32-character hex key)
              </label>
              <input
                type="text"
                name="indexNowApiKey"
                defaultValue={settings.indexNow?.apiKey || "ailatestnews_indexnow_key_2026"}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-2 text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 5: ROBOTS.TXT & TELEMETRY ──────────────── */}
      {activeTab === "robots" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--accent)]" />
              Robots.txt Directives &amp; Analytics
            </h2>
            <p className="text-xs text-[var(--color-muted-text)] mt-1">
              Custom crawler rules and Google Analytics telemetry measurement ID.
            </p>
          </div>

          <div>
            <label className={labelCls}>Google Analytics 4 Measurement ID</label>
            <input
              type="text"
              name="analyticsId"
              defaultValue={settings.analyticsId || process.env.NEXT_PUBLIC_GA_ID || ""}
              placeholder="G-XXXXXXXXXX"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>Custom Robots.txt Appended Rules</label>
            <textarea
              name="robotsTxt"
              rows={6}
              defaultValue={
                settings.robotsTxt ||
                `# Kraviona AI News Crawl Directives\nUser-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /preview/\n\n# Respect rate limits\nCrawl-delay: 1`
              }
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB 6: HEADER NAVIGATION & FOOTER ──────────────── */}
      {activeTab === "navigation" && (
        <div className="space-y-8">
          {/* Header Navigation Section */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[var(--accent)]" />
                  Primary Header Navigation
                </h2>
                <p className="text-xs text-[var(--color-muted-text)] mt-1">
                  Configure top navigation links, ordering, and external URL flags across desktop and mobile menus.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNavItems([
                    ...navItems,
                    { label: "New Link", href: "/", order: navItems.length + 1, isExternal: false },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30 hover:opacity-90 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" /> Add Navigation Item
              </button>
            </div>

            <div className="space-y-3">
              {navItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40"
                >
                  <div className="flex items-center gap-2 sm:w-16">
                    <span className="text-[10px] font-bold text-[var(--color-muted-text)]">#{idx + 1}</span>
                    <input
                      type="number"
                      value={item.order ?? idx + 1}
                      onChange={(e) => {
                        const updated = [...navItems];
                        updated[idx].order = Number(e.target.value);
                        setNavItems(updated);
                      }}
                      className="w-12 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2 py-1 text-xs font-mono text-center text-[var(--color-heading)]"
                      title="Sort order"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Label (e.g. AI Models)"
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...navItems];
                        updated[idx].label = e.target.value;
                        setNavItems(updated);
                      }}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="URL (e.g. /category/model-launches)"
                      value={item.href}
                      onChange={(e) => {
                        const updated = [...navItems];
                        updated[idx].href = e.target.value;
                        setNavItems(updated);
                      }}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-3 py-1.5 text-xs font-mono text-[var(--color-body-text)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center gap-3 sm:w-auto justify-between sm:justify-start">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--color-body-text)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isExternal)}
                        onChange={(e) => {
                          const updated = [...navItems];
                          updated[idx].isExternal = e.target.checked;
                          setNavItems(updated);
                        }}
                        className="rounded accent-[var(--accent)]"
                      />
                      <span>External</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setNavItems(navItems.filter((_: any, i: number) => i !== idx));
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {navItems.length === 0 && (
                <p className="text-xs text-[var(--color-muted-text)] text-center py-4">
                  No navigation links configured. Click &ldquo;Add Navigation Item&rdquo; above.
                </p>
              )}
            </div>
          </div>

          {/* Footer Configuration Section */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-display text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
                <Globe className="h-4 w-4 text-[var(--accent)]" />
                Footer Content &amp; Columns
              </h2>
              <p className="text-xs text-[var(--color-muted-text)] mt-1">
                Customize about text, copyright attribution, and dynamic link columns.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Footer Brand Description / About Blurb</label>
                <textarea
                  rows={3}
                  value={footerConfig.aboutText || ""}
                  onChange={(e) => {
                    setFooterConfig({ ...footerConfig, aboutText: e.target.value });
                  }}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Copyright Attribution Line</label>
                <input
                  type="text"
                  value={footerConfig.copyrightText || ""}
                  onChange={(e) => {
                    setFooterConfig({ ...footerConfig, copyrightText: e.target.value });
                  }}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Footer Column Sections */}
            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                  Footer Link Columns ({footerConfig.sections?.length || 0})
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    const currentSections = footerConfig.sections || [];
                    setFooterConfig({
                      ...footerConfig,
                      sections: [...currentSections, { title: "New Column", links: [] }],
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-secondary-surface)] text-[var(--color-heading)] hover:bg-[var(--border)] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Column
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(footerConfig.sections || []).map((sec: any, secIdx: number) => (
                  <div
                    key={secIdx}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--color-secondary-surface)]/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...footerConfig.sections];
                          updated[secIdx].title = e.target.value;
                          setFooterConfig({ ...footerConfig, sections: updated });
                        }}
                        className="text-xs font-bold text-[var(--color-heading)] bg-transparent outline-none w-full border-b border-transparent focus:border-[var(--accent)]"
                        placeholder="Column Title"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = footerConfig.sections.filter(
                            (_: any, i: number) => i !== secIdx
                          );
                          setFooterConfig({ ...footerConfig, sections: updated });
                        }}
                        className="text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors cursor-pointer"
                        title="Remove Column"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(sec.links || []).map((lnk: any, lnkIdx: number) => (
                        <div key={lnkIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Label"
                            value={lnk.label}
                            onChange={(e) => {
                              const updated = [...footerConfig.sections];
                              updated[secIdx].links[lnkIdx].label = e.target.value;
                              setFooterConfig({ ...footerConfig, sections: updated });
                            }}
                            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2 py-1 text-[11px] font-semibold text-[var(--color-heading)]"
                          />
                          <input
                            type="text"
                            placeholder="URL"
                            value={lnk.href}
                            onChange={(e) => {
                              const updated = [...footerConfig.sections];
                              updated[secIdx].links[lnkIdx].href = e.target.value;
                              setFooterConfig({ ...footerConfig, sections: updated });
                            }}
                            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2 py-1 text-[11px] font-mono text-[var(--color-body-text)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...footerConfig.sections];
                              updated[secIdx].links = updated[secIdx].links.filter(
                                (_: any, i: number) => i !== lnkIdx
                              );
                              setFooterConfig({ ...footerConfig, sections: updated });
                            }}
                            className="text-[var(--color-muted-text)] hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...footerConfig.sections];
                          if (!updated[secIdx].links) updated[secIdx].links = [];
                          updated[secIdx].links.push({ label: "New Link", href: "/" });
                          setFooterConfig({ ...footerConfig, sections: updated });
                        }}
                        className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--color-muted-text)]">
          Saving updates will instantly revalidate public pages, sitemap, and RSS feed.
        </span>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isPending ? "Saving Global Configuration..." : "Save Configuration"}</span>
        </button>
      </div>
    </form>
  );
}
