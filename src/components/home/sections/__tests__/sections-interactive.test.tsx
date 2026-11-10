import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/actions/newsletter", () => ({
  subscribeNewsletterAction: vi.fn().mockResolvedValue({
    success: true,
    message: "Thank you for subscribing to the Daily Dispatch.",
  }),
}));

import {
  BenchmarkLeaderboardSection,
  ModelCalculatorSection,
  AiToolsSection,
  NewsletterSection,
  SiteIntroSection,
  FaqSection,
  CommunityPollSection,
} from "../index";

describe("Milestone 3: 7 Interactive AI Desks, Calculators & Community Sections", () => {
  it("BenchmarkLeaderboardSection renders independent evaluations and metric labels", () => {
    const html = renderToStaticMarkup(
      <BenchmarkLeaderboardSection
        title="Custom Benchmark Arena"
        kicker="Verified Testing"
      />
    );

    expect(html).toContain("Custom Benchmark Arena");
    expect(html).toContain("Verified Testing");
    expect(html).toContain("DeepSeek-R1");
  });

  it("ModelCalculatorSection renders 6 models and token calculator bounds", () => {
    const html = renderToStaticMarkup(
      <ModelCalculatorSection title="Custom Token Cost Calculator" />
    );

    expect(html).toContain("Custom Token Cost Calculator");
    expect(html).toContain("DeepSeek-V3 / R1");
    expect(html).toContain("Claude 3.5 Sonnet");
    expect(html).toContain("GPT-4o Frontier");
    expect(html).toContain("Sarvam-1 (2B Indic Optimized)");
    expect(html).toContain("Gemini 1.5 Pro (2M Context)");
    expect(html).toContain("Llama 3.3 70B Instruct");
    expect(html).toContain("Daily Requests");
  });

  it("AiToolsSection renders evaluated tools directory with tags and links", () => {
    const html = renderToStaticMarkup(
      <AiToolsSection
        tools={[
          {
            id: "tool-test",
            name: "Test Runner Tool",
            tagline: "Test local runner description",
            category: "runners",
            pricing: "Free",
            rating: "5.0/5",
            url: "https://example.com",
            tags: ["Local", "GPU"],
          },
        ]}
      />
    );

    expect(html).toContain("Test Runner Tool");
    expect(html).toContain("Test local runner description");
    expect(html).toContain("Evaluate");
  });

  it("NewsletterSection renders subscriber email form and cadence note", () => {
    const html = renderToStaticMarkup(
      <NewsletterSection
        title="Custom Newsletter Dispatch"
        kicker="Morning Wire"
      />
    );

    expect(html).toContain("Custom Newsletter Dispatch");
    expect(html).toContain("Morning Wire");
    expect(html).toContain("Zero promotional spam");
  });

  it("SiteIntroSection renders custom HTML content when provided", () => {
    const customHtml = "<p id=\"custom-charter-test\">Custom Newsroom Editorial Charter Paragraph</p>";
    const html = renderToStaticMarkup(
      <SiteIntroSection contentHtml={customHtml} />
    );

    expect(html).toContain("id=\"custom-charter-test\"");
    expect(html).toContain("Custom Newsroom Editorial Charter Paragraph");
  });

  it("FaqSection renders custom question items and FAQPage Schema", () => {
    const customItems = [
      {
        question: "Custom Question 1 for India?",
        answer: "Custom Answer 1 about sovereign compute.",
      },
    ];

    const html = renderToStaticMarkup(
      <FaqSection items={customItems} title="Custom FAQ Desk" />
    );

    expect(html).toContain("Custom FAQ Desk");
    expect(html).toContain("Custom Question 1 for India?");
    expect(html).toContain("Custom Answer 1 about sovereign compute.");
    expect(html).toContain("\"@type\":\"FAQPage\"");
  });

  it("CommunityPollSection renders custom question and custom options", () => {
    const customOptions = [
      { id: "opt-1", label: "Option One - Self Host", votes: 500 },
      { id: "opt-2", label: "Option Two - Cloud API", votes: 1000 },
    ];

    const html = renderToStaticMarkup(
      <CommunityPollSection
        question="Custom Engineering Question?"
        options={customOptions}
      />
    );

    expect(html).toContain("Custom Engineering Question?");
    expect(html).toContain("Option One - Self Host");
    expect(html).toContain("Option Two - Cloud API");
    expect(html).toContain("1,500 votes");
  });
});
