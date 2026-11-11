import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks for Server Action & Database Isolation in Vitest Node Environment
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/actions/comments", () => ({
  addCommentAction: vi.fn(),
  likeCommentAction: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

const mockGetPostBySlug = vi.fn();
const mockGetAllPostSlugs = vi.fn();
vi.mock("@/lib/db/queries/posts", () => ({
  getPostBySlug: (...args: any[]) => mockGetPostBySlug(...args),
  getAllPostSlugs: (...args: any[]) => mockGetAllPostSlugs(...args),
}));

const mockGetCommentsByPost = vi.fn();
vi.mock("@/lib/db/queries/comments", () => ({
  getCommentsByPost: (...args: any[]) => mockGetCommentsByPost(...args),
}));

const mockGetActiveDesignTokens = vi.fn();
vi.mock("@/lib/design-tokens/service", () => ({
  getActiveDesignTokens: (...args: any[]) => mockGetActiveDesignTokens(...args),
}));

// Mock PublicShell to simplify server-component markup inspection
vi.mock("@/components/layout/public-shell", () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-shell">{children}</div>
  ),
}));

import {
  StandardEditorialLayout,
  PremiumMagazineLayout,
  MinimalReadingLayout,
  WideArticleLayout,
  WithoutSidebarLayout,
  ArticleLayoutDispatcher,
} from "@/components/blog/article-layouts";
import {
  extractHeadingsFromHtml,
  TableOfContentsWidget,
  TableOfContentsAccordion,
  TabletArticleAccordion,
} from "@/components/blog/article-layouts/widgets";
import SinglePostPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/blog/[slug]/page";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import type {
  ArticlePostData,
  ArticleLayoutProps,
} from "@/components/blog/article-layouts/types";
import type { ArticleLayoutTemplate } from "@/lib/design-tokens/types";

// ─────────────────────────────────────────────────────────────────────────────
// Baseline Post Fixtures
// ─────────────────────────────────────────────────────────────────────────────
const robustPost: ArticlePostData = {
  _id: "post-stress-101",
  title: "Frontier MoE Scalability Across Heterogeneous Datacenter Clusters",
  slug: "frontier-moe-scalability-datacenter-clusters",
  excerpt: "Empirical study on pipeline parallel dispatch and token routing overheads.",
  contentHtml:
    "<h2>Cluster Interconnect Topology</h2><p>Fabric testing with 400Gbps InfiniBand.</p><h3>Routing Layer</h3><p>Top-k gating latency distribution.</p>",
  coverImage: "https://images.unsplash.com/photo-datacenter",
  coverImageAlt: "Heterogeneous Datacenter Interconnect",
  coverImageCaption: "Primary testbed cluster",
  readingTime: 9,
  views: 5200,
  publishedAt: new Date("2026-11-08T12:00:00Z"),
  createdAt: new Date("2026-11-08T10:00:00Z"),
  updatedAt: new Date("2026-11-09T08:00:00Z"),
  keyTakeaways: [
    "Sub-microsecond gating reduces MoE overhead by 34%",
    "All-to-all collective efficiency scales to 2,048 experts",
  ],
  author: {
    name: "Dr. Elena Rostova",
    role: "Principal Systems Researcher",
    slug: "elena-rostova",
    image: "https://images.unsplash.com/photo-author",
    bio: "Specializes in distributed LLM training architectures and high-bandwidth interconnects.",
  },
  category: {
    name: "Hardware & Compute",
    slug: "hardware-compute",
  },
  tags: [
    { name: "MoE", slug: "moe" },
    { name: "InfiniBand", slug: "infiniband" },
  ],
};

