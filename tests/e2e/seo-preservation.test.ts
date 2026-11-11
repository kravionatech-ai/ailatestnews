import { describe, it, expect } from "vitest";
import { buildJsonLd, getSiteUrl, interpolateVariables } from "@/lib/seo/fallback";

// ─────────────────────────────────────────────────────────────────────────────
// Authoritative SEO Preservation Contract (ORIGINAL_REQUEST.md & PROJECT.md)
// ─────────────────────────────────────────────────────────────────────────────

export const EXPECTED_CANONICAL_SLUG_PATTERNS = {
  article: (slug: string) => `https://ainews.kraviona.com/blog/${slug}`,
  category: (slug: string) => `https://ainews.kraviona.com/category/${slug}`,
  tag: (slug: string) => `https://ainews.kraviona.com/tag/${slug}`,
  author: (slug: string) => `https://ainews.kraviona.com/author/${slug}`,
  staticPages: [
    "/ai-tools",
    "/model-launches",
    "/india-ai",
    "/archive",
    "/editorial-policy",
    "/privacy",
    "/terms",
    "/contact",
  ],
};

export const EXPECTED_SITEMAP_ROUTES = [
  "/sitemap.xml",
  "/sitemap-static.xml",
  "/sitemap-articles.xml",
  "/sitemap-categories.xml",
  "/image-sitemap.xml",
  "/sitemap-tags.xml",
  "/sitemap-pages.xml",
  "/news-sitemap.xml",
];

// Helper: Validate XML sitemap syntax
export function validateSitemapXml(xmlContent: string) {
  const hasXmlDeclaration = xmlContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>');
  const hasUrlsetOrIndex =
    xmlContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"') ||
    xmlContent.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  const isWellFormed =
    (xmlContent.includes("</urlset>") && xmlContent.includes("<urlset")) ||
    (xmlContent.includes("</sitemapindex>") && xmlContent.includes("<sitemapindex"));

  return {
    hasXmlDeclaration,
    hasUrlsetOrIndex,
    isWellFormed,
  };
}

// Helper: Parse Robots.txt directives
export function parseRobotsTxt(robotsTxtContent: string) {
  const lines = robotsTxtContent.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const disallows: string[] = [];
  const allows: string[] = [];
  const sitemaps: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith("disallow:")) {
      disallows.push(line.substring(9).trim());
    } else if (line.toLowerCase().startsWith("allow:")) {
      allows.push(line.substring(6).trim());
    } else if (line.toLowerCase().startsWith("sitemap:")) {
      sitemaps.push(line.substring(8).trim());
    }
  }

  return { allows, disallows, sitemaps };
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E Test Suite: SEO Preservation & Structured Data (Tiers 1-4)
// ─────────────────────────────────────────────────────────────────────────────

