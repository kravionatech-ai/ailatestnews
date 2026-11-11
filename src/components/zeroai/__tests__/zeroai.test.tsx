import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/zeroai",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ZeroAiDetectorStudio } from "../zeroai-detector-studio";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { POST as analyzePost } from "@/app/api/zeroai/analyze/route";

describe("ZeroAI Detector Feature, Menu Integration & Route Handler", () => {
  it("Header navigation renders ZeroAI link pointing to /zeroai by default", () => {
    const html = renderToStaticMarkup(<Header />);
    expect(html).toContain("ZeroAI");
    expect(html).toContain('href="/zeroai"');
  });

  it("Header automatically merges ZeroAI even if custom navLinks omit it", () => {
    const legacyLinks = [
      { label: "Home", href: "/", order: 1 },
      { label: "AI News", href: "/category/ai-news", order: 2 },
      { label: "AI Models", href: "/category/model-launches", order: 3 },
      { label: "AI Research", href: "/category/ai-research", order: 4 },
      { label: "AI Tools", href: "/category/ai-tools", order: 5 },
      { label: "Startups", href: "/category/startups", order: 6 },
      { label: "Cybersecurity", href: "/category/cybersecurity", order: 7 },
    ];
    const html = renderToStaticMarkup(<Header navLinks={legacyLinks} />);
    expect(html).toContain("ZeroAI");
    expect(html).toContain('href="/zeroai"');
  });

  it("Footer renders ZeroAI Detector link", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain("ZeroAI Detector");
    expect(html).toContain('href="/zeroai"');
  });

  it("ZeroAiDetectorStudio renders clean initial workbench markup", () => {
    const html = renderToStaticMarkup(<ZeroAiDetectorStudio />);
    expect(html).toContain("Analyze with ZeroAI");
    expect(html).toContain("AI-Generated Essay");
    expect(html).toContain("Human Journalism");
    expect(html).toContain("Ready for Stylometric Scan");
  });

  it("POST /api/zeroai/analyze returns 400 on short or invalid inputs", async () => {
    const shortReq = new NextRequest("http://localhost:3000/api/zeroai/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Too short" }),
    });
    const shortRes = await analyzePost(shortReq);
    expect(shortRes.status).toBe(400);
    const shortJson = await shortRes.json();
    expect(shortJson.success).toBe(false);

    const invalidReq = new NextRequest("http://localhost:3000/api/zeroai/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad json",
    });
    const invalidRes = await analyzePost(invalidReq);
    expect(invalidRes.status).toBe(400);
  });

  it("POST /api/zeroai/analyze analyzes text and returns full clean-room scorecard", async () => {
    const aiText =
      "Moreover, in today's digital age, artificial intelligence is poised to reshape enterprise software. Furthermore, organizations are navigating the complexities of automated workflows while fostering innovation. In conclusion, seamless integration underscores the importance of governance.";
    const req = new NextRequest("http://localhost:3000/api/zeroai/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: aiText }),
    });
    const res = await analyzePost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.result.aiProbability).toBeGreaterThanOrEqual(55);
    expect(data.result.flaggedPatterns.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(data.result.sentences)).toBe(true);
  });
});
