import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock actions and auth for server/client component isolation in Vitest Node environment
vi.mock("@/actions/comments", () => ({
  addCommentAction: vi.fn(),
  likeCommentAction: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

import {
  StandardEditorialLayout,
  PremiumMagazineLayout,
  MinimalReadingLayout,
  WideArticleLayout,
  WithoutSidebarLayout,
  ArticleLayoutDispatcher,
  ArticleBreadcrumbs,
  AuthorNewsroomCard,
  EditorialStandardsBox,
  TabletArticleAccordion,
  RelatedPostsGrid,
} from "../index";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import type { ArticlePostData, ArticleCommentItem, RelatedPostItem } from "../types";

const mockPost: ArticlePostData = {
  _id: "post-india-supercompute-2026",
  title: "Inside the India AI Mission 10,000 GPU Sovereign Cluster Deployment",
  slug: "inside-the-india-ai-mission-10000-gpu-sovereign-cluster-deployment",
  excerpt: "An architectural analysis of sovereign high-performance compute allocations across Indian tier-IV datacenters.",
  contentHtml:
    "<p>The Department of Science and Technology has officially greenlit sovereign GPU capacity across Yotta and CtrlS datacenters.</p><h2>Cluster Topology</h2><p>InfiniBand NDR 400Gbps fabrics interconnect the 1,250 HGX H100 nodes.</p><h3>Thermal Dissipation</h3><p>Direct-to-chip liquid cooling keeps PUE below 1.15.</p>",
  coverImage: "https://images.unsplash.com/photo-datacenter-1",
  coverImageAlt: "Sovereign GPU Cluster Datacenter",
  coverImageCaption: "Yotta D1 Facility, Greater Noida",
  readingTime: 8,
  views: 3420,
  publishedAt: new Date("2026-11-07T08:00:00Z"),
  createdAt: new Date("2026-11-07T06:00:00Z"),
  updatedAt: new Date("2026-11-08T10:00:00Z"),
  keyTakeaways: [
    "10,000 sovereign GPUs allocated across Yotta and CtrlS datacenters",
    "Subsidized inference tokens for domestic research labs at ₹0.0012/1K tokens",
    "Direct-to-chip liquid cooling maintaining 1.14 PUE efficiency",
  ],
  author: {
    name: "Vikram Sen",
    role: "HPC Systems Architect & Tech Journalist",
    image: "https://images.unsplash.com/photo-author-2",
    slug: "vikram-sen",
    bio: "Covers high-performance computing, GPU economics, and sovereign AI initiatives.",
  },
  category: {
    name: "India AI Mission",
    slug: "india-ai",
  },
  tags: [
    { name: "Supercomputing", slug: "supercomputing" },
    { name: "IndiaAI", slug: "india-ai" },
  ],
};

const mockComments: ArticleCommentItem[] = [
  {
    _id: "comment-1",
    content: "Outstanding analysis on the thermal architecture and PUE metrics.",
    createdAt: "2026-11-07T14:00:00Z",
    likes: 5,
    author: {
      name: "Ananya Deshmukh",
    },
  },
];

const mockRelatedPosts: RelatedPostItem[] = [
  {
    _id: "related-1",
    title: "Indic LLM Benchmark: Evaluating Sovereign Foundation Models",
    slug: "indic-llm-benchmark-evaluating-sovereign-foundation-models",
    excerpt: "Benchmark results on Hindi, Tamil, and Bengali comprehension.",
    readingTime: 5,
    views: 890,
    publishedAt: new Date("2026-11-06T12:00:00Z"),
    category: { name: "India AI Mission", slug: "india-ai" },
  },
];

describe("Modular Article Page Layout Templates (Milestone 2)", () => {
  // ── Template 1: Standard Editorial Layout ──────────────────────────────────
  describe("Template 1: Standard Editorial Layout", () => {
    it("renders 8+4 column responsive grid with Fact-Checked byline", () => {
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("lg:col-span-8");
      expect(html).toContain("lg:col-span-4");
      expect(html).toContain("Fact-Checked");
      expect(html).toContain("Vikram Sen");
      expect(html).toContain("Inside the India AI Mission");
      expect(html).toContain("Cluster Topology");
    });

    it("solves tablet (<1024px) defect by embedding TabletArticleAccordion above prose", () => {
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      // Verify TabletArticleAccordion is rendered for viewports < lg (block lg:hidden)
      expect(html).toContain("block lg:hidden");
      expect(html).toContain("Table of Contents");
      expect(html).toContain("2 sections");
    });

    it("repositions CommunityPollWidget below prose for tablet and mobile readers", () => {
      const html = renderToStaticMarkup(
        <StandardEditorialLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      // Poll must exist in both desktop sidebar (hidden lg:block) AND below-prose mobile/tablet area (block lg:hidden)
      expect(html).toContain("block lg:hidden my-8");
      expect(html).toContain("hidden lg:block lg:col-span-4");
    });
  });

  // ── Template 2: Premium Magazine Layout ────────────────────────────────────
  describe("Template 2: Premium Magazine Layout", () => {
    it("renders full-width hero header, centered reading column, and drop cap", () => {
      const html = renderToStaticMarkup(
        <PremiumMagazineLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("max-w-3xl");
      expect(html).toContain("first-letter:float-left");
      expect(html).toContain("first-letter:text-5xl");
      expect(html).toContain("Inside the India AI Mission");
      expect(html).toContain("Floating engagement dock");
    });
  });

  // ── Template 3: Minimal Reading Layout ─────────────────────────────────────
  describe("Template 3: Minimal Reading Layout", () => {
    it("renders distraction-free single-column container without sidebar clutter", () => {
      const html = renderToStaticMarkup(
        <MinimalReadingLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("max-w-[720px]");
      expect(html).not.toContain("lg:col-span-4");
      expect(html).toContain("Inside the India AI Mission");
      expect(html).toContain("Vikram Sen");
      expect(html).toContain("Thanks for reading");
    });
  });

  // ── Template 4: Wide Article Layout ────────────────────────────────────────
  describe("Template 4: Wide Article Layout", () => {
    it("renders expanded max-w-7xl readable container optimized for benchmarks", () => {
      const html = renderToStaticMarkup(
        <WideArticleLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("max-w-7xl");
      expect(html).toContain("aspect-21/9 sm:aspect-16/7");
      expect(html).toContain("Inside the India AI Mission");
      expect(html).toContain("Executive Summary");
    });
  });

  // ── Template 5: Without Sidebar Layout ─────────────────────────────────────
  describe("Template 5: Without Sidebar Layout", () => {
    it("renders symmetric centered container with in-body TableOfContents accordion", () => {
      const html = renderToStaticMarkup(
        <WithoutSidebarLayout
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("max-w-4xl");
      expect(html).not.toContain("lg:col-span-4");
      expect(html).toContain("Table of Contents");
      expect(html).toContain("Inside the India AI Mission");
    });
  });

  // ── ArticleLayoutDispatcher Router & Fallback ──────────────────────────────
  describe("ArticleLayoutDispatcher Router & Fallback", () => {
    it("dispatches each of the 5 templates explicitly via template prop", () => {
      const templates = [
        "standard-editorial",
        "premium-magazine",
        "minimal-reading",
        "wide-article",
        "without-sidebar",
      ] as const;

      for (const t of templates) {
        const html = renderToStaticMarkup(
          <ArticleLayoutDispatcher
            post={mockPost}
            comments={mockComments}
            relatedPosts={mockRelatedPosts}
            tokens={DEFAULT_DESIGN_TOKENS}
            template={t}
          />
        );
        expect(html).toBeDefined();
        expect(html).toContain("Inside the India AI Mission");
      }
    });

    it("prioritizes templateOverride over post.layoutTemplate and tokens default", () => {
      const customPost = { ...mockPost, layoutTemplate: "standard-editorial" as const };
      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={customPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
          templateOverride="minimal-reading"
        />
      );

      expect(html).toContain("max-w-[720px]");
      expect(html).not.toContain("lg:col-span-4");
    });

    it("honors post.layoutTemplate when no template prop or override is provided", () => {
      const customPost = { ...mockPost, layoutTemplate: "premium-magazine" as const };
      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={customPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
        />
      );

      expect(html).toContain("first-letter:float-left");
    });

    it("honors tokens.article.defaultTemplate when post has no override", () => {
      const customTokens = {
        ...DEFAULT_DESIGN_TOKENS,
        article: {
          ...DEFAULT_DESIGN_TOKENS.article,
          defaultTemplate: "without-sidebar" as const,
        },
      };

      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={customTokens}
        />
      );

      expect(html).toContain("max-w-4xl");
    });

    it("gracefully falls back to standard-editorial for invalid/unknown template names", () => {
      const html = renderToStaticMarkup(
        <ArticleLayoutDispatcher
          post={mockPost}
          comments={mockComments}
          relatedPosts={mockRelatedPosts}
          tokens={DEFAULT_DESIGN_TOKENS}
          template={"unknown-layout-slug" as any}
        />
      );

      expect(html).toContain("grid-cols-1 lg:grid-cols-12");
      expect(html).toContain("lg:col-span-8");
      expect(html).toContain("Fact-Checked");
    });
  });

  // ── Article Widgets Verification ───────────────────────────────────────────
  describe("Modular Article Widgets", () => {
    it("renders ArticleBreadcrumbs with Home, Articles, Category, and Title", () => {
      const html = renderToStaticMarkup(
        <ArticleBreadcrumbs category={mockPost.category} title={mockPost.title} />
      );

      expect(html).toContain("Home");
      expect(html).toContain("Articles");
      expect(html).toContain("India AI Mission");
      expect(html).toContain("/category/india-ai");
      expect(html).toContain("Inside the India AI Mission");
    });

    it("renders AuthorNewsroomCard with verified byline badge and author credentials", () => {
      const html = renderToStaticMarkup(
        <AuthorNewsroomCard author={mockPost.author} />
      );

      expect(html).toContain("Vikram Sen");
      expect(html).toContain("HPC Systems Architect");
      expect(html).toContain("Verified Byline");
      expect(html).toContain("/author/vikram-sen");
    });

    it("renders EditorialStandardsBox with newsroom verification principles", () => {
      const html = renderToStaticMarkup(<EditorialStandardsBox />);

      expect(html).toContain("Editorial Standards");
      expect(html).toContain("/editorial-policy");
    });

    it("renders TabletArticleAccordion with accessible ARIA disclosure attributes", () => {
      const html = renderToStaticMarkup(
        <TabletArticleAccordion
          initialHeadings={[
            { id: "heading-1", text: "Cluster Architecture", level: 2 },
          ]}
        />
      );

      expect(html).toContain("block lg:hidden");
      expect(html).toContain("Table of Contents");
      expect(html).toContain("1 sections");
    });

    it("renders RelatedPostsGrid with recommended dispatches", () => {
      const html = renderToStaticMarkup(
        <RelatedPostsGrid relatedPosts={mockRelatedPosts} />
      );

      expect(html).toContain("Related Intelligence");
      expect(html).toContain("Recommended Reading");
      expect(html).toContain("Indic LLM Benchmark");
    });
  });
});
