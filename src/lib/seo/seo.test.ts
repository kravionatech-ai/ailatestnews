import { describe, it, expect } from "vitest";
import { interpolateVariables, buildJsonLd } from "./fallback";
import {
  estimateTitlePixelWidth,
  estimateDescriptionPixelWidth,
  analyzeSeoContent,
} from "./analyzer";

describe("SEO Engine - Interpolation & Fallback", () => {
  it("interpolates template variables correctly", () => {
    const template = "{title} {separator} {site} ({year})";
    const result = interpolateVariables(template, {
      title: "DeepSeek R1 Breakdown",
      site: "AI Latest News",
      separator: "|",
      year: 2026,
    });
    expect(result).toBe("DeepSeek R1 Breakdown | AI Latest News (2026)");
  });

  it("handles category and author variables", () => {
    const template = "{category}: Written by {author} on {site}";
    const result = interpolateVariables(template, {
      category: "Model Launches",
      author: "Aarav Sharma",
      site: "AI Latest News",
    });
    expect(result).toBe("Model Launches: Written by Aarav Sharma on AI Latest News");
  });

  it("cleans trailing separators and redundant whitespace", () => {
    const template = "{title} | {site} | ";
    const result = interpolateVariables(template, {
      title: "Clean Headline",
      site: "AI Latest News",
    });
    expect(result).toBe("Clean Headline | AI Latest News");
  });
});

describe("SEO Engine - SERP Pixel Width Estimators", () => {
  it("calculates title pixel width within Google 580px bounds", () => {
    const shortTitle = "AI News";
    const normalTitle = "Sarvam-1 Launch: India's 2B Indic Language Model Breakdown";
    expect(estimateTitlePixelWidth(shortTitle)).toBeLessThan(100);
    expect(estimateTitlePixelWidth(normalTitle)).toBeGreaterThan(300);
    expect(estimateTitlePixelWidth(normalTitle)).toBeLessThan(600);
  });

  it("calculates description pixel width within Google 960px bounds", () => {
    const desc = "A comprehensive analysis of sovereign AI computing in India.";
    const width = estimateDescriptionPixelWidth(desc);
    expect(width).toBeGreaterThan(200);
    expect(width).toBeLessThan(960);
  });
});

describe("SEO Engine - Real-time Content Analysis", () => {
  it("scores high when all SEO factors pass", () => {
    const analysis = analyzeSeoContent({
      title: "Sarvam AI Unveils Sarvam-1 in India",
      slug: "sarvam-ai-unveils-sarvam-1-india",
      metaTitle: "Sarvam AI Unveils Sarvam-1 in India | 2026 Model Guide",
      metaDescription:
        "Sarvam AI unveils Sarvam-1, an ultra-efficient 2B foundational model for Indian languages. Complete benchmark breakdown and token savings.",
      focusKeyword: "Sarvam AI",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      contentHtml: `
        <h2>Understanding Sarvam AI in India</h2>
        <p>Sarvam AI has officially released their sovereign model for Indian developers.</p>
        <h2>Benchmarking Performance</h2>
        <p>${"word ".repeat(300)}</p>
        <p><img src="/test.jpg" alt="Sarvam AI benchmark chart" /></p>
        <a href="/category/india-ai">India AI</a>
        <a href="/blog/krutrim">Krutrim</a>
        <a href="https://huggingface.co">HuggingFace Docs</a>
        <p>${"word ".repeat(350)}</p>
      `,
    });

    expect(analysis.score).toBeGreaterThanOrEqual(80);
    expect(analysis.grade).toBe("excellent");
  });

  it("flags missing keyword and missing alt tags", () => {
    const analysis = analyzeSeoContent({
      title: "Random Tech Post",
      slug: "random-tech-post",
      metaTitle: "Random Tech Post",
      metaDescription: "Short",
      focusKeyword: "Quantum Supercomputing",
      contentHtml: "<p>No mentions here.</p><img src='/test.jpg' />",
    });

    expect(analysis.score).toBeLessThan(50);
    const kwTitleRule = analysis.checklist.find((c) => c.id === "keyword_title");
    expect(kwTitleRule?.status).toBe("fail");

    const imgAltRule = analysis.checklist.find((c) => c.id === "image_alt");
    expect(imgAltRule?.status).toBe("fail");
  });
});

describe("SEO Engine - Schema.org JSON-LD Generation", () => {
  it("generates NewsArticle JSON-LD for post entity", () => {
    const schema = buildJsonLd("post", {
      title: "IndiaAI Mission Tender Finalized",
      slug: "india-ai-mission-tender",
      excerpt: "Government awards sovereign compute tenders.",
      publishedAt: new Date("2026-10-27"),
      author: { name: "Editorial Team", slug: "editorial-team" },
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("NewsArticle");
    expect(schema["headline"]).toBe("IndiaAI Mission Tender Finalized");
  });

  it("supports full schema overrides when JSON provided", () => {
    const customOverride = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Custom Overridden Schema",
    });

    const schema = buildJsonLd(
      "post",
      { title: "Original" },
      { schemaOverrides: customOverride }
    );

    expect(schema["@type"]).toBe("TechArticle");
    expect(schema["headline"]).toBe("Custom Overridden Schema");
  });
});
