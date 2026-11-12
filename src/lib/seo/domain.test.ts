import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  DEFAULT_GA_ID,
  DEFAULT_GOOGLE_SITE_VERIFICATION,
  DEFAULT_GTM_ID,
  DEFAULT_LOCAL_SITE_URL,
  DEFAULT_PRODUCTION_SITE_URL,
  buildCanonicalUrl,
  getGaId,
  getGoogleSiteVerification,
  getGtmId,
  getLegacyHosts,
  getLocalSiteUrl,
  getProductionSiteUrl,
  getRedirectSourceHosts,
  getSiteHostname,
  getSiteUrl,
  isLegacyHost,
  isLocalhostHost,
  isLocalhostUrl,
  normalizeHostname,
  normalizeSiteUrl,
  parseValidSiteUrl,
  replaceLegacyHostText,
  resolveDomainRedirect,
  resolveEffectiveSiteUrl,
  rewriteLegacyHtmlUrls,
  rewriteLegacyOriginUrl,
  rewriteLegacyRobotsTxt,
  validateSiteUrl,
} from "./domain";
import { proxy } from "@/proxy";

describe("Centralized Domain Configuration & Migration Engine", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("URL Validation & Normalization", () => {
    it("strips trailing slashes and normalizes protocol/host", () => {
      expect(normalizeSiteUrl("https://kraviona.site/")).toBe("https://kraviona.site");
      expect(normalizeSiteUrl("https://kraviona.site///")).toBe("https://kraviona.site");
      expect(normalizeSiteUrl("kraviona.site/blog/ignored-path")).toBe("https://kraviona.site");
      expect(normalizeSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
    });

    it("rejects empty, malformed, credential-bearing, or unsafe URL schemes", () => {
      expect(parseValidSiteUrl("")).toBeNull();
      expect(parseValidSiteUrl("javascript:alert(1)")).toBeNull();
      expect(parseValidSiteUrl("data:text/html,<h1>x</h1>")).toBeNull();
      expect(parseValidSiteUrl("file:///etc/passwd")).toBeNull();
      expect(parseValidSiteUrl("https://user:pass@kraviona.site")).toBeNull();
      expect(() => validateSiteUrl("javascript:alert(1)")).toThrow(/Invalid site URL/);
      expect(normalizeSiteUrl("javascript:alert(1)")).toBe(DEFAULT_PRODUCTION_SITE_URL);
    });

    it("normalizes hostnames cleanly across headers, ports, and commas", () => {
      expect(normalizeHostname("ainews.kraviona.com:443")).toBe("ainews.kraviona.com");
      expect(normalizeHostname("kraviona.site., proxy.internal")).toBe("kraviona.site");
      expect(normalizeHostname("https://www.ailatestnews.in/test")).toBe("www.ailatestnews.in");
    });
  });

  describe("Production vs. Localhost Separation", () => {
    it("keeps production SEO domain separated from localhost development origin", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_LOCAL_SITE_URL = "http://localhost:3000";
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL;

      expect(isLocalhostHost("localhost")).toBe(true);
      expect(isLocalhostUrl("http://localhost:3000")).toBe(true);
      expect(isLocalhostUrl("https://www.kraviona.site")).toBe(false);

      expect(getLocalSiteUrl()).toBe(DEFAULT_LOCAL_SITE_URL);
      expect(getProductionSiteUrl()).toBe("https://www.kraviona.site");
      expect(getSiteUrl()).toBe("https://www.kraviona.site");
      expect(getSiteHostname()).toBe("www.kraviona.site");
    });

    it("reads NEXT_PUBLIC_SITE_URL dynamically and aligns with Vercel primary host", () => {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL;

      process.env.NEXT_PUBLIC_SITE_URL = "https://www.kraviona.site/";
      expect(getSiteUrl()).toBe("https://www.kraviona.site");
      expect(getSiteHostname()).toBe("www.kraviona.site");

      process.env.NEXT_PUBLIC_SITE_URL = "https://ailatestnews.in/";
      expect(getSiteUrl()).toBe("https://ailatestnews.in");
      expect(getSiteHostname()).toBe("ailatestnews.in");

      // Stale Vercel env var pointing to retired ainews.kraviona.com is ignored automatically
      process.env.NEXT_PUBLIC_SITE_URL = "https://ainews.kraviona.com";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.kraviona.site";
      expect(getSiteUrl()).toBe("https://www.kraviona.site");

      // Apex vs www alignment when Vercel 308-redirects apex -> www.kraviona.site
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.kraviona.site";
      expect(getSiteUrl()).toBe("https://www.kraviona.site");
    });
  });

  describe("Legacy Host Detection & DB Runtime Rewriting", () => {
    it("overrides stale legacy domains or localhost values stored in DB", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";
      expect(resolveEffectiveSiteUrl("https://ainews.kraviona.com")).toBe("https://kraviona.site");
      expect(resolveEffectiveSiteUrl("http://www.ainews.kraviona.com/")).toBe("https://kraviona.site");
      expect(resolveEffectiveSiteUrl("http://localhost:3000")).toBe("https://kraviona.site");
      expect(resolveEffectiveSiteUrl(undefined)).toBe("https://kraviona.site");
    });

    it("rewrites legacy internal URLs while leaving external asset URLs untouched", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";

      expect(rewriteLegacyOriginUrl("https://ainews.kraviona.com/blog/sample?ref=nav#top")).toBe(
        "https://kraviona.site/blog/sample?ref=nav#top"
      );
      expect(rewriteLegacyOriginUrl("http://www.ainews.kraviona.com/")).toBe(
        "https://kraviona.site"
      );
      expect(
        rewriteLegacyOriginUrl("https://res.cloudinary.com/demo/image/upload/v1/cover.png")
      ).toBe("https://res.cloudinary.com/demo/image/upload/v1/cover.png");
      expect(rewriteLegacyOriginUrl("/blog/relative-post")).toBe("/blog/relative-post");
    });

    it("rewrites legacy internal links embedded in article HTML without altering external links", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";

      const html = `
        <p>Read <a href="https://ainews.kraviona.com/blog/sarvam-ai">our coverage</a>
        or see <a href="https://arxiv.org/abs/2501.00001">ArXiv</a> and
        <a href="http://www.ainews.kraviona.com/category/ai-news?page=2">AI News</a>.</p>
      `;
      const rewritten = rewriteLegacyHtmlUrls(html);

      expect(rewritten).toContain('href="https://kraviona.site/blog/sarvam-ai"');
      expect(rewritten).toContain('href="https://kraviona.site/category/ai-news?page=2"');
      expect(rewritten).toContain('href="https://arxiv.org/abs/2501.00001"');
      expect(rewritten).not.toContain("ainews.kraviona.com");
    });

    it("rewrites display copy and deduplicates robots.txt sitemaps safely", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";
      expect(replaceLegacyHostText("Kraviona AI News (ainews.kraviona.com). All rights reserved.")).toBe(
        "Kraviona AI News (kraviona.site). All rights reserved."
      );

      const rawRobots = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "",
        "Sitemap: https://ainews.kraviona.com/sitemap.xml",
        "Sitemap: https://kraviona.site/sitemap.xml",
        "Sitemap: https://ainews.kraviona.com/news-sitemap.xml",
      ].join("\n");

      const normalized = rewriteLegacyRobotsTxt(rawRobots);
      expect(normalized).not.toContain("ainews.kraviona.com");
      expect(normalized.match(/Sitemap:\s*https:\/\/kraviona\.site\/sitemap\.xml/g)).toHaveLength(1);
      expect(normalized).toContain("Sitemap: https://kraviona.site/news-sitemap.xml");
    });

    it("builds canonical URLs cleanly without double slashes", () => {
      expect(buildCanonicalUrl("/", "https://kraviona.site/")).toBe("https://kraviona.site/");
      expect(buildCanonicalUrl("blog/example", "https://kraviona.site")).toBe(
        "https://kraviona.site/blog/example"
      );
      expect(buildCanonicalUrl("https://ainews.kraviona.com/category/ai-news", "https://kraviona.site")).toBe(
        "https://kraviona.site/category/ai-news"
      );
    });
  });

  describe("Google Search Console Verification & Tag IDs", () => {
    it("exposes provided default verification token and GTM/GA tracking IDs", () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
      delete process.env.NEXT_PUBLIC_GTM_ID;
      delete process.env.NEXT_PUBLIC_GA_ID;

      expect(getGoogleSiteVerification()).toBe(DEFAULT_GOOGLE_SITE_VERIFICATION);
      expect(getGoogleSiteVerification()).toBe("-XV8p9zE9MYruAbDWo-gSDEYRFLrSB200khCkukUysg");
      expect(getGtmId()).toBe(DEFAULT_GTM_ID);
      expect(getGtmId()).toBe("GTM-5Q53H625");
      expect(getGaId()).toBe(DEFAULT_GA_ID);
    });
  });

  describe("Single-Hop 301 Redirect Resolution & Loop Prevention", () => {
    it("stays INACTIVE by default until ENABLE_DOMAIN_REDIRECTS is explicitly true", () => {
      delete process.env.ENABLE_DOMAIN_REDIRECTS;
      expect(
        resolveDomainRedirect({
          requestUrl: "https://ainews.kraviona.com/blog/example",
          hostHeader: "ainews.kraviona.com",
        })
      ).toBeNull();
    });

    it("issues 1-hop 301 redirects preserving exact path and query params when active", () => {
      const scenarios = [
        {
          inUrl: "https://ainews.kraviona.com/",
          host: "ainews.kraviona.com",
          proto: "https",
          expected: "https://kraviona.site/",
        },
        {
          inUrl: "https://ainews.kraviona.com/blog/example?utm_source=x&page=2",
          host: "ainews.kraviona.com",
          proto: "https",
          expected: "https://kraviona.site/blog/example?utm_source=x&page=2",
        },
        {
          inUrl: "http://www.ainews.kraviona.com/category/ai-news",
          host: "www.ainews.kraviona.com",
          proto: "http",
          expected: "https://kraviona.site/category/ai-news",
        },
        {
          inUrl: "https://www.kraviona.site/sitemap.xml",
          host: "www.kraviona.site",
          proto: "https",
          expected: "https://kraviona.site/sitemap.xml",
        },
        {
          inUrl: "http://kraviona.site/feed.xml",
          host: "kraviona.site",
          proto: "http",
          expected: "https://kraviona.site/feed.xml",
        },
      ];

      for (const s of scenarios) {
        const decision = resolveDomainRedirect({
          requestUrl: s.inUrl,
          hostHeader: s.host,
          forwardedProtoHeader: s.proto,
          enabled: true,
          targetSiteUrl: "https://kraviona.site",
          sourceDomainsRaw: "ainews.kraviona.com,www.ainews.kraviona.com",
          legacyDomainsRaw: "ainews.kraviona.com",
        });

        expect(decision, `Failed redirect for ${s.inUrl}`).not.toBeNull();
        expect(decision?.status).toBe(301);
        expect(decision?.destination).toBe(s.expected);
      }
    });

    it("never loops on canonical host and never redirects localhost, *.vercel.app, /_next, /api/health, or /api/auth", () => {
      const noRedirectCases = [
        {
          url: "https://kraviona.site/",
          host: "kraviona.site",
          proto: "https",
        },
        {
          url: "https://kraviona.site/blog/example?ref=ok",
          host: "kraviona.site",
          proto: "https",
        },
        {
          url: "http://localhost:3000/blog/example",
          host: "localhost:3000",
          proto: "http",
        },
        {
          url: "https://kraviona-preview-123.vercel.app/",
          host: "kraviona-preview-123.vercel.app",
          proto: "https",
        },
        {
          url: "https://ainews.kraviona.com/_next/static/chunk.js",
          host: "ainews.kraviona.com",
          proto: "https",
        },
        {
          url: "https://ainews.kraviona.com/api/health",
          host: "ainews.kraviona.com",
          proto: "https",
        },
        {
          url: "https://ainews.kraviona.com/api/auth/callback/google",
          host: "ainews.kraviona.com",
          proto: "https",
        },
      ];

      for (const c of noRedirectCases) {
        const decision = resolveDomainRedirect({
          requestUrl: c.url,
          hostHeader: c.host,
          forwardedProtoHeader: c.proto,
          enabled: true,
          targetSiteUrl: "https://kraviona.site",
          sourceDomainsRaw: "ainews.kraviona.com,www.ainews.kraviona.com",
          legacyDomainsRaw: "ainews.kraviona.com",
        });
        expect(decision, `Unexpected redirect for ${c.url}`).toBeNull();
      }
    });

    it("supports future permanent migration to ailatestnews.in in 1 hop from BOTH legacy domains", () => {
      const target = "https://ailatestnews.in";
      const legacy = "ainews.kraviona.com,kraviona.site";
      const sources = "ainews.kraviona.com,www.ainews.kraviona.com,kraviona.site,www.kraviona.site";

      expect(isLegacyHost("ainews.kraviona.com", target, legacy)).toBe(true);
      expect(isLegacyHost("kraviona.site", target, legacy)).toBe(true);
      expect(isLegacyHost("ailatestnews.in", target, legacy)).toBe(false);
      expect(getLegacyHosts(target, legacy)).not.toContain("ailatestnews.in");
      expect(getRedirectSourceHosts(target, sources, legacy)).toContain("www.ailatestnews.in");

      for (const oldHost of [
        "ainews.kraviona.com",
        "www.ainews.kraviona.com",
        "kraviona.site",
        "www.kraviona.site",
      ]) {
        const decision = resolveDomainRedirect({
          requestUrl: `https://${oldHost}/category/ai-news?page=3`,
          hostHeader: oldHost,
          forwardedProtoHeader: "https",
          enabled: true,
          targetSiteUrl: target,
          sourceDomainsRaw: sources,
          legacyDomainsRaw: legacy,
        });

        expect(decision?.status).toBe(301);
        expect(decision?.destination).toBe("https://ailatestnews.in/category/ai-news?page=3");
      }

      const canonicalNoLoop = resolveDomainRedirect({
        requestUrl: "https://ailatestnews.in/category/ai-news?page=3",
        hostHeader: "ailatestnews.in",
        forwardedProtoHeader: "https",
        enabled: true,
        targetSiteUrl: target,
        sourceDomainsRaw: sources,
        legacyDomainsRaw: legacy,
      });
      expect(canonicalNoLoop).toBeNull();
    });
  });

  describe("Next.js Proxy Integration (src/proxy.ts)", () => {
    it("does NOT redirect ainews.kraviona.com when ENABLE_DOMAIN_REDIRECTS is false", () => {
      process.env.ENABLE_DOMAIN_REDIRECTS = "false";
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";

      const req = new NextRequest("https://ainews.kraviona.com/blog/test", {
        headers: { host: "ainews.kraviona.com" },
      });
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("issues 301 permanent redirect for legacy host across articles and /sitemap.xml when enabled", () => {
      process.env.ENABLE_DOMAIN_REDIRECTS = "true";
      process.env.NEXT_PUBLIC_SITE_URL = "https://kraviona.site";
      process.env.NEXT_PUBLIC_LEGACY_DOMAINS = "ainews.kraviona.com";
      process.env.REDIRECT_SOURCE_DOMAINS = "ainews.kraviona.com,www.ainews.kraviona.com";

      const articleReq = new NextRequest("https://ainews.kraviona.com/blog/example?src=news", {
        headers: { host: "ainews.kraviona.com", "x-forwarded-proto": "https" },
      });
      const articleRes = proxy(articleReq);
      expect(articleRes.status).toBe(301);
      expect(articleRes.headers.get("location")).toBe("https://kraviona.site/blog/example?src=news");

      const sitemapReq = new NextRequest("https://ainews.kraviona.com/sitemap.xml", {
        headers: { host: "ainews.kraviona.com", "x-forwarded-proto": "https" },
      });
      const sitemapRes = proxy(sitemapReq);
      expect(sitemapRes.status).toBe(301);
      expect(sitemapRes.headers.get("location")).toBe("https://kraviona.site/sitemap.xml");

      const canonicalReq = new NextRequest("https://kraviona.site/blog/example?src=news", {
        headers: { host: "kraviona.site", "x-forwarded-proto": "https" },
      });
      const canonicalRes = proxy(canonicalReq);
      expect(canonicalRes.status).toBe(200);
      expect(canonicalRes.headers.get("location")).toBeNull();
    });
  });
});
