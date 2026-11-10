import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ClassicEditorialCard,
  ModernMagazineCard,
  HorizontalCard,
  CompactNewsCard,
  LargeFeaturedCard,
  ImageOverlayCard,
  MinimalListCard,
  NewsCard,
} from "../index";
import { PostCard } from "@/components/blog/post-card";
import type { NewsCardPost } from "../types";

const mockPost: NewsCardPost = {
  _id: "post-india-ai-2026",
  title: "Frontier LLM Reasoning Systems & GPU Compute Economics",
  slug: "frontier-llm-reasoning-systems-gpu-compute-economics",
  excerpt: "An architectural deep-dive into sovereign AI infrastructure and cluster allocation.",
  coverImage: "https://images.unsplash.com/photo-example-1",
  coverImageAlt: "GPU Compute Cluster Architecture",
  readingTime: 6,
  views: 1250,
  publishedAt: new Date("2026-11-08T12:00:00Z"),
  createdAt: new Date("2026-11-08T10:00:00Z"),
  author: {
    name: "Dr. Arvind Rao",
    image: "https://images.unsplash.com/photo-author-1",
    slug: "arvind-rao",
    bio: "Senior Infrastructure Researcher",
  },
  category: {
    name: "Frontier Models",
    slug: "frontier-models",
  },
  tags: [
    { name: "Reasoning", slug: "reasoning" },
    { name: "Compute", slug: "compute" },
  ],
  featured: true,
  isBreaking: false,
  isTrending: true,
};