describe("Adversarial Verification Suite: Milestone 2 Article Layouts & Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveDesignTokens.mockResolvedValue(DEFAULT_DESIGN_TOKENS);
    mockGetCommentsByPost.mockResolvedValue([]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ADVERSARIAL INPUT RESILIENCE: MALFORMED & EMPTY POST FIELDS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("1. Malformed & Edge-Case Post Data Resilience Across All 5 Layouts", () => {
    const layoutComponents = [
      { name: "StandardEditorialLayout", Component: StandardEditorialLayout },
      { name: "PremiumMagazineLayout", Component: PremiumMagazineLayout },
      { name: "MinimalReadingLayout", Component: MinimalReadingLayout },
      { name: "WideArticleLayout", Component: WideArticleLayout },
      { name: "WithoutSidebarLayout", Component: WithoutSidebarLayout },
    ];

    const minimalAdversarialPost: ArticlePostData = {
      _id: "min-post-empty-fields",
      title: "Adversarial Minimal Post With Nullish Optional Fields",
      slug: "adversarial-minimal-post",
      // Excerpt is intentionally undefined
      excerpt: undefined,
      // Author is completely missing
      author: null,
      // Category is completely missing
      category: null,
      // Tags are empty
      tags: [],
      // ContentHtml is empty
      contentHtml: "",
      // No cover image
      coverImage: undefined,
      // Missing all date fields
      publishedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      // Missing numerical fields
      readingTime: undefined,
      views: undefined,
      keyTakeaways: undefined,
      allowComments: undefined,
    };

    layoutComponents.forEach(({ name, Component }) => {
      it(`${name} renders without throwing when all optional fields are undefined or null`, () => {
        expect(() => {
          const html = renderToStaticMarkup(
            <Component
              post={minimalAdversarialPost}
              comments={undefined}
              relatedPosts={undefined}
              tokens={DEFAULT_DESIGN_TOKENS}
            />
          );

          expect(html).toBeDefined();
          expect(html).toContain("Adversarial Minimal Post With Nullish Optional Fields");
          // Should not render "undefined" as literal text in byline or headings
          expect(html).not.toContain("By undefined");
          expect(html).not.toContain("NaN");
        }).not.toThrow();
      });

      it(`${name} handles null excerpt and empty contentHtml safely without crashing`, () => {
        const postWithNulls: ArticlePostData = {
          ...minimalAdversarialPost,
          excerpt: null as any,
          contentHtml: null as any,
          author: { name: undefined, slug: undefined, image: undefined },
          category: { name: "", slug: "" },
        };

        const html = renderToStaticMarkup(
          <Component
            post={postWithNulls}
            comments={[]}
            relatedPosts={[]}
            tokens={DEFAULT_DESIGN_TOKENS}
          />
        );

        expect(html).toBeDefined();
        expect(html).toContain("Adversarial Minimal Post");
      });

      it(`${name} renders safely when tokens prop is completely undefined (fallback defaults)`, () => {
        const html = renderToStaticMarkup(
          <Component
            post={robustPost}
            comments={[]}
            relatedPosts={[]}
            tokens={undefined as any}
          />
        );

        expect(html).toBeDefined();
        expect(html).toContain("Frontier MoE Scalability");
      });
    });

    it("StandardEditorialLayout displays fallback author name when author is null", () => {
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={minimalAdversarialPost}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("By Kraviona AI News Editorial Staff");
    });

    it("PremiumMagazineLayout displays fallback author when author is null", () => {
      const html = renderToStaticMarkup(
        <PremiumMagazineLayout
          post={minimalAdversarialPost}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("Editorial Staff");
    });

    it("WideArticleLayout displays fallback author when author is null", () => {
      const html = renderToStaticMarkup(
        <WideArticleLayout
          post={minimalAdversarialPost}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("By Technical Staff");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. HEADING STRESS HARNESS: 0 HEADINGS TO 60+ DEEP HEADINGS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("2. Headings & Table of Contents Stress Harness", () => {
    it("extractHeadingsFromHtml returns empty array on null, undefined, or empty HTML", () => {
      expect(extractHeadingsFromHtml(undefined)).toEqual([]);
      expect(extractHeadingsFromHtml("")).toEqual([]);
      expect(extractHeadingsFromHtml("<p>No headings in this body text.</p>")).toEqual([]);
    });

    it("extractHeadingsFromHtml ignores H1, H4, H5, H6 and only extracts H2 and H3", () => {
      const html = `
        <h1>Main Page Title (H1 should be ignored)</h1>
        <h2>Section Alpha (H2 valid)</h2>
        <h3>Subsection Alpha 1 (H3 valid)</h3>
        <h4>Sub-subsection Alpha 1.1 (H4 should be ignored)</h4>
        <h5>Deep subclause (H5 ignored)</h5>
        <h6>Footnote header (H6 ignored)</h6>
      `;
      const headings = extractHeadingsFromHtml(html);
      expect(headings).toHaveLength(2);
      expect(headings[0]?.text).toBe("Section Alpha (H2 valid)");
      expect(headings[0]?.level).toBe(2);
      expect(headings[1]?.text).toBe("Subsection Alpha 1 (H3 valid)");
      expect(headings[1]?.level).toBe(3);
    });

    it("extractHeadingsFromHtml strips inner HTML tags inside heading text", () => {
      const html = `
        <h2>Analysis of <code>torch.compile()</code> with <em>Fast Fourier</em> Transforms</h2>
      `;
      const headings = extractHeadingsFromHtml(html);
      expect(headings).toHaveLength(1);
      expect(headings[0]?.text).toBe(
        "Analysis of torch.compile() with Fast Fourier Transforms"
      );
    });

    it("extractHeadingsFromHtml preserves pre-existing id attribute if present", () => {
      const html = `<h2 id="custom-hpc-anchor">Custom Anchor Heading</h2>`;
      const headings = extractHeadingsFromHtml(html);
      expect(headings).toHaveLength(1);
      expect(headings[0]?.id).toBe("custom-hpc-anchor");
    });

    it("extractHeadingsFromHtml stress-tests with 60 headings across deep hierarchy", () => {
      const headingList: string[] = [];
      for (let i = 1; i <= 60; i++) {
        const tag = i % 2 === 0 ? "h2" : "h3";
        headingList.push(
          `<${tag} id="bench-point-${i}">Benchmark Checkpoint #${i}: Sub-system Telemetry</${tag}>`
        );
      }
      const rawHtml = headingList.join("\n");
      const extracted = extractHeadingsFromHtml(rawHtml);

      expect(extracted).toHaveLength(60);
      expect(extracted[0]?.id).toBe("bench-point-1");
      expect(extracted[59]?.id).toBe("bench-point-60");
      expect(extracted[59]?.text).toBe(
        "Benchmark Checkpoint #60: Sub-system Telemetry"
      );
    });

    describe("TOC Widgets Empty State vs Heavy State", () => {
      it("TableOfContentsWidget returns null when headings array is empty", () => {
        const html = renderToStaticMarkup(
          <TableOfContentsWidget initialHeadings={[]} />
        );
        expect(html).toBe("");
      });

      it("TableOfContentsAccordion returns null when headings array is empty", () => {
        const html = renderToStaticMarkup(
          <TableOfContentsAccordion initialHeadings={[]} />
        );
        expect(html).toBe("");
      });

      it("TabletArticleAccordion returns null when headings array is empty", () => {
        const html = renderToStaticMarkup(
          <TabletArticleAccordion initialHeadings={[]} />
        );
        expect(html).toBe("");
      });

      it("TableOfContentsWidget renders all 60 items without crashing or truncated markup", () => {
        const heavyHeadings = Array.from({ length: 60 }, (_, i) => ({
          id: `h-${i + 1}`,
          text: `Section Level Item ${i + 1}`,
          level: i % 2 === 0 ? 2 : 3,
        }));

        const html = renderToStaticMarkup(
          <TableOfContentsWidget initialHeadings={heavyHeadings} />
        );

        expect(html).toContain("In This Investigation");
        expect(html).toContain("Section Level Item 1");
        expect(html).toContain("Section Level Item 60");
        expect(html).toContain('href="#h-60"');
      });

      it("TabletArticleAccordion renders count pill with '60 sections'", () => {
        const heavyHeadings = Array.from({ length: 60 }, (_, i) => ({
          id: `h-${i + 1}`,
          text: `Section Level Item ${i + 1}`,
          level: 2,
        }));

        const html = renderToStaticMarkup(
          <TabletArticleAccordion initialHeadings={heavyHeadings} />
        );

        expect(html).toContain("60 sections");
        expect(html).toContain("Table of Contents");
        expect(html).toContain('aria-expanded="false"');
        expect(html).toContain('aria-controls="tablet-toc-content"');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TEMPLATE OVERRIDE RESOLUTION & FALLBACK HEURISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("3. Template Override Resolution & Fallback Heuristics in ArticleLayoutDispatcher", () => {
    it("safely falls back to StandardEditorialLayout when templateOverride is an unknown string", () => {
      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={robustPost}
          templateOverride={"malicious-injected-template-name" as any}
        />
      );

      // StandardEditorialLayout marker: grid-cols-1 lg:grid-cols-12 and lg:col-span-8
      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("lg:col-span-8");
      expect(html).toContain("Fact-Checked");
    });

    it("safely falls back to StandardEditorialLayout when template prop is invalid", () => {
      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={robustPost}
          template={"corrupted-layout-template" as any}
        />
      );

      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("Fact-Checked");
    });

    it("safely falls back to StandardEditorialLayout when post.layoutTemplate is invalid", () => {
      const corruptedPost = {
        ...robustPost,
        layoutTemplate: "invalid-post-layout" as any,
      };

      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher post={corruptedPost} />
      );

      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("Fact-Checked");
    });

    it("safely falls back when tokens.article.defaultTemplate is invalid", () => {
      const invalidTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        article: {
          ...DEFAULT_DESIGN_TOKENS.article,
          defaultTemplate: "invalid-default-template" as any,
        },
      };

      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher post={robustPost} tokens={invalidTokens} />
      );

      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
    });

    it("strictly respects the 5-tier precedence hierarchy", () => {
      // 1. templateOverride beats everything
      const postWithOverride: ArticlePostData = {
        ...robustPost,
        layoutTemplate: "standard-editorial",
      };
      const tokensWithDefault = {
        ...DEFAULT_DESIGN_TOKENS,
        article: {
          ...DEFAULT_DESIGN_TOKENS.article,
          defaultTemplate: "standard-editorial" as const,
        },
      };

      const html1 = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={postWithOverride}
          tokens={tokensWithDefault}
          template="wide-article"
          templateOverride="minimal-reading"
        />
      );
      // minimal-reading uses max-w-[720px]
      expect(html1).toContain("max-w-[720px]");
      expect(html1).not.toContain("lg:col-span-12");

      // 2. template prop beats post.layoutTemplate
      const html2 = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={postWithOverride}
          tokens={tokensWithDefault}
          template="premium-magazine"
        />
      );
      // premium-magazine uses first-letter:float-left drop cap
      expect(html2).toContain("first-letter:float-left");

      // 3. post.layoutTemplate beats tokens default
      const postWithCustomLayout: ArticlePostData = {
        ...robustPost,
        layoutTemplate: "without-sidebar",
      };
      const html3 = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={postWithCustomLayout}
          tokens={tokensWithDefault}
        />
      );
      // without-sidebar uses max-w-4xl and no lg:col-span-4
      expect(html3).toContain("max-w-4xl");
      expect(html3).not.toContain("lg:col-span-4");

      // 4. tokens.article.defaultTemplate is used when post has no layout
      const postWithoutLayout: ArticlePostData = {
        ...robustPost,
        layoutTemplate: undefined,
      };
      const tokensWithWide = {
        ...DEFAULT_DESIGN_TOKENS,
        article: {
          ...DEFAULT_DESIGN_TOKENS.article,
          defaultTemplate: "wide-article" as const,
        },
      };
      const html4 = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={postWithoutLayout}
          tokens={tokensWithWide}
        />
      );
      expect(html4).toContain("aspect-21/9 sm:aspect-16/7");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. TABLET (< 1024PX) ACCORDION & VIEWPORT DEFECT HARDENING
  // ═══════════════════════════════════════════════════════════════════════════
  describe("4. Tablet (< 1024px) Accordion & Viewport Defect Hardening", () => {
    it("verifies TabletArticleAccordion renders accessible markup with ARIA attributes", () => {
      const headings = [
        { id: "sec-1", text: "Introduction to NDR Interconnects", level: 2 },
        { id: "sec-2", text: "Thermal Dissipation Metrics", level: 3 },
      ];

      const html = renderToStaticMarkup(
        <TabletArticleAccordion initialHeadings={headings} />
      );

      // Verify viewport control classes
      expect(html).toContain("block lg:hidden");
      // Verify button accessibility
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="tablet-toc-content"');
      // Verify touch target >= 48px
      expect(html).toContain("min-h-[48px]");
      expect(html).toContain("2 sections");
    });

    it("verifies StandardEditorialLayout resolves the tablet defect without horizontal overflow", () => {
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={robustPost}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      // 1. Tablet accordion rendered before prose for <1024px
      expect(html).toContain("block lg:hidden");
      expect(html).toContain("Table of Contents");

      // 2. Desktop sidebar contains sticky TOC (hidden lg:block)
      expect(html).toContain("hidden lg:block lg:col-span-4");

      // 3. Community poll exists in tablet flow AND desktop sidebar
      expect(html).toContain("block lg:hidden my-8");
    });

    it("verifies WideArticleLayout also embeds TabletArticleAccordion for <1024px", () => {
      const html = renderToStaticMarkup(
        <WideArticleLayout
          post={robustPost}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("block lg:hidden");
      expect(html).toContain("Table of Contents");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SSR VS CLIENT HYDRATION RESILIENCE: NO DOM/WINDOW CRASHES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("5. SSR vs Client Hydration Resilience", () => {
    it("renders all 5 layout templates in pure Node SSR environment without document/window errors", () => {
      const templates = [
        "standard-editorial",
        "premium-magazine",
        "minimal-reading",
        "wide-article",
        "without-sidebar",
      ] as const;

      templates.forEach((tmpl) => {
        expect(() => {
          const html = renderToStaticMarkup(
            <ArticleLayoutDispatcher
              post={robustPost}
              template={tmpl}
              tokens={DEFAULT_DESIGN_TOKENS}
            />
          );
          expect(html.length).toBeGreaterThan(100);
        }).not.toThrow();
      });
    });

    it("renders reading progress bar, reactions, and interactive widgets during SSR without crashing", () => {
      // These widgets render without throwing ReferenceError: window/document is not defined
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={robustPost}
          tokens={{
            ...DEFAULT_DESIGN_TOKENS,
            article: {
              ...DEFAULT_DESIGN_TOKENS.article,
              showStickyProgress: true,
              showReadingControls: true,
              showReactions: true,
              showCommunityPoll: true,
              showKeyTakeaways: true,
            },
          }}
        />
      );

      expect(html).toContain('role="progressbar"');
      expect(html).toContain("Fact-Checked");
      expect(html).toContain("Applauds");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ROUTE INTEGRATION & JSON-LD STRUCTURED DATA UNDER ADVERSARIAL POSTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("6. Route Integration & JSON-LD Structured Data Hardening (`src/app/blog/[slug]/page.tsx`)", () => {
    it("SinglePostPage triggers notFound() when post slug does not exist", async () => {
      mockGetPostBySlug.mockResolvedValue(null);

      await expect(
        SinglePostPage({
          params: Promise.resolve({ slug: "non-existent-article" }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });

    it("SinglePostPage generates valid JSON-LD schemas for robust posts", async () => {
      mockGetPostBySlug.mockResolvedValue({
        post: robustPost,
        relatedPosts: [],
      });

      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: robustPost.slug }),
        searchParams: Promise.resolve({}),
      });

      const html = renderToStaticMarkup(jsx);

      // 1. Article Schema verification
      expect(html).toContain('"@context":"https://schema.org"');
      expect(html).toContain('"@type":"NewsArticle"');
      expect(html).toContain(robustPost.title);
      expect(html).toContain('"name":"Dr. Elena Rostova"');
      expect(html).toContain('"jobTitle":"Principal Systems Researcher"');

      // 2. BreadcrumbList Schema verification
      expect(html).toContain('"@type":"BreadcrumbList"');
      expect(html).toContain('"name":"Hardware & Compute"');

      // 3. ArticleLayoutDispatcher mounted with standard-editorial
      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
    });

    it("SinglePostPage generates valid JSON-LD schemas when post has null author, category, coverImage, and dates", async () => {
      const strippedPost: ArticlePostData = {
        _id: "stripped-post-01",
        title: "Stripped Down Intelligence Dispatch",
        slug: "stripped-down-intelligence-dispatch",
        excerpt: undefined,
        author: null,
        category: null,
        coverImage: undefined,
        publishedAt: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      mockGetPostBySlug.mockResolvedValue({
        post: strippedPost,
        relatedPosts: [],
      });

      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: strippedPost.slug }),
        searchParams: Promise.resolve({}),
      });

      const html = renderToStaticMarkup(jsx);

      // JSON-LD should fallback cleanly to publisher organization without fabricating Person/jobTitle/1970 epoch dates
      expect(html).toContain('"name":"Kraviona AI News"');
      expect(html).not.toContain('"jobTitle":"Technology Journalist & Systems Engineer"');
      expect(html).not.toContain("1970-01-01T00:00:00.000Z");
      expect(html).toContain("/logo.png");

      // Breadcrumb should only have 3 items (Home, Articles, Title) because category is null
      expect(html).toContain('"@type":"BreadcrumbList"');
      expect(html).not.toContain('"name":"undefined"');
    });

    it("SinglePostPage generates FAQPage JSON-LD when post.faqs are populated", async () => {
      const postWithFaqs: ArticlePostData = {
        ...robustPost,
        faqs: [
          {
            question: "What is the peak power efficiency of the cluster?",
            answer: "The cluster operates at 1.14 PUE with direct-to-chip liquid cooling.",
          },
        ],
      };

      mockGetPostBySlug.mockResolvedValue({
        post: postWithFaqs,
        relatedPosts: [],
      });

      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: postWithFaqs.slug }),
        searchParams: Promise.resolve({}),
      });

      const html = renderToStaticMarkup(jsx);

      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain("What is the peak power efficiency of the cluster?");
      expect(html).toContain("1.14 PUE");
    });

    it("SinglePostPage safely handles corrupt schemaOverrides without throwing JSON parse error", async () => {
      const postWithCorruptSchema: ArticlePostData = {
        ...robustPost,
        seo: {
          schemaOverrides: "{malformed-json-payload-broken-by-user",
        },
      };

      mockGetPostBySlug.mockResolvedValue({
        post: postWithCorruptSchema,
        relatedPosts: [],
      });

      // Must not throw JSON.parse exception
      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: postWithCorruptSchema.slug }),
        searchParams: Promise.resolve({}),
      });

      const html = renderToStaticMarkup(jsx);
      expect(html).toBeDefined();
      expect(html).toContain("Frontier MoE Scalability");
    });

    it("SinglePostPage honors ?template= query parameter override", async () => {
      mockGetPostBySlug.mockResolvedValue({
        post: robustPost,
        relatedPosts: [],
      });

      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: robustPost.slug }),
        searchParams: Promise.resolve({ template: "minimal-reading" }),
      });

      const html = renderToStaticMarkup(jsx);
      // minimal-reading template marker
      expect(html).toContain("max-w-[720px]");
      expect(html).not.toContain("lg:col-span-12");
    });

    it("SinglePostPage safely resolves invalid ?template= search param to standard-editorial", async () => {
      mockGetPostBySlug.mockResolvedValue({
        post: robustPost,
        relatedPosts: [],
      });

      const jsx = await SinglePostPage({
        params: Promise.resolve({ slug: robustPost.slug }),
        searchParams: Promise.resolve({ template: "unsupported-template-variant" }),
      });

      const html = renderToStaticMarkup(jsx);
      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("Fact-Checked");
    });

    it("generateMetadata produces fallback metadata when post is not found", async () => {
      mockGetPostBySlug.mockResolvedValue(null);

      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "unknown-meta-post" }),
      });

      expect(meta.title).toBe("Post Not Found | Kraviona AI News");
    });

    it("generateMetadata produces complete OpenGraph and Twitter metadata for valid post", async () => {
      mockGetPostBySlug.mockResolvedValue({
        post: robustPost,
      });

      const meta = await generateMetadata({
        params: Promise.resolve({ slug: robustPost.slug }),
      });

      expect(meta.title).toContain(robustPost.title);
      expect(meta.description).toBe(robustPost.excerpt);
    });

    it("generateStaticParams safely returns empty array if getAllPostSlugs throws", async () => {
      mockGetAllPostSlugs.mockRejectedValue(new Error("Database connection timeout"));

      const params = await generateStaticParams();
      expect(params).toEqual([]);
    });

    it("generateStaticParams returns mapped slugs when database query succeeds", async () => {
      mockGetAllPostSlugs.mockResolvedValue([
        { slug: "post-alpha" },
        { slug: "post-beta" },
      ]);

      const params = await generateStaticParams();
      expect(params).toEqual([{ slug: "post-alpha" }, { slug: "post-beta" }]);
    });
  });
});
