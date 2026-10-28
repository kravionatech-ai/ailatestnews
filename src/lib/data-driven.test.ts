import { describe, it, expect } from "vitest";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

describe("Data-driven SEO & Global Metadata Integration", () => {
  const siteUrl = getSiteUrl();

  it("buildEntityMetadata applies custom entity title and canonicalUrl accurately", async () => {
    const meta = await buildEntityMetadata({
      entityType: "page",
      path: "/about",
      title: "About Our AI Mission",
      excerpt: "Independent AI reporting for India.",
      entitySeo: {
        metaTitle: "Custom Meta Title Overridden",
        canonicalUrl: "https://ailatestnews.in/about",
        robots: { index: true, follow: true, maxImagePreview: "large" },
      },
    });

    expect(meta.title).toBe("Custom Meta Title Overridden");
    expect(meta.alternates?.canonical).toBe("https://ailatestnews.in/about");
    expect(meta.robots).toHaveProperty("googleBot");
  });

  it("buildEntityMetadata handles home entity fallback seamlessly", async () => {
    const meta = await buildEntityMetadata({
      entityType: "home",
      path: "/",
      title: "AI Latest News — Breaking AI News, Model Launches & India AI Guides",
      excerpt: "India's premier AI news portal.",
    });

    expect(meta.title).toContain("AI Latest News");
    expect(meta.alternates?.canonical).toBe(`${siteUrl}/`);
  });

  it("buildEntityMetadata handles author entity schema seamlessly", async () => {
    const meta = await buildEntityMetadata({
      entityType: "author",
      path: "/author/sarah-connor",
      author: "Sarah Connor",
      title: "Sarah Connor",
      excerpt: "Senior AI researcher",
      entitySeo: {
        schemaType: "ProfilePage",
      },
    });

    expect(meta.title).toContain("Sarah Connor");
    expect(meta.alternates?.canonical).toBe(`${siteUrl}/author/sarah-connor`);
  });
});
