import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db/connection";
import { Post, ViewStat, AnalyticsSession } from "@/lib/db/models";

// Input schema for tracking payloads
const trackEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("view"),
    postId: z.string().min(1).max(200),
    slug: z.string().max(200).optional(),
    referrer: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal("reading-depth"),
    postId: z.string().min(1).max(200),
    slug: z.string().max(200).optional(),
    depth: z.enum(["quarter", "half", "threeQuarter", "full"]),
  }),
]);

// Helper: Sanitize & normalize referrer to clean channel names
function sanitizeReferrer(rawReferrer?: string, hostHeader?: string | null): string {
  if (!rawReferrer || typeof rawReferrer !== "string") {
    return "Direct / Internal";
  }

  try {
    const url = new URL(rawReferrer);
    const host = url.hostname.toLowerCase();

    // Check if referrer is internal
    if (hostHeader && host.includes(hostHeader.toLowerCase())) {
      return "Direct / Internal";
    }

    if (host.includes("google.")) return "Google Search";
    if (host.includes("t.co") || host.includes("twitter.") || host.includes("x.com")) return "X (Twitter)";
    if (host.includes("linkedin.")) return "LinkedIn";
    if (host.includes("facebook.")) return "Facebook";
    if (host.includes("reddit.")) return "Reddit";
    if (host.includes("bing.")) return "Bing";
    if (host.includes("duckduckgo.")) return "DuckDuckGo";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("whatsapp.")) return "WhatsApp";
    if (host.includes("news.ycombinator.com")) return "Hacker News";

    // Clean standard domain (e.g. techcrunch.com)
    return host.replace(/^www\./, "").slice(0, 40);
  } catch {
    return "Direct / Internal";
  }
}

// Helper: Classify device from User-Agent
function classifyDevice(userAgent: string): "Desktop" | "Mobile" | "Tablet" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

// Helper: Extract Country Code from Edge/Proxy Headers (Privacy-safe: no IP stored)
function extractCountry(req: NextRequest): string {
  const country =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    req.headers.get("cloudfront-viewer-country");

  if (country && country.length === 2 && country !== "XX") {
    return country.toUpperCase();
  }
  return "Unknown / Local";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = trackEventSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tracking payload" }, { status: 400 });
    }

    const event = parsed.data;
    await connectDB();

    // Resolve target post by ObjectId or slug
    let post = null;
    if (/^[a-f\d]{24}$/i.test(event.postId)) {
      post = await Post.findById(event.postId).select("_id slug status").lean();
    }
    if (!post && (event.slug || event.postId)) {
      post = await Post.findOne({ slug: event.slug || event.postId }).select("_id slug status").lean();
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only count analytics for published articles
    if (post.status !== "published") {
      return NextResponse.json({ success: true, ignored: "non-published" });
    }

    // Normalized Day-level granularity: Midnight UTC
    const dateUtc = new Date();
    dateUtc.setUTCHours(0, 0, 0, 0);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Reading Depth Event Handling
    // ─────────────────────────────────────────────────────────────────────────
    if (event.type === "reading-depth") {
      const field = `readingDepth.${event.depth}`;
      await ViewStat.findOneAndUpdate(
        { post: post._id, date: dateUtc },
        { $inc: { [field]: 1 } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true, event: "reading-depth" });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Page View Event Handling (Privacy-safe & Deduplicated)
    // ─────────────────────────────────────────────────────────────────────────
    const userAgent = req.headers.get("user-agent") || "";
    // Filter out aggressive bot crawlers
    if (/bot|crawler|spider|crawling|lighthouse|headlesschrome/i.test(userAgent)) {
      return NextResponse.json({ success: true, ignored: "bot" });
    }

    const hostHeader = req.headers.get("host");
    const rawIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // One-way salted hash: Never store the raw IP
    const salt = process.env.AUTH_SECRET || "ai-news-telemetry-salt";
    const dateKey = dateUtc.toISOString().slice(0, 10);
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${dateKey}:${rawIp}:${userAgent}:${salt}`)
      .digest("hex");

    const device = classifyDevice(userAgent);
    const country = extractCountry(req);
    const referrer = sanitizeReferrer(event.referrer, hostHeader);

    // Deduplication check via temporary session TTL index
    const existingSession = await AnalyticsSession.findOne({
      visitorHash,
      post: post._id,
      date: dateUtc,
    });

    const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes anti-refresh cooldown
    const now = new Date();

    let isNewUniqueToday = false;
    let shouldCountView = false;

    if (!existingSession) {
      // First visit today for this article
      isNewUniqueToday = true;
      shouldCountView = true;
      await AnalyticsSession.create({
        visitorHash,
        post: post._id,
        date: dateUtc,
        lastSeen: now,
      }).catch(() => {
        // Handled if race condition hits unique index
      });
    } else {
      // Repeat visit today: check cooldown
      const elapsed = now.getTime() - new Date(existingSession.lastSeen).getTime();
      if (elapsed >= COOLDOWN_MS) {
        shouldCountView = true;
        await AnalyticsSession.updateOne(
          { _id: existingSession._id },
          { $set: { lastSeen: now } }
        );
      }
    }

    if (shouldCountView) {
      // Increment lifetime post views
      await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });

      // Build atomic Map increments for ViewStat
      const incFields: Record<string, number> = {
        views: 1,
        [`referrers.${referrer}`]: 1,
        [`devices.${device}`]: 1,
      };

      if (country && country !== "Unknown / Local") {
        incFields[`countries.${country}`] = 1;
      }

      if (isNewUniqueToday) {
        incFields.uniqueVisitors = 1;
      }

      await ViewStat.findOneAndUpdate(
        { post: post._id, date: dateUtc },
        { $inc: incFields },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      recorded: shouldCountView,
      isUnique: isNewUniqueToday,
    });
  } catch (error) {
    console.error("[Analytics Track Error]", error);
    return NextResponse.json({ error: "Internal analytics error" }, { status: 500 });
  }
}
