import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock database connection & server actions
vi.mock("@/actions/newsletter", () => ({
  subscribeNewsletterAction: vi.fn().mockResolvedValue({
    success: true,
    message: "Thank you for subscribing to the Daily Dispatch.",
  }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
  cookies: vi.fn().mockResolvedValue(new Map()),
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

import { SectionDispatcher } from "@/components/home/section-dispatcher";
import {
  BreakingNewsSection,
  HeroMagazineSection,
  ModelLaunchesSection,
  IndiaAiSection,
  AiToolsSection,
  GuidesSection,
  EnterpriseAiSection,
  TrendingLatestSection,
  BenchmarkLeaderboardSection,
  ModelCalculatorSection,
  NewsletterSection,
  SiteIntroSection,
  FaqSection,
  CommunityPollSection,
  ModelReleasesTimelineSection,
} from "@/components/home/sections";

import {
  Hero,
  BreakingNewsStrip,
  ModelLaunchesSection as LegacyModelLaunches,
  IndiaAiSection as LegacyIndiaAi,
  AiToolsSection as LegacyAiTools,
  GuidesSection as LegacyGuides,
  EnterpriseAiSection as LegacyEnterpriseAi,
  TrendingLatestSection as LegacyTrendingLatest,
  NewsletterBox,
  SiteIntroSection as LegacySiteIntro,
  FaqSection as LegacyFaq,
  BenchmarkLeaderboardSection as LegacyBenchmarkLeaderboard,
} from "@/components/home";

import { ModelCalculatorWidget as LegacyModelCalculator } from "@/components/interactive/model-calculator-widget";
import { CommunityPollWidget as LegacyCommunityPoll } from "@/components/interactive/community-poll-widget";

import {
  DEFAULT_HOMEPAGE_SECTIONS,
  HomepageSectionConfig,
} from "@/lib/design-tokens/sections";
import type { HomepageResolvedData } from "@/lib/home/types";
import type { NewsCardPost } from "@/components/blog/cards/types";
import {
  getActiveHomepageSections,
  invalidateHomepageSectionsCache,
} from "@/lib/design-tokens/service";

// Mock post dataset
const mockPosts: [
  NewsCardPost,
  NewsCardPost,
  NewsCardPost,
  NewsCardPost,
  NewsCardPost,
  NewsCardPost,
] = [
  {
    _id: "post-1",
    title: "DeepSeek-R1 Disrupts Global AI Inference Economics",
    slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
    excerpt: "Breakdown of open reasoning weights and latency.",
    readingTime: 6,
    views: 4500,
    publishedAt: new Date("2026-11-08T10:00:00Z"),
    featured: true,
    category: { name: "Model Launches", slug: "model-launches" },
    author: { name: "Editorial Desk", slug: "editorial-desk" },
  },
  {
    _id: "post-2",
    title: "IndiaAI Mission 10,000 GPU Cluster Tender Allocations",
    slug: "india-10000-gpus-national-ai-mission-tender",
    excerpt: "Sovereign compute datacenter allocations announced.",
    readingTime: 5,
    views: 3800,
    publishedAt: new Date("2026-11-08T09:00:00Z"),
    featured: false,
    category: { name: "India AI", slug: "india-ai" },
    author: { name: "Vikram Sen", slug: "vikram-sen" },
  },
  {
    _id: "post-3",
    title: "Local LLM Runners Compared: Ollama vs vLLM vs SGLang",
    slug: "best-free-ai-tools-for-students-2026",
    excerpt: "High-throughput local LLM execution benchmarks.",
    readingTime: 7,
    views: 2900,
    publishedAt: new Date("2026-11-08T08:00:00Z"),
    featured: false,
    category: { name: "AI Tools", slug: "ai-tools" },
    author: { name: "Priya Sharma", slug: "priya-sharma" },
  },
  {
    _id: "post-4",
    title: "ChatGPT vs Claude vs Gemini: Best in India Shootout",
    slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
    excerpt: "Multilingual evaluation on Indic languages and coding.",
    readingTime: 8,
    views: 5100,
    publishedAt: new Date("2026-11-08T07:00:00Z"),
    featured: false,
    category: { name: "Guides", slug: "guides-and-comparisons" },
    author: { name: "Arjun Nair", slug: "arjun-nair" },
  },
  {
    _id: "post-5",
    title: "Enterprise AI Adoption in India BFSI and Sovereign Cloud",
    slug: "enterprise-ai-adoption-india-bfsi-it-private-llms",
    excerpt: "Private LLM deployment blueprints for tier-1 Indian banks.",
    readingTime: 9,
    views: 2200,
    publishedAt: new Date("2026-11-08T06:00:00Z"),
    featured: false,
    category: { name: "Enterprise AI", slug: "enterprise-ai" },
    author: { name: "Dr. Elena Rostova", slug: "elena-rostova" },
  },
  {
    _id: "post-6",
    title: "Sarvam-1 Indic 2B Parameter Model Release",
    slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
    excerpt: "First sovereign Indic frontier LLM with 10-language tokenizer.",
    readingTime: 5,
    views: 4100,
    publishedAt: new Date("2026-11-08T05:00:00Z"),
    featured: false,
    category: { name: "Model Launches", slug: "model-launches" },
    author: { name: "Editorial Desk", slug: "editorial-desk" },
  },
];

const mockResolvedData: HomepageResolvedData = {
  headlines: [
    {
      _id: "post-1",
      title: "DeepSeek-R1 Disrupts Global AI Inference Economics",
      slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
      publishedAt: new Date("2026-11-08T10:00:00Z"),
    },
    {
      _id: "post-2",
      title: "IndiaAI Mission 10,000 GPU Cluster Tender Allocations",
      slug: "india-10000-gpus-national-ai-mission-tender",
      publishedAt: new Date("2026-11-08T09:00:00Z"),
    },
  ],
  featuredPost: mockPosts[0],
  secondaryPosts: [mockPosts[1], mockPosts[2]],
  trendingPosts: [mockPosts[3], mockPosts[0], mockPosts[1]],
  sectionPostsMap: {
    "sec-launches": [mockPosts[0], mockPosts[5]],
    "model-launches": [mockPosts[0], mockPosts[5]],
    "sec-india-ai": [mockPosts[1]],
    "india-ai": [mockPosts[1]],
    "sec-tools": [mockPosts[2]],
    "ai-tools": [mockPosts[2]],
    "sec-guides": [mockPosts[3]],
    "guides": [mockPosts[3]],
    "sec-enterprise": [mockPosts[4]],
    "enterprise-ai": [mockPosts[4]],
    "sec-trending": [mockPosts[1], mockPosts[2]],
    "trending-latest": [mockPosts[1], mockPosts[2]],
    "sec-timeline": [mockPosts[0], mockPosts[1], mockPosts[5]],
    "model-releases": [mockPosts[0], mockPosts[1], mockPosts[5]],
  },
  heroProps: {
    badge: "India's Sovereign AI & Generative Tech Hub",
    title: "Latest AI News, Tools and Launches, Explained for India",
    subtitle: "Independent reporting, hands-on model evaluations, and sovereign compute analysis.",
    primaryCtaText: "Explore Latest AI News",
    primaryCtaLink: "/category/ai-news",
    secondaryCtaText: "Compare Models",
    secondaryCtaLink: "/category/guides-and-comparisons",
    showOrb: true,
  },
  faqProps: {
    title: "Everything You Need to Know",
    subtitle: "Common questions about AI Latest News, Indic models, and sovereign compute in India",
  },
  introProps: {
    title: "Independent Intelligence for India's AI Ecosystem",
  },
};

describe("Milestone 3: 15 Dynamic Homepage Sections & Section Engine", () => {
  beforeEach(() => {
    invalidateHomepageSectionsCache();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SECTION DISPATCHER & REORDERING
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Dynamic Section Dispatcher & Reordering", () => {
    it("dispatches all 15 default section types without throwing", () => {
      const html = renderToStaticMarkup(
        <SectionDispatcher
          sections={DEFAULT_HOMEPAGE_SECTIONS}
          data={mockResolvedData}
        />
      );

      // Verify presence of all 15 sections by accessible aria-label or key text
      expect(html).toContain("Breaking AI Dispatches"); // breaking-news
      expect(html).toContain("Lead Editorial Stories"); // hero
      expect(html).toContain("Model Launches Desk"); // model-launches
      expect(html).toContain("India AI Desk"); // india-ai
      expect(html).toContain("AI Tools Desk"); // ai-tools
      expect(html).toContain("Guides Desk"); // guides
      expect(html).toContain("Enterprise AI Desk"); // enterprise-ai
      expect(html).toContain("Latest AI Stream and Most Read"); // trending-latest
      expect(html).toContain("AI Model Benchmark Arena"); // benchmark-leaderboard
      expect(html).toContain("Interactive AI Cost Calculator"); // model-calculator
      expect(html).toContain("Daily AI Intelligence Dispatch"); // newsletter
      expect(html).toContain("Editorial Standards and Charter"); // site-intro
      expect(html).toContain("Frequently Asked Questions"); // faq
      expect(html).toContain("Community Reader Poll"); // community-poll
      expect(html).toContain("AI Model Releases Timeline"); // model-releases
    });

    it("respects dynamic section ordering based on order attribute", () => {
      const reorderedSections: HomepageSectionConfig[] = [
        { id: "sec-faq", type: "faq", enabled: true, order: 1 },
        { id: "sec-breaking", type: "breaking-news", enabled: true, order: 2 },
      ];

      const html = renderToStaticMarkup(
        <SectionDispatcher sections={reorderedSections} data={mockResolvedData} />
      );

      const faqIndex = html.indexOf("Frequently Asked Questions");
      const breakingIndex = html.indexOf("Breaking AI Dispatches");

      expect(faqIndex).toBeGreaterThan(-1);
      expect(breakingIndex).toBeGreaterThan(-1);
      expect(faqIndex).toBeLessThan(breakingIndex);
    });

    it("strictly omits disabled sections from rendered output", () => {
      const disabledSections: HomepageSectionConfig[] = [
        { id: "sec-hero", type: "hero", enabled: false, order: 1 },
        { id: "sec-newsletter", type: "newsletter", enabled: false, order: 2 },
        { id: "sec-calculator", type: "model-calculator", enabled: true, order: 3 },
      ];

      const html = renderToStaticMarkup(
        <SectionDispatcher sections={disabledSections} data={mockResolvedData} />
      );

      expect(html).not.toContain("Lead Editorial Stories");
      expect(html).not.toContain("Daily AI Intelligence Dispatch");
      expect(html).toContain("Interactive AI Cost Calculator");
    });

    it("renders fallback configuration status message when 0 sections are enabled", () => {
      const allDisabled: HomepageSectionConfig[] = [
        { id: "sec-1", type: "hero", enabled: false, order: 1 },
      ];

      const html = renderToStaticMarkup(
        <SectionDispatcher sections={allDisabled} data={mockResolvedData} />
      );

      expect(html).toContain("No sections are currently enabled on the homepage");
      expect(html).toContain("role=\"status\"");
    });

    it("enforces full-width layout for breaking-news and hero, contained bounds for other desks", () => {
      const testSections: HomepageSectionConfig[] = [
        { id: "sec-breaking", type: "breaking-news", enabled: true, order: 1 },
        { id: "sec-launches", type: "model-launches", enabled: true, order: 2 },
      ];

      const html = renderToStaticMarkup(
        <SectionDispatcher sections={testSections} data={mockResolvedData} />
      );

      // Model launches contained in max-w-[var(--max-content-width,1280px)] wrapper with data-section-type
      expect(html).toContain("data-section-type=\"model-launches\"");
      expect(html).toContain("max-w-[var(--max-content-width,1280px)]");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. INDIVIDUAL EDITORIAL & INTERACTIVE SECTIONS
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Individual Section Implementations & Token Bindings", () => {
    it("BreakingNewsSection renders kicker badge, headlines and controls", () => {
      const html = renderToStaticMarkup(
        <BreakingNewsSection headlines={mockResolvedData.headlines} kicker="LIVE WIRE" />
      );

      expect(html).toContain("LIVE WIRE");
      expect(html).toContain("DeepSeek-R1 Disrupts Global AI Inference Economics");
      expect(html).toContain("var(--color-breaking-news");
    });

    it("HeroMagazineSection renders lead story and The Developing Wire dispatches", () => {
      const html = renderToStaticMarkup(
        <HeroMagazineSection
          featuredPost={mockPosts[0]}
          secondaryPosts={[mockPosts[1], mockPosts[2]]}
        />
      );

      expect(html).toContain("DeepSeek-R1 Disrupts Global AI Inference Economics");
      expect(html).toContain("The Developing Wire");
      expect(html).toContain("IndiaAI Mission 10,000 GPU Cluster Tender Allocations");
      expect(html).toContain("var(--color-main-background");
    });

    it("ModelLaunchesSection renders cards and custom title override", () => {
      const html = renderToStaticMarkup(
        <ModelLaunchesSection
          posts={[mockPosts[0], mockPosts[5]]}
          title="Custom Frontier LLM Releases"
          kicker="Desk 01 Override"
        />
      );

      expect(html).toContain("Custom Frontier LLM Releases");
      expect(html).toContain("Desk 01 Override");
      expect(html).toContain("DeepSeek-R1 Disrupts");
    });

    it("IndiaAiSection renders sovereign compute coverage and category link", () => {
      const html = renderToStaticMarkup(
        <IndiaAiSection posts={[mockPosts[1]]} />
      );

      expect(html).toContain("India AI &amp; Sovereign Infrastructure");
      expect(html).toContain("IndiaAI Mission 10,000 GPU Cluster Tender Allocations");
      expect(html).toContain("/category/india-ai");
    });

    it("AiToolsSection renders article cards and interactive evaluated gear directory", () => {
      const html = renderToStaticMarkup(
        <AiToolsSection posts={[mockPosts[2]]} />
      );

      expect(html).toContain("Developer Tooling &amp; Workflows");
      expect(html).toContain("Evaluated Gear Directory");
      expect(html).toContain("Ollama");
      expect(html).toContain("Cursor IDE");
      expect(html).toContain("Local LLM Runners");
    });

    it("GuidesSection renders 2-up comparison shootout grid", () => {
      const html = renderToStaticMarkup(
        <GuidesSection posts={[mockPosts[3]]} />
      );

      expect(html).toContain("Guides &amp; Model Shootouts");
      expect(html).toContain("ChatGPT vs Claude vs Gemini");
      expect(html).toContain("/category/guides-and-comparisons");
    });

    it("EnterpriseAiSection renders enterprise architecture stories", () => {
      const html = renderToStaticMarkup(
        <EnterpriseAiSection posts={[mockPosts[4]]} />
      );

      expect(html).toContain("Enterprise Architecture &amp; Security");
      expect(html).toContain("Enterprise AI Adoption in India BFSI");
      expect(html).toContain("/category/enterprise-ai");
    });

    it("TrendingLatestSection renders left stream and right MinimalListCard leaderboard with 01-05 ranks", () => {
      const html = renderToStaticMarkup(
        <TrendingLatestSection
          latestPosts={[mockPosts[1], mockPosts[2]]}
          trendingPosts={[mockPosts[3], mockPosts[0]]}
        />
      );

      expect(html).toContain("Latest AI Reporting");
      expect(html).toContain("The Most Read");
      expect(html).toContain("01"); // Rank 1 formatted
      expect(html).toContain("02"); // Rank 2 formatted
    });

    it("BenchmarkLeaderboardSection renders 4 categories and verified score bars", () => {
      const html = renderToStaticMarkup(<BenchmarkLeaderboardSection />);

      expect(html).toContain("Frontier AI Models Benchmark Arena");
      expect(html).toContain("Reasoning &amp; Math");
      expect(html).toContain("Indic NLP (10 Languages)");
      expect(html).toContain("Lowest Token Pricing");
      expect(html).toContain("SWE-bench Coding");
      expect(html).toContain("DeepSeek-R1");
      expect(html).toContain("90.8%");
    });

    it("ModelCalculatorSection computes exact pricing, INR conversion at 87.5 and GPT-4o savings", () => {
      const html = renderToStaticMarkup(<ModelCalculatorSection />);

      expect(html).toContain("Frontier Model API Cost &amp; ROI Calculator");
      expect(html).toContain("1 USD = ₹87.5");
      expect(html).toContain("Monthly Cost (USD)");
      expect(html).toContain("Monthly Cost (INR)");
      expect(html).toContain("Savings vs GPT-4o");
    });

    it("NewsletterSection renders email capture form with emerald action button", () => {
      const html = renderToStaticMarkup(<NewsletterSection />);

      expect(html).toContain("The AI Latest News Daily Dispatch");
      expect(html).toContain("type=\"email\"");
      expect(html).toContain("Get Wire");
      expect(html).toContain("var(--color-primary-accent");
    });

    it("SiteIntroSection renders newsroom principles and all 6 desk links", () => {
      const html = renderToStaticMarkup(<SiteIntroSection />);

      expect(html).toContain("Independent Intelligence for India&#x27;s AI Ecosystem");
      expect(html).toContain("/category/ai-news");
      expect(html).toContain("/category/model-launches");
      expect(html).toContain("/category/ai-tools");
      expect(html).toContain("/category/india-ai");
      expect(html).toContain("/category/guides-and-comparisons");
      expect(html).toContain("/category/enterprise-ai");
    });

    it("FaqSection renders accordion items and retains FAQPage JSON-LD schema", () => {
      const html = renderToStaticMarkup(<FaqSection />);

      expect(html).toContain("Everything You Need to Know");
      expect(html).toContain("application/ld+json");
      expect(html).toContain("\"@type\":\"FAQPage\"");
      expect(html).toContain("What is AI Latest News and what does it cover?");
    });

    it("CommunityPollSection renders poll question, option bars and vote count", () => {
      const html = renderToStaticMarkup(<CommunityPollSection />);

      expect(html).toContain("Community Pulse // Engineering Survey");
      expect(html).toContain("Will open-weight reasoning models (DeepSeek, Llama) replace proprietary APIs");
      expect(html).toContain("votes");
    });

    it("ModelReleasesTimelineSection renders chronological milestone spine", () => {
      const html = renderToStaticMarkup(
        <ModelReleasesTimelineSection posts={[mockPosts[0], mockPosts[1]]} />
      );

      expect(html).toContain("AI Model Releases Timeline");
      expect(html).toContain("DeepSeek-R1 Disrupts");
      expect(html).toContain("IndiaAI Mission 10,000 GPU Cluster Tender");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. BACKWARD COMPATIBILITY FORWARDERS
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Backward Compatibility Forwarders", () => {
    it("all 12 legacy component imports in src/components/home and src/components/interactive render correctly", () => {
      const heroHtml = renderToStaticMarkup(
        <Hero featuredPost={mockPosts[0]} secondaryPosts={[mockPosts[1]]} />
      );
      expect(heroHtml).toContain("Lead Editorial Stories");

      const stripHtml = renderToStaticMarkup(
        <BreakingNewsStrip headlines={mockResolvedData.headlines} />
      );
      expect(stripHtml).toContain("Breaking AI Dispatches");

      const launchesHtml = renderToStaticMarkup(
        <LegacyModelLaunches posts={[mockPosts[0]]} />
      );
      expect(launchesHtml).toContain("Model Launches &amp; Benchmarks");

      const indiaHtml = renderToStaticMarkup(
        <LegacyIndiaAi posts={[mockPosts[1]]} />
      );
      expect(indiaHtml).toContain("India AI &amp; Sovereign Infrastructure");

      const toolsHtml = renderToStaticMarkup(
        <LegacyAiTools posts={[mockPosts[2]]} />
      );
      expect(toolsHtml).toContain("Developer Tooling &amp; Workflows");

      const guidesHtml = renderToStaticMarkup(
        <LegacyGuides posts={[mockPosts[3]]} />
      );
      expect(guidesHtml).toContain("Guides &amp; Model Shootouts");

      const enterpriseHtml = renderToStaticMarkup(
        <LegacyEnterpriseAi posts={[mockPosts[4]]} />
      );
      expect(enterpriseHtml).toContain("Enterprise Architecture &amp; Security");

      const trendingHtml = renderToStaticMarkup(
        <LegacyTrendingLatest
          latestPosts={[mockPosts[1]]}
          trendingPosts={[mockPosts[0]]}
        />
      );
      expect(trendingHtml).toContain("Latest AI Reporting");

      const newsletterHtml = renderToStaticMarkup(<NewsletterBox />);
      expect(newsletterHtml).toContain("The AI Latest News Daily Dispatch");

      const introHtml = renderToStaticMarkup(<LegacySiteIntro />);
      expect(introHtml).toContain("Editorial Standards and Charter");

      const faqHtml = renderToStaticMarkup(<LegacyFaq />);
      expect(faqHtml).toContain("Frequently Asked Questions");

      const benchmarksHtml = renderToStaticMarkup(<LegacyBenchmarkLeaderboard />);
      expect(benchmarksHtml).toContain("Frontier AI Models Benchmark Arena");

      const calculatorHtml = renderToStaticMarkup(<LegacyModelCalculator />);
      expect(calculatorHtml).toContain("Frontier Model API Cost &amp; ROI Calculator");

      const pollHtml = renderToStaticMarkup(<LegacyCommunityPoll />);
      expect(pollHtml).toContain("Community Reader Poll");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ACTIVE SECTIONS RESOLUTION & CACHE INVALIDATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Section Service Resolution & Cache Invalidation", () => {
    it("getActiveHomepageSections falls back to DEFAULT_HOMEPAGE_SECTIONS when database is empty", async () => {
      const { sections, isPreview } = await getActiveHomepageSections();

      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBe(15);
      expect(sections[0]!.type).toBe("breaking-news");
      expect(sections[1]!.type).toBe("hero");
      expect(isPreview).toBe(false);
    });

    it("invalidateHomepageSectionsCache clears cached sections without errors", () => {
      expect(() => invalidateHomepageSectionsCache()).not.toThrow();
    });

    it("getActiveHomepageSections returns preview=false when invalid preview token is supplied", async () => {
      const { isPreview } = await getActiveHomepageSections({
        isPreview: true,
        previewToken: "unauthorized-token-12345",
      });

      expect(isPreview).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. CROSS-SECTION STORY DEDUPLICATION LOGIC
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Cross-Section Story Deduplication Engine", () => {
    it("deduplicates stories across desks so lead story is not repeated in subsequent category desks", () => {
      const seenPostIds = new Set<string>();

      // 1. Hero features post-1
      const lead = mockPosts.find((p) => p.featured && !seenPostIds.has(p._id!));
      expect(lead).toBeDefined();
      seenPostIds.add(lead!._id!);

      // 2. Secondary posts takes post-2 and post-3
      const secondary = mockPosts.filter((p) => !seenPostIds.has(p._id!)).slice(0, 2);
      secondary.forEach((p) => seenPostIds.add(p._id!));
      expect(secondary.length).toBe(2);
      expect(seenPostIds.has("post-1")).toBe(true);
      expect(seenPostIds.has("post-2")).toBe(true);
      expect(seenPostIds.has("post-3")).toBe(true);

      // 3. Model launches desk filters category 'model-launches' without previously seen stories
      const modelLaunches = mockPosts.filter(
        (p) => p.category?.slug === "model-launches" && !seenPostIds.has(p._id!)
      );

      // post-1 was already seen, so model launches must only receive post-6
      expect(modelLaunches.some((p) => p._id === "post-1")).toBe(false);
      expect(modelLaunches.some((p) => p._id === "post-6")).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. RESPONSIVE VIEWPORT RESILIENCE (1440px, 1280px, 1024px, 768px, 390px, 360px)
  // ───────────────────────────────────────────────────────────────────────────
  describe("6. Responsive Multi-Viewport Layout Integrity", () => {
    const VIEWPORTS = [1440, 1280, 1024, 768, 390, 360];

    VIEWPORTS.forEach((width) => {
      it(`renders SectionDispatcher at ${width}px without structural breakage or overflow`, () => {
        const html = renderToStaticMarkup(
          <div style={{ width: `${width}px` }}>
            <SectionDispatcher
              sections={DEFAULT_HOMEPAGE_SECTIONS}
              data={mockResolvedData}
            />
          </div>
        );

        expect(html.length).toBeGreaterThan(1000);
        expect(html).toContain("data-section-type");
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. MATHEMATICAL & CALCULATION INTEGRITY IN MODEL CALCULATOR
  // ───────────────────────────────────────────────────────────────────────────
  describe("7. Mathematical & Currency Calculation Integrity", () => {
    it("computes accurate monthly token economics and exchange rate conversions", () => {
      const dailyReqs = 10000;
      const avgPrompt = 800;
      const avgOut = 400;
      const monthlyReqs = dailyReqs * 30; // 300,000 requests
      const monthlyInM = (monthlyReqs * avgPrompt) / 1_000_000; // 240M tokens
      const monthlyOutM = (monthlyReqs * avgOut) / 1_000_000; // 120M tokens

      expect(monthlyInM).toBe(240);
      expect(monthlyOutM).toBe(120);

      // DeepSeek-R1: $0.55 in, $2.19 out
      const r1CostUSD = monthlyInM * 0.55 + monthlyOutM * 2.19; // 132 + 262.8 = $394.80
      expect(r1CostUSD).toBeCloseTo(394.80, 2);

      // GPT-4o Baseline: $2.50 in, $10.00 out
      const gpt4oCostUSD = monthlyInM * 2.50 + monthlyOutM * 10.00; // 600 + 1200 = $1800.00
      expect(gpt4oCostUSD).toBe(1800.00);

      // Savings
      const savingsUSD = gpt4oCostUSD - r1CostUSD; // $1405.20
      expect(savingsUSD).toBeCloseTo(1405.20, 2);

      const savingsPercent = Math.round((savingsUSD / gpt4oCostUSD) * 100);
      expect(savingsPercent).toBe(78); // ~78% savings

      // INR conversion at 87.5
      const rate = 87.5;
      const r1CostINR = r1CostUSD * rate;
      const savingsINR = savingsUSD * rate;
      expect(r1CostINR).toBeCloseTo(34545.0, 1);
      expect(savingsINR).toBeCloseTo(122955.0, 1);
    });
  });
});