describe("Modular News Card Variants & NewsCard Factory (Milestone 2)", () => {
  // ── Variant 1: Classic Editorial Card ──────────────────────────────────────
  describe("Variant 1: Classic Editorial Card", () => {
    it("renders serif authority typography and design token class bindings", () => {
      const html = renderToStaticMarkup(<ClassicEditorialCard post={mockPost} />);

      expect(html).toContain("font-serif");
      expect(html).toContain("border-[var(--color-border)]");
      expect(html).toContain("bg-[var(--color-card-background)]");
      expect(html).toContain("text-[var(--color-heading)]");
      expect(html).toContain("Frontier LLM Reasoning Systems");
      expect(html).toContain("/blog/frontier-llm-reasoning-systems-gpu-compute-economics");
      expect(html).toContain("Dr. Arvind Rao");
      expect(html).toContain("6 min");
      expect(html).toContain("1,250");
    });

    it("respects display toggles for badges, avatar, excerpt, and reading time", () => {
      const html = renderToStaticMarkup(
        <ClassicEditorialCard
          post={mockPost}
          showBadges={false}
          showAuthorAvatar={false}
          showExcerpt={false}
          showReadingTime={false}
          showViewsCount={false}
        />
      );

      expect(html).not.toContain("Trending");
      expect(html).not.toContain(mockPost.excerpt!);
      expect(html).not.toContain("6 min");
    });
  });

  // ── Variant 2: Modern Magazine Card ────────────────────────────────────────
  describe("Variant 2: Modern Magazine Card", () => {
    it("renders modern sans typography with interactive hover elevation tokens", () => {
      const html = renderToStaticMarkup(<ModernMagazineCard post={mockPost} />);

      expect(html).toContain("font-sans");
      expect(html).toContain("font-extrabold");
      expect(html).toContain("hover:border-[var(--color-primary-accent)]");
      expect(html).toContain("/category/frontier-models");
      expect(html).toContain("Frontier Models");
      expect(html).toContain("Dr. Arvind Rao");
    });
  });

  // ── Variant 3: Horizontal Card ─────────────────────────────────────────────
  describe("Variant 3: Horizontal Card", () => {
    it("renders responsive split flex layout (vertical mobile, horizontal desktop)", () => {
      const html = renderToStaticMarkup(<HorizontalCard post={mockPost} />);

      expect(html).toContain("flex-col sm:flex-row");
      expect(html).toContain("sm:w-44 md:w-52");
      expect(html).toContain("Frontier LLM Reasoning Systems");
      expect(html).toContain("Dr. Arvind Rao");
    });
  });

  // ── Variant 4: Compact News Card ───────────────────────────────────────────
  describe("Variant 4: Compact News Card", () => {
    it("renders high-density footprint suitable for tickers, feeds, and wire sidebars", () => {
      const html = renderToStaticMarkup(<CompactNewsCard post={mockPost} />);

      expect(html).toContain("p-3 sm:p-3.5");
      expect(html).toContain("h-14 w-14 sm:h-16 sm:w-16");
      expect(html).toContain("line-clamp-2");
      expect(html).toContain("Frontier LLM Reasoning Systems");
    });
  });

  // ── Variant 5: Large Featured Card ─────────────────────────────────────────
  describe("Variant 5: Large Featured Card", () => {
    it("renders prominent hero card typography with lead badge and author details", () => {
      const html = renderToStaticMarkup(<LargeFeaturedCard post={mockPost} />);

      expect(html).toContain("text-2xl sm:text-3xl md:text-4xl lg:text-5xl");
      expect(html).toContain("Lead Investigation");
      expect(html).toContain("Dr. Arvind Rao");
      expect(html).toContain("Frontier LLM Reasoning Systems");
    });

    it("respects showBadges=false by omitting lead investigation badge", () => {
      const html = renderToStaticMarkup(<LargeFeaturedCard post={mockPost} showBadges={false} />);

      expect(html).not.toContain("Lead Investigation");
    });
  });

  // ── Variant 6: Image Overlay Card ──────────────────────────────────────────
  describe("Variant 6: Image Overlay Card", () => {
    it("renders full image background with dark gradient scrim and white text overlay", () => {
      const html = renderToStaticMarkup(<ImageOverlayCard post={mockPost} />);

      expect(html).toContain("min-h-[300px] sm:min-h-[360px]");
      expect(html).toContain("bg-gradient-to-t from-black/95 via-black/60 to-black/20");
      expect(html).toContain("text-white");
      expect(html).toContain("Frontier LLM Reasoning Systems");
    });
  });

  // ── Variant 7: Minimal List Card ───────────────────────────────────────────
  describe("Variant 7: Minimal List Card", () => {
    it("renders numbered/ranked item format without thumbnail image", () => {
      const html = renderToStaticMarkup(<MinimalListCard post={mockPost} rank={1} />);

      expect(html).toContain("01");
      expect(html).toContain("Frontier LLM Reasoning Systems");
      expect(html).toContain("Frontier Models");
      // Text-dominant without thumbnail image tag
      expect(html).not.toContain("<img");
    });

    it("formats multi-digit ranks properly (e.g. rank 5 -> '05', rank 12 -> '12')", () => {
      const html5 = renderToStaticMarkup(<MinimalListCard post={mockPost} rank={5} />);
      expect(html5).toContain("05");

      const html12 = renderToStaticMarkup(<MinimalListCard post={mockPost} rank={12} />);
      expect(html12).toContain("12");
    });
  });

  // ── NewsCard Factory Dispatcher ────────────────────────────────────────────
  describe("NewsCard Factory Dispatcher", () => {
    it("dispatches each variant explicitly requested via variant prop", () => {
      const variants = [
        "classic-editorial",
        "modern-magazine",
        "horizontal",
        "compact",
        "large-featured",
        "image-overlay",
        "minimal-list",
      ] as const;

      for (const v of variants) {
        const html = renderToStaticMarkup(<NewsCard post={mockPost} variant={v} rank={2} />);
        expect(html).toBeDefined();
        expect(html.length).toBeGreaterThan(100);
        expect(html).toContain("Frontier LLM Reasoning Systems");
      }
    });

    it("defaults to classic-editorial when no variant or featured flag is specified", () => {
      const regularPost = { ...mockPost, featured: false };
      const html = renderToStaticMarkup(<NewsCard post={regularPost} />);

      expect(html).toContain("font-serif");
      expect(html).not.toContain("md:col-span-2");
    });

    it("adapts to large-featured and attaches md:col-span-2 when featured={true}", () => {
      const html = renderToStaticMarkup(<NewsCard post={mockPost} featured={true} />);

      expect(html).toContain("md:col-span-2");
      expect(html).toContain("text-2xl sm:text-3xl md:text-4xl lg:text-5xl");
    });

    it("forwards aspect ratio and custom className cleanly", () => {
      const html = renderToStaticMarkup(
        <NewsCard post={mockPost} variant="classic-editorial" aspectRatio="4:3" className="custom-test-card" />
      );

      expect(html).toContain("aspect-4/3");
      expect(html).toContain("custom-test-card");
    });
  });

  // ── PostCard Backwards Compatibility Wrapper ───────────────────────────────
  describe("PostCard Backwards Compatibility Wrapper", () => {
    it("renders seamlessly when called as legacy PostCard component", () => {
      const html = renderToStaticMarkup(<PostCard post={mockPost} featured={false} />);

      expect(html).toContain("Frontier LLM Reasoning Systems");
      expect(html).toContain("/blog/frontier-llm-reasoning-systems-gpu-compute-economics");
      expect(html).toContain("Dr. Arvind Rao");
    });

    it("supports featured={true} legacy calls spanning 2 columns", () => {
      const html = renderToStaticMarkup(<PostCard post={mockPost} featured={true} />);

      expect(html).toContain("md:col-span-2");
    });
  });
});
