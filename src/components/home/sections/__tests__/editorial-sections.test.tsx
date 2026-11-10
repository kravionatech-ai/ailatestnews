import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SectionDeskHeader,
  BreakingNewsSection,
  HeroMagazineSection,
  ModelLaunchesSection,
  IndiaAiSection,
  GuidesSection,
  EnterpriseAiSection,
  TrendingLatestSection,
  ModelReleasesTimelineSection,
} from "../index";
import type { NewsCardPost } from "@/components/blog/cards/types";

const mockPostA: NewsCardPost = {
  _id: "post-a",
  title: "Claude 3.5 Sonnet Coding Evaluations and SWE-bench Breakthrough",
  slug: "claude-35-sonnet-coding-evaluations",
  excerpt: "Detailed analysis of autonomous coding capabilities.",
  readingTime: 6,
  views: 3200,
  publishedAt: new Date("2026-11-08T10:00:00Z"),
  featured: true,
  category: { name: "Model Launches", slug: "model-launches" },
  author: { name: "Elena Rostova", slug: "elena-rostova" },
};

const mockPostB: NewsCardPost = {
  _id: "post-b",
  title: "Sovereign Indic Language AI Models on Indian Cloud Clusters",
  slug: "sovereign-indic-language-ai-models",
  excerpt: "Evaluating Hindi, Tamil, and Telugu tokenization efficiency.",
  readingTime: 5,
  views: 2800,
  publishedAt: new Date("2026-11-08T09:00:00Z"),
  featured: false,
  category: { name: "India AI", slug: "india-ai" },
  author: { name: "Vikram Sen", slug: "vikram-sen" },
};

describe("Milestone 3: 8 Editorial News Sections & Card Integration", () => {
  it("SectionDeskHeader renders kicker, title, subtitle, and action link", () => {
    const html = renderToStaticMarkup(
      <SectionDeskHeader
        kicker="Test Kicker"
        title="Test Desk Header"
        subtitle="This is a test subtitle."
        actionLabel="View All"
        actionHref="/test-archive"
      />
    );

    expect(html).toContain("Test Kicker");
    expect(html).toContain("Test Desk Header");
    expect(html).toContain("This is a test subtitle.");
    expect(html).toContain("View All");
    expect(html).toContain("href=\"/test-archive\"");
  });

  it("BreakingNewsSection handles empty post list gracefully", () => {
    const html = renderToStaticMarkup(<BreakingNewsSection posts={[]} />);
    expect(html).toBe("");
  });

  it("HeroMagazineSection renders fallback title and subtitle when no posts are provided", () => {
    const html = renderToStaticMarkup(
      <HeroMagazineSection
        posts={[]}
        title="No Posts Fallback Title"
        subtitle="Fallback description text"
      />
    );

    expect(html).toContain("No Posts Fallback Title");
    expect(html).toContain("Fallback description text");
  });

  it("ModelLaunchesSection renders with horizontal card variant", () => {
    const html = renderToStaticMarkup(
      <ModelLaunchesSection
        posts={[mockPostA, mockPostB]}
        cardVariant="horizontal"
      />
    );

    expect(html).toContain("grid-cols-1 lg:grid-cols-2");
    expect(html).toContain("Claude 3.5 Sonnet");
  });

  it("IndiaAiSection returns null when posts array is empty", () => {
    const html = renderToStaticMarkup(<IndiaAiSection posts={[]} />);
    expect(html).toBe("");
  });

  it("GuidesSection renders 2-up grid with 16:9 aspect ratio", () => {
    const html = renderToStaticMarkup(
      <GuidesSection posts={[mockPostA, mockPostB]} />
    );

    expect(html).toContain("grid-cols-1 md:grid-cols-2");
    expect(html).toContain("Claude 3.5 Sonnet");
    expect(html).toContain("Sovereign Indic Language");
  });

  it("EnterpriseAiSection respects limit configuration", () => {
    const html = renderToStaticMarkup(
      <EnterpriseAiSection
        posts={[mockPostA, mockPostB]}
        limit={1}
      />
    );

    expect(html).toContain("Claude 3.5 Sonnet");
    expect(html).not.toContain("Sovereign Indic Language");
  });

  it("TrendingLatestSection renders stream cards and ranked list items", () => {
    const html = renderToStaticMarkup(
      <TrendingLatestSection
        latestPosts={[mockPostA]}
        trendingPosts={[mockPostB]}
      />
    );

    expect(html).toContain("Latest AI Reporting");
    expect(html).toContain("The Most Read");
    expect(html).toContain("01");
  });

  it("ModelReleasesTimelineSection renders milestone nodes along spine", () => {
    const html = renderToStaticMarkup(
      <ModelReleasesTimelineSection posts={[mockPostA]} />
    );

    expect(html).toContain("AI Model Releases Timeline");
    expect(html).toContain("border-l-2");
    expect(html).toContain("Architecture Deep-Dive");
  });
});
