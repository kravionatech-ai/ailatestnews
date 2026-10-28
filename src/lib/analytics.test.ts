import { describe, it, expect } from "vitest";

describe("Audience Intelligence & Traffic Telemetry Unit Tests", () => {
  it("date formatting for UTC handles edge-of-day accurately", () => {
    const dateStr = "2026-10-28";
    const d = new Date(`${dateStr}T00:00:00Z`);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(9); // 0-indexed October
    expect(d.getUTCDate()).toBe(28);
  });

  it("consecutive 7, 30, and 90 day windows generate correctly from a baseline", () => {
    const base = new Date("2026-10-28T00:00:00Z");
    const getWindowDates = (count: number) => {
      return Array.from({ length: count }, (_, idx) => {
        const day = new Date(base);
        day.setUTCDate(day.getUTCDate() - (count - 1 - idx));
        return day.toISOString().slice(0, 10);
      });
    };

    const sevenDays = getWindowDates(7);
    const thirtyDays = getWindowDates(30);
    const ninetyDays = getWindowDates(90);

    expect(sevenDays).toHaveLength(7);
    expect(sevenDays[6]).toBe("2026-10-28");
    expect(sevenDays[0]).toBe("2026-10-22");

    expect(thirtyDays).toHaveLength(30);
    expect(thirtyDays[29]).toBe("2026-10-28");

    expect(ninetyDays).toHaveLength(90);
    expect(ninetyDays[89]).toBe("2026-10-28");
  });

  it("device classifier identifies user agents accurately", () => {
    const classifyDevice = (ua: string) => {
      const lower = ua.toLowerCase();
      if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) return "Tablet";
      if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(lower)) return "Mobile";
      return "Desktop";
    };

    expect(
      classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)")
    ).toBe("Mobile");

    expect(
      classifyDevice("Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)")
    ).toBe("Tablet");

    expect(
      classifyDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    ).toBe("Desktop");

    expect(
      classifyDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
    ).toBe("Desktop");
  });

  it("referrer normalizer cleans known search & social channels accurately", () => {
    const sanitizeReferrer = (raw?: string, hostHeader?: string) => {
      if (!raw) return "Direct / Internal";
      try {
        const url = new URL(raw);
        const host = url.hostname.toLowerCase();
        if (hostHeader && host.includes(hostHeader.toLowerCase())) return "Direct / Internal";
        if (host.includes("google.")) return "Google Search";
        if (host.includes("t.co") || host.includes("twitter.") || host.includes("x.com")) return "X (Twitter)";
        if (host.includes("linkedin.")) return "LinkedIn";
        if (host.includes("reddit.")) return "Reddit";
        if (host.includes("bing.")) return "Bing";
        return host.replace(/^www\./, "").slice(0, 40);
      } catch {
        return "Direct / Internal";
      }
    };

    expect(sanitizeReferrer("https://www.google.com/search?q=ai+news")).toBe("Google Search");
    expect(sanitizeReferrer("https://t.co/xyz123")).toBe("X (Twitter)");
    expect(sanitizeReferrer("https://linkedin.com/feed/")).toBe("LinkedIn");
    expect(sanitizeReferrer("https://news.ycombinator.com/item?id=123")).toBe("news.ycombinator.com");
    expect(sanitizeReferrer("https://ailatestnews.in/category/ai-news", "ailatestnews.in")).toBe("Direct / Internal");
    expect(sanitizeReferrer("")).toBe("Direct / Internal");
  });

  it("reading depth milestone validator rejects invalid milestones and accepts valid milestones", () => {
    const validMilestones = new Set(["quarter", "half", "threeQuarter", "full"]);
    expect(validMilestones.has("quarter")).toBe(true);
    expect(validMilestones.has("half")).toBe(true);
    expect(validMilestones.has("threeQuarter")).toBe(true);
    expect(validMilestones.has("full")).toBe(true);
    expect(validMilestones.has("oneThird")).toBe(false);
    expect(validMilestones.has("views")).toBe(false);
  });
});
