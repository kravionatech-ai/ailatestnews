import { describe, it, expect } from "vitest";
import {
  slugify,
  calculateReadingTime,
  stripHtml,
  truncate,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "./utils";

describe("Utility functions", () => {
  it("slugify generates clean URL safe slugs", () => {
    expect(slugify("Hello World & Modern Systems!")).toBe("hello-world-modern-systems");
    expect(slugify("  Next.js 15: Deep Dive... ")).toBe("nextjs-15-deep-dive");
    expect(slugify("special#@$*&chars")).toBe("specialchars");
  });

  it("calculateReadingTime estimates words per minute correctly", () => {
    const shortText = "Word ".repeat(100);
    expect(calculateReadingTime(shortText)).toBe(1);

    const longText = "Word ".repeat(600);
    expect(calculateReadingTime(longText)).toBe(3);
  });

  it("stripHtml removes all HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
    expect(stripHtml("Plain text")).toBe("Plain text");
  });

  it("truncate cuts strings with ellipsis", () => {
    expect(truncate("Short text", 20)).toBe("Short text");
    expect(truncate("This is a much longer sentence that should be cut off", 14)).toBe(
      "This is a much…"
    );
  });

  it("formatNumber formats compact integers", () => {
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(2000000)).toBe("2M");
  });

  it("formatDate produces formatted date string", () => {
    const formatted = formatDate(new Date("2026-10-27T00:00:00Z"));
    expect(formatted).toContain("2026");
    expect(formatted).toContain("October");
  });

  it("formatRelativeTime produces relative labels", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });
});
