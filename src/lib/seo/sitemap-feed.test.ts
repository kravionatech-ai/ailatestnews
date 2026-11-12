import { describe, it, expect, vi } from "vitest";
import {
  resolveCanonicalEntryUrl,
  normalizeChangeFrequency,
  isUrlExcluded,
  buildCustomSitemapRoutes,
  deduplicateSitemapEntries,
  buildUrlsetXml,
  buildSitemapIndexXml,
  buildCustomNewsItems,
  mergeNewsItems,
  buildGoogleNewsXml,
  buildCustomFeedItems,
  buildRssFeedXml,
  safeCdata,
  escapeXml,
  NO_CACHE_XML_HEADERS,
  NO_CACHE_TEXT_HEADERS,
  getRssFeedItems,
  getGoogleNewsArticles,
  getAllSitemapCollections,
  getCoreStaticSitemapEntries,
  extractHtmlImageMedia,
  getImageSitemapEntries,
  buildImageSitemapXml,
} from "./seo-settings-service";
import { buildEntityMetadata } from "./fallback";
import type { ICustomSeoEntry, ISeoSettings } from "@/lib/db/models/seo-settings.model";

vi.mock("@/lib/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

import { Post, Category, Tag, Page, Setting } from "@/lib/db/models";
import * as sitemapRoute from "@/app/sitemap.xml/route";
import * as imageSitemapRoute from "@/app/image-sitemap.xml/route";
import * as sitemapCustomRoute from "@/app/sitemap-custom.xml/route";
import * as feedRoute from "@/app/feed.xml/route";
import * as newsSitemapRoute from "@/app/news-sitemap.xml/route";
import * as sitemapNewsRedirectRoute from "@/app/sitemap-news.xml/route";
import * as robotsRoute from "@/app/robots.txt/route";

describe("SEO Sitemap, News & RSS Feed Engine", () => {
  const siteUrl = "https://kraviona.site";

  describe("resolveCanonicalEntryUrl", () => {
    it("resolves root and relative paths against siteUrl", () => {
      expect(resolveCanonicalEntryUrl("/", siteUrl)).toBe("https://kraviona.site");
      expect(resolveCanonicalEntryUrl("/ai-report-2026", siteUrl)).toBe(
        "https://kraviona.site/ai-report-2026"
      );
      expect(resolveCanonicalEntryUrl("benchmarks/llm", `${siteUrl}/`)).toBe(
        "https://kraviona.site/benchmarks/llm"
      );
    });

    it("preserves valid http/https absolute URLs and rewrites legacy origins", () => {
      expect(
        resolveCanonicalEntryUrl("https://kraviona.site/blog/test?ref=rss", siteUrl)
      ).toBe("https://kraviona.site/blog/test?ref=rss");
      expect(
        resolveCanonicalEntryUrl("https://ainews.kraviona.com/blog/legacy?ref=rss", siteUrl)
      ).toBe("https://kraviona.site/blog/legacy?ref=rss");
    });

    it("rejects empty strings and unsafe URL schemes", () => {
      expect(resolveCanonicalEntryUrl("", siteUrl)).toBeNull();
      expect(resolveCanonicalEntryUrl("   ", siteUrl)).toBeNull();
      expect(resolveCanonicalEntryUrl("javascript:alert(1)", siteUrl)).toBeNull();
      expect(resolveCanonicalEntryUrl("data:text/html,<script>", siteUrl)).toBeNull();
      expect(resolveCanonicalEntryUrl("vbscript:msgbox(1)", siteUrl)).toBeNull();
    });
  });

  describe("normalizeChangeFrequency", () => {
    it("accepts valid frequencies case-insensitively and falls back safely", () => {
      expect(normalizeChangeFrequency("DAILY")).toBe("daily");
      expect(normalizeChangeFrequency("Hourly")).toBe("hourly");
      expect(normalizeChangeFrequency("invalid-freq", "weekly")).toBe("weekly");
    });
  });

  describe("Double XML escaping fix & safeCdata", () => {
    it("does not double-escape titles or publication names in buildGoogleNewsXml", () => {
      const xml = buildGoogleNewsXml([
        {
          url: "https://kraviona.site/blog/apple-gemini-update?a=1&b=2",
          title: `Apple's AI & "Gemini" <2.5>`,
          publicationDate: "2026-11-11T08:00:00.000Z",
          publicationName: "Kraviona AI & Tech",
          publicationLanguage: "en",
        },
      ]);

      expect(xml).toContain(`<news:title>Apple&apos;s AI &amp; &quot;Gemini&quot; &lt;2.5&gt;</news:title>`);
      expect(xml).toContain(`<news:name>Kraviona AI &amp; Tech</news:name>`);
      expect(xml).toContain(`<loc>https://kraviona.site/blog/apple-gemini-update?a=1&amp;b=2</loc>`);
      expect(xml).not.toContain("&amp;amp;");
      expect(xml).not.toContain("&amp;apos;");
      expect(xml).not.toContain("&amp;quot;");
    });

    it("wraps RSS CDATA safely even when content includes ]]>", () => {
      const result = safeCdata("Hello ]]> World");
      expect(result).toBe("<![CDATA[Hello ]]]]><![CDATA[> World]]>");
    });

    it("strips illegal XML control characters while escaping entities", () => {
      expect(escapeXml("Test\u0000\u0007 & <tag>")).toBe("Test &amp; &lt;tag&gt;");
    });
  });

  describe("Custom Sitemap Entries & Deduplication", () => {
    const baseEntries: ICustomSeoEntry[] = [
      {
        id: "1",
        url: "/special-report",
        title: "Special AI Report",
        changeFrequency: "daily",
        priority: 0.95,
        includeInSitemap: true,
        includeInFeed: true,
        includeInNewsSitemap: false,
        enabled: true,
        lastModified: new Date("2026-11-11T06:00:00.000Z"),
      },
      {
        id: "2",
        url: "/paused-page",
        title: "Paused Page",
        changeFrequency: "weekly",
        priority: 0.5,
        includeInSitemap: true,
        includeInFeed: true,
        includeInNewsSitemap: true,
        enabled: false,
      },
      {
        id: "3",
        url: "/secret/internal-doc",
        title: "Secret Doc",
        changeFrequency: "weekly",
        priority: 0.4,
        includeInSitemap: true,
        includeInFeed: false,
        includeInNewsSitemap: false,
        enabled: true,
      },
      {
        id: "4",
        url: "https://kraviona.site/feed-only-item",
        title: "Feed Only Item",
        changeFrequency: "weekly",
        priority: 0.7,
        includeInSitemap: false,
        includeInFeed: true,
        includeInNewsSitemap: false,
        enabled: true,
      },
    ];

    it("filters out disabled, non-sitemap, and excludedUrls wildcard entries", () => {
      const routes = buildCustomSitemapRoutes(baseEntries, siteUrl, ["/secret/*"]);
      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual({
        url: "https://kraviona.site/special-report",
        lastModified: "2026-11-11T06:00:00.000Z",
        changeFrequency: "daily",
        priority: "1.0", // rounded cleanly to 1 decimal place
      });
    });

    it("deduplicates URLs letting later overrides win", () => {
      const merged = deduplicateSitemapEntries([
        {
          url: "https://kraviona.site/special-report",
          lastModified: "2026-11-01T00:00:00.000Z",
          changeFrequency: "monthly",
          priority: "0.5",
        },
        {
          url: "https://kraviona.site/special-report",
          lastModified: "2026-11-11T06:00:00.000Z",
          changeFrequency: "daily",
          priority: "1.0",
        },
      ]);

      expect(merged).toHaveLength(1);
      expect(merged[0]?.priority).toBe("1.0");
      expect(merged[0]?.changeFrequency).toBe("daily");

      const xml = buildUrlsetXml(merged);
      expect(xml).toContain("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
      expect(xml).toContain("<priority>1.0</priority>");
    });

    it("builds valid Sitemap Index referencing /sitemap-custom.xml", () => {
      const xml = buildSitemapIndexXml([
        { loc: `${siteUrl}/sitemap-articles.xml`, lastmod: "2026-11-11T06:00:00.000Z" },
        { loc: `${siteUrl}/sitemap-custom.xml`, lastmod: "2026-11-11T06:00:00.000Z" },
      ]);
      expect(xml).toContain("<sitemapindex");
      expect(xml).toContain(`${siteUrl}/sitemap-custom.xml`);
    });
  });

  describe("Custom News & RSS Feed Builders", () => {
    const cutoffDate = new Date("2026-11-09T12:00:00.000Z");

    it("enforces cutoff window and non-empty title for custom news entries", () => {
      const customUrls: ICustomSeoEntry[] = [
        {
          id: "n1",
          url: "/breaking-ai-brief",
          title: "Breaking: India Sovereign GPU Cluster Update",
          publicationDate: new Date("2026-11-11T09:00:00.000Z"),
          changeFrequency: "hourly",
          priority: 0.9,
          includeInSitemap: true,
          includeInFeed: true,
          includeInNewsSitemap: true,
          enabled: true,
        },
        {
          id: "n2",
          url: "/stale-news",
          title: "Old News Item",
          publicationDate: new Date("2026-11-01T00:00:00.000Z"),
          changeFrequency: "weekly",
          priority: 0.5,
          includeInSitemap: true,
          includeInFeed: false,
          includeInNewsSitemap: true,
          enabled: true,
        },
        {
          id: "n3",
          url: "/missing-title-news",
          title: "   ",
          publicationDate: new Date("2026-11-11T09:00:00.000Z"),
          changeFrequency: "daily",
          priority: 0.6,
          includeInSitemap: true,
          includeInFeed: false,
          includeInNewsSitemap: true,
          enabled: true,
        },
      ];

      const customNews = buildCustomNewsItems(customUrls, {
        siteUrl,
        excludedUrls: [],
        publicationName: "Kraviona AI News",
        publicationLanguage: "en",
        cutoffDate,
      });

      expect(customNews).toHaveLength(1);
      expect(customNews[0]?.url).toBe("https://kraviona.site/breaking-ai-brief");

      const merged = mergeNewsItems([
        {
          url: "https://kraviona.site/blog/older-post",
          title: "Older Auto Post",
          publicationDate: "2026-11-10T10:00:00.000Z",
          publicationName: "Kraviona AI News",
          publicationLanguage: "en",
        },
        ...customNews,
      ]);
      expect(merged[0]?.title).toBe("Breaking: India Sovereign GPU Cluster Update");
    });

    it("builds RSS 2.0 XML from custom feed entries with valid metadata", () => {
      const feedItems = buildCustomFeedItems(
        [
          {
            id: "f1",
            url: "/guide-2026",
            title: "2026 Enterprise AI Playbook & Checklist",
            description: "Full deployment checklist ]]> verified.",
            authorName: "Editorial Desk",
            publicationDate: new Date("2026-11-11T07:30:00.000Z"),
            changeFrequency: "weekly",
            priority: 0.8,
            includeInSitemap: true,
            includeInFeed: true,
            includeInNewsSitemap: false,
            enabled: true,
          },
        ],
        siteUrl,
        []
      );

      expect(feedItems).toHaveLength(1);
      const rssXml = buildRssFeedXml(feedItems, {
        siteName: "AI Latest News",
        siteUrl,
        tagline: "AI Intelligence & Tech",
        language: "en",
      });

      expect(rssXml).toContain(`<rss version="2.0"`);
      expect(rssXml).toContain(`xmlns:dc="http://purl.org/dc/elements/1.1/"`);
      expect(rssXml).toContain(`<title>Kraviona AI News — RSS Feed</title>`);
      expect(rssXml).toContain(`<atom:link href="https://kraviona.site/feed.xml"`);
      expect(rssXml).toContain(`<guid isPermaLink="true">https://kraviona.site/guide-2026</guid>`);
      expect(rssXml).toContain(`<dc:creator><![CDATA[Editorial Desk]]></dc:creator>`);
      expect(rssXml).not.toContain(`<author>`);
      expect(rssXml).toContain(`]]]]><![CDATA[>`);
    });
  });

  describe("Live DB-Backed Collection Helpers (Mocked Mongoose)", () => {
    const mockSettings = {
      sitemap: {
        enabled: true,
        siteUrl,
        includeArticles: true,
        includeCategories: true,
        includeTags: true,
        includePages: true,
        includeNewsSitemap: true,
        newsPublicationName: "Kraviona AI News",
        newsPublicationLanguage: "en",
        newsTimeWindowHours: 48,
        excludedUrls: ["/blog/excluded-post"],
        customUrls: [
          {
            id: "c1",
            url: "/custom-launch",
            title: "Custom Launch Spotlight",
            description: "Curated custom launch spotlight.",
            authorName: "Kraviona Desk",
            publicationDate: new Date(),
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
            includeInSitemap: true,
            includeInFeed: true,
            includeInNewsSitemap: true,
            enabled: true,
          },
        ],
        enableSplitSitemaps: false,
        maxUrlsPerSitemap: 50000,
      },
      robots: {
        enabled: true,
        customRawEnabled: false,
        rawContent: "",
        rules: [],
        sitemaps: [],
        includeNewsSitemapInRobots: true,
      },
    } as unknown as ISeoSettings;

    it("includes newly published posts with missing publishedAt fallback & custom entries across sitemap, news, and feed", async () => {
      const now = new Date();
      const postDocs = [
        {
          slug: "fresh-news-with-amp",
          title: "OpenAI & Anthropic Benchmark's Race",
          excerpt: "Fresh benchmark roundup",
          publishedAt: now,
          updatedAt: now,
          createdAt: now,
          author: { name: "Kraviona Desk" },
          seo: { robots: { index: true }, sitemap: { include: true, priority: 0.9, changefreq: "daily" } },
        },
        {
          slug: "published-no-published-at",
          title: "Fallback Date Post",
          excerpt: "Created recently without explicit publishedAt",
          publishedAt: null,
          updatedAt: now,
          createdAt: now,
          author: { name: "Auto Bot" },
          seo: { robots: { index: true }, sitemap: { include: true } },
        },
        {
          slug: "excluded-post",
          title: "Should Be Excluded",
          publishedAt: now,
          createdAt: now,
          seo: { robots: { index: true }, sitemap: { include: true } },
        },
        {
          slug: "noindex-post",
          title: "Noindex Post",
          publishedAt: now,
          createdAt: now,
          seo: { robots: { index: false }, sitemap: { include: true } },
        },
      ];

      vi.spyOn(Post, "find").mockImplementation(
        () =>
          ({
            sort: () => ({
              select: () => ({ lean: vi.fn().mockResolvedValue(postDocs) }),
              limit: () => ({
                populate: () => ({ lean: vi.fn().mockResolvedValue(postDocs) }),
              }),
            }),
            select: () => ({
              sort: () => ({
                limit: () => ({
                  populate: () => ({ lean: vi.fn().mockResolvedValue(postDocs) }),
                }),
              }),
            }),
          }) as unknown as ReturnType<typeof Post.find>
      );

      vi.spyOn(Category, "find").mockImplementation(
        () =>
          ({
            select: () => ({
              lean: vi.fn().mockResolvedValue([{ slug: "ai-models", updatedAt: now }]),
            }),
          }) as unknown as ReturnType<typeof Category.find>
      );

      vi.spyOn(Tag, "find").mockImplementation(
        () =>
          ({
            select: () => ({
              lean: vi.fn().mockResolvedValue([{ slug: "llm", updatedAt: now }]),
            }),
          }) as unknown as ReturnType<typeof Tag.find>
      );

      vi.spyOn(Page, "find").mockImplementation(
        () =>
          ({
            select: () => ({
              lean: vi.fn().mockResolvedValue([
                { slug: "zeroai", updatedAt: now }, // core route, should not duplicate
                { slug: "enterprise-ai-guide", updatedAt: now },
              ]),
            }),
          }) as unknown as ReturnType<typeof Page.find>
      );

      const collections = await getAllSitemapCollections(mockSettings);
      expect(collections.postRoutes.map((r) => r.url)).toEqual([
        "https://kraviona.site/blog/fresh-news-with-amp",
        "https://kraviona.site/blog/published-no-published-at",
      ]);
      expect(collections.pageRoutes.map((r) => r.url)).toEqual([
        "https://kraviona.site/enterprise-ai-guide",
      ]);
      expect(collections.customRoutes.map((r) => r.url)).toEqual([
        "https://kraviona.site/custom-launch",
      ]);

      const newsItems = await getGoogleNewsArticles(mockSettings);
      expect(newsItems.map((i) => i.url)).toContain(
        "https://kraviona.site/blog/published-no-published-at"
      );
      expect(newsItems.map((i) => i.url)).toContain(
        "https://kraviona.site/custom-launch"
      );
      expect(newsItems.map((i) => i.url)).not.toContain(
        "https://kraviona.site/blog/excluded-post"
      );

      const newsXml = buildGoogleNewsXml(newsItems);
      expect(newsXml).toContain("OpenAI &amp; Anthropic Benchmark&apos;s Race");
      expect(newsXml).not.toContain("&amp;amp;");

      const feedItems = await getRssFeedItems(mockSettings, 10);
      expect(feedItems.map((f) => f.url)).toContain(
        "https://kraviona.site/blog/fresh-news-with-amp"
      );
      expect(feedItems.map((f) => f.url)).toContain(
        "https://kraviona.site/custom-launch"
      );
      expect(feedItems.map((f) => f.url)).not.toContain(
        "https://kraviona.site/blog/noindex-post"
      );
    });
  });

  describe("Route Cache-Bypass Configuration", () => {
    it("exports strict no-store cache headers for XML and robots.txt endpoints", () => {
      expect(NO_CACHE_XML_HEADERS["Cache-Control"]).toBe(
        "no-store, no-cache, must-revalidate, max-age=0"
      );
      expect(NO_CACHE_XML_HEADERS["CDN-Cache-Control"]).toBe("no-store");
      expect(NO_CACHE_XML_HEADERS["Vercel-CDN-Cache-Control"]).toBe("no-store");
      expect(NO_CACHE_TEXT_HEADERS["Cache-Control"]).toBe(
        "no-store, no-cache, must-revalidate, max-age=0"
      );
    });

    it("configures force-dynamic and revalidate=0 on sitemap, image-sitemap, news, feed, and robots routes", () => {
      for (const routeMod of [
        sitemapRoute,
        imageSitemapRoute,
        sitemapCustomRoute,
        feedRoute,
        newsSitemapRoute,
        sitemapNewsRedirectRoute,
        robotsRoute,
      ]) {
        expect(routeMod.dynamic).toBe("force-dynamic");
        expect(routeMod.revalidate).toBe(0);
      }
    });

    it("includes /sitemap in static routes and preserves RSS autodiscovery in buildEntityMetadata", async () => {
      const staticRoutes = getCoreStaticSitemapEntries(siteUrl);
      expect(staticRoutes.map((r) => r.url)).toContain("https://kraviona.site/sitemap");

      vi.spyOn(Setting, "findOne").mockReturnValueOnce(
        {
          lean: vi.fn().mockResolvedValue(null),
        } as unknown as ReturnType<typeof Setting.findOne>
      );

      const meta = await buildEntityMetadata({
        entityType: "page",
        path: "/sitemap",
        title: "HTML Sitemap",
        excerpt: "Directory of published articles and categories.",
      });
      const rssTypes = meta.alternates?.types?.["application/rss+xml"];
      expect(rssTypes).toBeDefined();
      expect(JSON.stringify(rssTypes)).toContain("/feed.xml");
    });

    it("extracts valid article cover and inline images with strict XSD tag sequence", async () => {
      const htmlImages = extractHtmlImageMedia(
        `<p><img src="/uploads/chart.png" alt="Benchmark Chart" title="Chart Title" /></p>
         <p><img src="data:image/png;base64,abc" alt="Ignored Data URI" /></p>
         <p><img src="https://cdn.example.com/photo.jpg?a=1&amp;b=2" alt="Cluster Photo" /></p>`,
        siteUrl,
        "Default Article Title"
      );

      expect(htmlImages).toHaveLength(2);
      expect(htmlImages[0]).toEqual({
        loc: "https://kraviona.site/uploads/chart.png",
        caption: "Benchmark Chart",
        title: "Chart Title",
      });
      expect(htmlImages[1]?.loc).toBe("https://cdn.example.com/photo.jpg?a=1&b=2");

      const now = new Date("2026-11-11T10:00:00.000Z");
      vi.spyOn(Post, "find").mockImplementation(
        () =>
          ({
            sort: () => ({
              select: () => ({
                lean: vi.fn().mockResolvedValue([
                  {
                    slug: "visual-story",
                    title: "Visual Story",
                    coverImage: "https://res.cloudinary.com/demo/image/upload/hero.jpg",
                    coverImageAlt: "Hero Architecture",
                    contentHtml: `<img src="https://res.cloudinary.com/demo/image/upload/hero.jpg" /><img src="/uploads/diagram.png" alt="Pipeline" />`,
                    publishedAt: now,
                    seo: { robots: { index: true }, sitemap: { include: true } },
                  },
                  {
                    slug: "hidden-noindex-story",
                    title: "Hidden Noindex",
                    coverImage: "https://res.cloudinary.com/demo/image/upload/secret.jpg",
                    publishedAt: now,
                    seo: { robots: { index: false }, sitemap: { include: true } },
                  },
                ]),
              }),
            }),
          }) as unknown as ReturnType<typeof Post.find>
      );

      const mockSettings = {
        sitemap: {
          enabled: true,
          siteUrl,
          includeArticles: true,
          excludedUrls: [],
        },
      } as unknown as ISeoSettings;

      const entries = await getImageSitemapEntries(mockSettings);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.images.map((i) => i.loc)).toEqual([
        "https://res.cloudinary.com/demo/image/upload/hero.jpg",
        "https://kraviona.site/uploads/diagram.png",
      ]);

      const xml = buildImageSitemapXml(entries);
      expect(xml).toContain(`xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`);
      // Strict XSD order: <image:loc> before <image:caption> before <image:title>
      const locIdx = xml.indexOf("<image:loc>");
      const captionIdx = xml.indexOf("<image:caption>");
      const titleIdx = xml.indexOf("<image:title>");
      expect(locIdx).toBeGreaterThan(-1);
      expect(captionIdx).toBeGreaterThan(locIdx);
      expect(titleIdx).toBeGreaterThan(captionIdx);
    });

    it("matches excluded URLs by exact path, suffix, or wildcard", () => {
      expect(isUrlExcluded("https://kraviona.site/blog/secret-draft", ["/blog/secret-*"])).toBe(
        true
      );
      expect(isUrlExcluded("https://kraviona.site/private-page", ["/private-page"])).toBe(
        true
      );
      expect(isUrlExcluded("https://kraviona.site/blog/public", ["/private-page"])).toBe(
        false
      );
    });
  });
});