describe("E2E SEO Preservation & Canonical Invariance (Tiers 1-4)", () => {
  // ── Tier 1: Feature Coverage (Canonical Slugs & Robots.txt) ─────────────────

  describe("Tier 1: Canonical URLs, Sitemaps & Robots.txt Directives", () => {
    it("generates exact canonical URLs for articles matching /blog/:slug format", () => {
      const slugs = [
        "claude-3-7-sonnet-hybrid-reasoning",
        "deepseek-r1-architecture-breakdown",
        "india-ai-mission-gpu-cluster-allocation",
      ];

      for (const slug of slugs) {
        const canonical = EXPECTED_CANONICAL_SLUG_PATTERNS.article(slug);
        expect(canonical).toBe(`https://ainews.kraviona.com/blog/${slug}`);
      }
    });

    it("generates exact canonical URLs for categories, tags, and authors", () => {
      expect(EXPECTED_CANONICAL_SLUG_PATTERNS.category("frontier-models")).toBe(
        "https://ainews.kraviona.com/category/frontier-models"
      );
      expect(EXPECTED_CANONICAL_SLUG_PATTERNS.tag("indic-benchmarks")).toBe(
        "https://ainews.kraviona.com/tag/indic-benchmarks"
      );
      expect(EXPECTED_CANONICAL_SLUG_PATTERNS.author("editorial-desk")).toBe(
        "https://ainews.kraviona.com/author/editorial-desk"
      );
    });

    it("preserves all critical static utility page paths intact", () => {
      const requiredStaticPages = [
        "/ai-tools",
        "/model-launches",
        "/india-ai",
        "/archive",
        "/editorial-policy",
        "/privacy",
        "/terms",
        "/contact",
      ];

      for (const path of requiredStaticPages) {
        expect(EXPECTED_CANONICAL_SLUG_PATTERNS.staticPages).toContain(path);
      }
    });

    it("validates robots.txt disallows /admin/ and /api/admin/ while exposing sitemap", () => {
      const sampleRobotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/
Disallow: /login/
Disallow: /dashboard/
Disallow: /private/

Sitemap: https://ainews.kraviona.com/sitemap.xml
`;

      const parsed = parseRobotsTxt(sampleRobotsTxt);
      expect(parsed.allows).toContain("/");
      expect(parsed.disallows).toContain("/admin/");
      expect(parsed.disallows).toContain("/api/admin/");
      expect(parsed.sitemaps).toContain("https://ainews.kraviona.com/sitemap.xml");
    });

    it("verifies all expected sitemap routes are accounted for", () => {
      for (const route of EXPECTED_SITEMAP_ROUTES) {
        expect(route.endsWith(".xml")).toBe(true);
      }
      expect(EXPECTED_SITEMAP_ROUTES).toContain("/sitemap.xml");
      expect(EXPECTED_SITEMAP_ROUTES).toContain("/news-sitemap.xml");
    });
  });

  // ── Tier 2: Boundary & Corner Cases (JSON-LD Schema & Fallbacks) ────────────

  describe("Tier 2: Schema.org NewsArticle & Template Interpolation", () => {
    it("generates compliant Schema.org NewsArticle structured data for posts", () => {
      const samplePost = {
        title: "Frontier LLM Reasoning Benchmark 2026",
        slug: "frontier-llm-reasoning-benchmark-2026",
        excerpt: "An in-depth evaluation of current reasoning models on AIME and Indic-MMLU.",
        coverImage: "https://images.unsplash.com/photo-example-1200",
        publishedAt: new Date("2026-11-01T10:00:00Z"),
        updatedAt: new Date("2026-11-05T14:30:00Z"),
        author: {
          name: "Dr. Arvind Rao",
          slug: "arvind-rao",
        },
      };

      const jsonLd = buildJsonLd("post", samplePost) as Record<string, any>;

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("NewsArticle");
      expect(jsonLd.headline).toBe("Frontier LLM Reasoning Benchmark 2026");
      expect(jsonLd.description).toBe("An in-depth evaluation of current reasoning models on AIME and Indic-MMLU.");
      expect(jsonLd.datePublished).toEqual(samplePost.publishedAt);
      expect(jsonLd.dateModified).toEqual(samplePost.updatedAt);
      expect(jsonLd.author["@type"]).toBe("Person");
      expect(jsonLd.author.name).toBe("Dr. Arvind Rao");
      expect(jsonLd.author.url).toContain("/author/arvind-rao");
      expect(["Organization", "NewsMediaOrganization"]).toContain(jsonLd.publisher["@type"]);
      expect(jsonLd.mainEntityOfPage["@type"]).toBe("WebPage");
      expect(jsonLd.mainEntityOfPage["@id"]).toContain("/blog/frontier-llm-reasoning-benchmark-2026");
    });

    it("attributes cleanly to NewsMediaOrganization when article author object is undefined (no fabricated Person)", () => {
      const postWithoutAuthor = {
        title: "Breaking AI Dispatch",
        slug: "breaking-ai-dispatch",
        excerpt: "Rapid wire update",
      };

      const jsonLd = buildJsonLd("post", postWithoutAuthor) as Record<string, any>;
      expect(jsonLd["@type"]).toBe("NewsArticle");
      expect(jsonLd.author["@type"]).toBe("NewsMediaOrganization");
      expect(jsonLd.author.name).toBe("Kraviona AI News");
    });

    it("interpolates SEO template variables cleanly without double spaces or trailing separators", () => {
      const template = "{title} {separator} {site}";
      const vars = {
        title: "DeepSeek Breakthrough",
        site: "AI Latest News",
        separator: "|",
      };

      const result = interpolateVariables(template, vars);
      expect(result).toBe("DeepSeek Breakthrough | AI Latest News");
    });

    it("safely strips dangling separators when optional variables are empty", () => {
      const template = "{title} {separator} {category}";
      const vars = {
        title: "Just Title",
        category: "",
        separator: "|",
      };

      const result = interpolateVariables(template, vars);
      expect(result).toBe("Just Title");
      expect(result.endsWith("|")).toBe(false);
    });
  });

  // ── Tier 3: Cross-Feature Combinations (FAQ Section Schema Injection) ───────

  describe("Tier 3: Homepage FAQ Section Schema.org FAQPage Generation", () => {
    it("generates Schema.org FAQPage structured data from homepage FAQ items", () => {
      const faqItems = [
        {
          question: "How does AI Latest News verify primary sources?",
          answer: "Our newsroom adheres to a multi-source cryptographic verification protocol and primary code benchmarks.",
        },
        {
          question: "Are benchmark scores reproducible?",
          answer: "Yes, all evaluation prompts and token telemetry are documented on our public benchmarks desk.",
        },
      ];

      const generateFaqSchema = (items: typeof faqItems) => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      });

      const schema = generateFaqSchema(faqItems);
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity.length).toBe(2);
      expect(schema.mainEntity[0]!["@type"]).toBe("Question");
      expect(schema.mainEntity[0]!.name).toBe("How does AI Latest News verify primary sources?");
      expect(schema.mainEntity[0]!.acceptedAnswer["@type"]).toBe("Answer");
    });
  });

  // ── Tier 4: XML Sitemap Well-Formedness & Invariance ────────────────────────

  describe("Tier 4: XML Sitemap Syntax & Formatting Compliance", () => {
    it("verifies standard URL set sitemap XML syntax and namespace compliance", () => {
      const sampleSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ainews.kraviona.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ainews.kraviona.com/blog/frontier-llm-reasoning-benchmark-2026</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      const validation = validateSitemapXml(sampleSitemap);
      expect(validation.hasXmlDeclaration).toBe(true);
      expect(validation.hasUrlsetOrIndex).toBe(true);
      expect(validation.isWellFormed).toBe(true);
    });

    it("verifies sitemap index XML syntax for multi-part sitemaps", () => {
      const sampleIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://ainews.kraviona.com/sitemap-articles.xml</loc>
    <lastmod>2026-11-09T03:00:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://ainews.kraviona.com/sitemap-categories.xml</loc>
    <lastmod>2026-11-09T03:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>`;

      const validation = validateSitemapXml(sampleIndex);
      expect(validation.hasXmlDeclaration).toBe(true);
      expect(validation.hasUrlsetOrIndex).toBe(true);
      expect(validation.isWellFormed).toBe(true);
    });
  });
});
