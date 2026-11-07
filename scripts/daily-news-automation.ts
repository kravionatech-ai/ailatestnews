/**
 * Daily AI News Automation Script
 * ================================
 * Runs every morning at 7:00 AM IST via Antigravity sidecar cron.
 *
 * Pipeline:
 *  1. Fetch top AI headlines from Google News RSS (last 24h)
 *  2. Deduplicate against existing MongoDB posts (avoid re-posting same topic)
 *  3. Generate a unique, humanized, technical editorial article (Gemini API with Pollinations fallback)
 *  4. Generate custom AI cover image (Pollinations AI) & upload directly to Cloudinary CDN
 *  5. Insert the finished post into MongoDB with status = "published"
 *
 * Usage (manual test run):
 *   npm run daily-news:auto
 *   -- or --
 *   npx tsx scripts/daily-news-automation.ts
 */

import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";

// ─── Load .env.local ──────────────────────────────────────────────────────────
(function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const raw = require("fs").readFileSync(envPath, "utf8") as string;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch {
    // env vars already in environment
  }
})();

// ─── Constants ────────────────────────────────────────────────────────────────
const AUTHOR_ID   = "6ae17b6c5f58358aabfa3d3f"; // Site Administrator
const CATEGORY_ID = "6ae17b6c5f58358aabfa3d46"; // AI News

const RSS_FEEDS = [
  "https://news.google.com/rss/search?q=artificial+intelligence+OR+LLM+OR+AI+model+when:24h&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=generative+AI+OR+OpenAI+OR+Gemini+OR+Claude+when:24h&hl=en-IN&gl=IN&ceid=IN:en",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface RssItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageAlt: string;
  tags: string[];
  readingTime: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-|-$/g, "");
}

function calcReadingTime(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Minimal RSS XML parser — extracts <item> blocks using regex */
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

  for (const rawItem of itemMatches) {
    const extract = (tag: string) =>
      rawItem.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "si"))?.[1]?.trim() ?? "";

    const title   = extract("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    const link    = extract("link") || extract("guid");
    const source  = extract("source").replace(/&amp;/g, "&") || "Google News";
    const pubDate = extract("pubDate") || new Date().toUTCString();

    if (title && link) items.push({ title, link, source, pubDate });
  }

  return items;
}

// ─── Step 1: Fetch RSS Headlines ─────────────────────────────────────────────

async function fetchRssItems(): Promise<RssItem[]> {
  const all: RssItem[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      console.log(`📡 Fetching RSS: ${feedUrl}`);
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "AILatestNews/1.0 (+https://ailatestnews.in)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) { console.warn(`⚠️  RSS ${res.status}: ${feedUrl}`); continue; }
      const xml = await res.text();
      const items = parseRssXml(xml).slice(0, 10);
      console.log(`   → Found ${items.length} items`);
      all.push(...items);
    } catch (err) {
      console.error(`❌ RSS error (${feedUrl}):`, (err as Error).message);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return all.filter((i) => {
    const key = i.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Step 2: Deduplicate Against DB ──────────────────────────────────────────

async function pickFreshTopic(candidates: RssItem[]): Promise<RssItem> {
  const { default: Post } = await import("../src/lib/db/models/post.model");

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentPosts = await (Post as any).find({ publishedAt: { $gte: twoDaysAgo } }, { title: 1 }).lean();
  const recentKeys = new Set(recentPosts.map((p: any) => (p.title as string).toLowerCase().slice(0, 50)));

  for (const item of candidates) {
    const key = item.title.toLowerCase().slice(0, 50);
    if (!recentKeys.has(key)) {
      console.log(`✅ Fresh breaking topic selected: "${item.title}"`);
      return item;
    }
    console.log(`⏭️  Skipping existing topic: "${item.title}"`);
  }

  console.warn("⚠️  All candidates have recent coverage — using top breaking item");
  return candidates[0];
}

// ─── Step 3: Generate Article Content (Gemini with Pollinations fallback) ─────

async function generateArticle(topic: RssItem): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are a chief technology editor and investigative AI journalist at "AI Latest News" (ailatestnews.in), India's premier AI news platform.
Your writing style is analytical, authoritative, and engaging. Never robotic, clichéd, or boilerplate.
Avoid phrases like "In this fast-paced world" or "Delve into". Write with precision, citing concrete architectural implications, compute realities, and strategic impacts for Indian software engineers and enterprise leaders.`;

  const userPrompt = `Write a comprehensive, publication-grade editorial news article about this breaking AI story:

HEADLINE IDEA: "${topic.title}"
SOURCE / WIRE: ${topic.source}

Return a valid JSON object ONLY (no markdown code blocks, no backticks, no explanatory text outside the JSON) with this exact schema:

{
  "title": "A captivating, punchy, SEO-optimized title (max 95 chars)",
  "slug": "kebab-case-url-slug-based-on-title",
  "excerpt": "A compelling 1-2 sentence lede that drives high click-through and curiosity (max 180 chars)",
  "contentHtml": "Full article body formatted in semantic HTML using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>. Minimum 750 words. Structure with: 1) Breaking News Overview & Context, 2) Technical Breakdown & Architecture, 3) Real-world Industry Impact, 4) Strategic Implications for Indian Developers & Enterprises, 5) Roadblocks & Future Outlook, 6) The Editorial Verdict. Use analytical depth and authentic journalism.",
  "coverImageAlt": "Clear alt text describing the futuristic tech theme of the article",
  "tags": ["5 to 7 concise topic tags e.g. Generative AI, Cloud Compute, LLMs, Enterprise Tech"],
  "readingTime": 5,
  "seoTitle": "High CTR SEO Title (max 60 chars)",
  "seoDescription": "Engaging meta description (max 155 chars)",
  "seoKeywords": ["8 to 10 relevant search keywords"]
}`;

  // Strategy A: Try official Google Gemini API if key is present
  if (apiKey) {
    try {
      console.log("🤖 Generating article via Gemini API...");
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const data = await res.json() as any;
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim());
          return sanitizeArticle(parsed, topic);
        }
      } else {
        console.warn(`⚠️  Gemini API returned ${res.status}, falling back to secondary engine...`);
      }
    } catch (e) {
      console.warn("⚠️  Gemini API request failed:", (e as Error).message);
    }
  }

  // Strategy B: Resilient Fallback Engine (Keyless Pollinations AI)
  console.log("🌐 Generating article via secondary AI engine...");
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt + "\nOutput strictly valid JSON only." },
        ],
        jsonMode: true,
        model: "mistral",
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (res.ok) {
      const rawText = await res.text();
      const cleaned = rawText.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return sanitizeArticle(parsed, topic);
    }
  } catch (e) {
    console.warn("⚠️  Secondary AI engine failed:", (e as Error).message);
  }

  // Strategy C: High-grade deterministic editorial synthesis builder
  console.log("📰 Using editorial template synthesis...");
  return buildEditorialSynthesis(topic);
}

function sanitizeArticle(raw: any, topic: RssItem): GeneratedArticle {
  const title = (raw.title || topic.title).slice(0, 180);
  const slug = slugify(raw.slug || title);
  const excerpt = (raw.excerpt || `In-depth analysis of ${topic.title} and what it means for modern AI engineering.`).slice(0, 250);
  const contentHtml = raw.contentHtml || `<p>${excerpt}</p>`;
  const readingTime = raw.readingTime || calcReadingTime(contentHtml);

  return {
    title,
    slug,
    excerpt,
    contentHtml,
    coverImageAlt: raw.coverImageAlt || `${title} editorial graphic`,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ["AI News", "Generative AI", "Tech Trends", "Machine Learning"],
    readingTime,
    seoTitle: (raw.seoTitle || title).slice(0, 60),
    seoDescription: (raw.seoDescription || excerpt).slice(0, 155),
    seoKeywords: Array.isArray(raw.seoKeywords) && raw.seoKeywords.length > 0 ? raw.seoKeywords : ["ai news", "artificial intelligence", "tech trends"],
  };
}

function buildEditorialSynthesis(topic: RssItem): GeneratedArticle {
  const title = topic.title.replace(/\s*-\s*[^-]+$/, ""); // Clean source suffix
  const slug = slugify(title);
  const excerpt = `A deep dive into the latest breakthrough: ${title}. We examine the core technical implications, compute footprint, and key enterprise takeaways.`;
  
  const contentHtml = `
    <h2>Breaking Down the Development</h2>
    <p>The artificial intelligence landscape continues its unrelenting acceleration. In the latest market development, <strong>${title}</strong> has sent ripples across research laboratories and enterprise technology teams worldwide.</p>
    <p>Originally reported by <em>${topic.source}</em>, this development underscores the growing transition from experimental generative proofs-of-concept into high-throughput production infrastructure. Organizations navigating foundation model deployment are finding that speed of execution and architectural adaptability are the decisive competitive differentiators.</p>
    
    <h2>Technical Architecture & Compute Dynamics</h2>
    <p>Behind the headlines lies a significant shift in computational strategy. Modern workloads increasingly demand hybrid orchestration models that balance edge reasoning with centralized parameter density. As engineering teams optimize context lengths and token retrieval pipelines, efficiency gains are quickly replacing raw brute-force scale as the primary architectural benchmark.</p>
    <ul>
      <li><strong>Inference Optimization:</strong> Speculative decoding and quantized weight representations are reducing latency overhead across production endpoints.</li>
      <li><strong>Data Pipeline Integrity:</strong> Synthetic data augmentation alongside strict human-in-the-loop curation continues to govern post-training alignment.</li>
      <li><strong>Compute Allocation:</strong> High-bandwidth memory availability remains the crucial bottleneck in sustained enterprise throughput.</li>
    </ul>

    <h2>Strategic Implications for Indian Developers & Enterprises</h2>
    <p>For India's engineering ecosystem, this moment represents both a massive operational opportunity and an imperative to modernize legacy stacks. With the national <em>IndiaAI Mission</em> allocating sovereign compute clusters and MeitY actively formulating indigenous framework guidelines, Indian technology leaders are uniquely positioned to translate foundation capability into localized enterprise value.</p>
    <blockquote>"The developers who master autonomous agent orchestration and rigorous evaluation harnesses today will architect the core enterprise platforms of the next decade."</blockquote>

    <h2>What Lies Ahead</h2>
    <p>As this development matures over coming quarters, expect accelerated integration into continuous delivery pipelines and customer-facing workflows. AI Latest News will continue tracking performance metrics, security disclosures, and real-world deployment outcomes as new benchmarks emerge.</p>
  `.trim();

  return {
    title,
    slug,
    excerpt,
    contentHtml,
    coverImageAlt: `${title} editorial coverage`,
    tags: ["AI News", "Enterprise AI", "Machine Learning", "Tech Trends", "IndiaAI"],
    readingTime: calcReadingTime(contentHtml),
    seoTitle: `${title.slice(0, 50)} | AI Latest News`,
    seoDescription: excerpt.slice(0, 155),
    seoKeywords: ["ai news", "machine learning", "enterprise tech", "generative ai", "tech innovation"],
  };
}

// ─── Step 4: Generate Custom Cover Image & Upload to Cloudinary ───────────────

async function uploadCoverImage(article: GeneratedArticle): Promise<string> {
  const { uploadImageBuffer } = await import("../src/lib/services/cloudinary");

  const promptText = encodeURIComponent(
    `futuristic high tech cyber concept for ${article.title.slice(0, 50)}, neural network, glowing neon circuitry, professional 8k editorial photography, cinematic lighting`
  );

  const candidateUrls = [
    `https://image.pollinations.ai/prompt/${promptText}?width=1200&height=675&nologo=true&seed=${Date.now()}`,
    `https://picsum.photos/1200/675?blur=1`,
  ];

  let imageBuffer: Buffer | null = null;
  let ext = "jpg";

  for (const url of candidateUrls) {
    try {
      console.log(`🖼️  Generating bespoke AI cover visual: ${url.slice(0, 80)}...`);
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        ext = ct.split("/")[1]?.split(";")[0] ?? "jpg";
        imageBuffer = Buffer.from(await res.arrayBuffer());
        console.log(`   → Image acquired (${Math.round(imageBuffer.length / 1024)} KB)`);
        break;
      }
    } catch (e) {
      console.warn(`   ⚠️  Image fetch warning: ${(e as Error).message}`);
    }
  }

  if (imageBuffer && imageBuffer.length > 500) {
    try {
      console.log("☁️  Uploading to Cloudinary CDN...");
      const result = await uploadImageBuffer(imageBuffer, `${article.slug}.${ext}`, "ailatestnews/auto");
      if (result.url) {
        console.log(`   ✅ Cloudinary CDN URL: ${result.url}`);
        return result.url;
      }
    } catch (e) {
      console.warn("⚠️  Cloudinary upload failed, falling back to local public upload:", (e as Error).message);
    }
  }

  // Safe fallback CDN visual
  return "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1600&h=900&fit=crop&auto=format";
}

// ─── Step 5: Ensure Tag Documents Exist in DB ────────────────────────────────

async function ensureTags(tagNames: string[]): Promise<mongoose.Types.ObjectId[]> {
  const { default: Tag } = await import("../src/lib/db/models/tag.model");

  const tagIds: mongoose.Types.ObjectId[] = [];
  for (const name of tagNames.slice(0, 7)) {
    const cleanName = name.trim().slice(0, 50);
    if (!cleanName) continue;
    const slug = slugify(cleanName);
    try {
      let tag = await (Tag as any).findOne({ slug });
      if (!tag) {
        tag = await (Tag as any).create({ name: cleanName, slug, postCount: 0 });
      }
      tagIds.push(tag._id as mongoose.Types.ObjectId);
    } catch (e) {
      // Ignore tag duplicate race
    }
  }
  return tagIds;
}

// ─── Step 6: Save & Publish Post to MongoDB ──────────────────────────────────

async function savePost(
  article: GeneratedArticle,
  coverImage: string,
  tagIds: mongoose.Types.ObjectId[]
): Promise<string> {
  const { default: Post } = await import("../src/lib/db/models/post.model");

  let slug = article.slug || slugify(article.title);

  // Guarantee uniqueness
  const existing = await (Post as any).findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" });

  const post = await (Post as any).create({
    title:              article.title,
    slug,
    content:            {}, // TipTap JSON
    contentHtml:        article.contentHtml,
    excerpt:            article.excerpt,
    coverImage,
    coverImageAlt:      article.coverImageAlt,
    coverImageCaption:  `AI Latest News Editorial — Published on ${dateStr}`,
    author:             new mongoose.Types.ObjectId(AUTHOR_ID),
    category:           new mongoose.Types.ObjectId(CATEGORY_ID),
    tags:               tagIds,
    status:             "published",
    publishedAt:        now,
    readingTime:        article.readingTime,
    featured:           false,
    allowComments:      true,
    locale:             "en",
    seo: {
      metaTitle:         (article.seoTitle || article.title).slice(0, 95),
      metaDescription:   (article.seoDescription || article.excerpt).slice(0, 290),
      focusKeyword:      (article.seoKeywords?.[0] || "AI News").slice(0, 75),
      secondaryKeywords: (article.seoKeywords || []).slice(1, 5).map((k: string) => k.slice(0, 50)),
      ogTitle:           article.title.slice(0, 95),
      ogDescription:     article.excerpt.slice(0, 290),
      ogImage:           coverImage,
      twitterCard:       "summary_large_image",
      schemaType:        "NewsArticle",
      robots: { index: true, follow: true, noarchive: false, nosnippet: false, maxImagePreview: "large" },
      sitemap: { include: true, priority: 0.9, changefreq: "daily" },
    },
  });

  console.log(`📰 Post published successfully! Document ID: ${post._id}`);
  return slug;
}

// ─── Main Execution Pipeline ──────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log("\n========================================================");
  console.log("🚀 Daily AI News Automation — Pipeline Started");
  console.log(`⏰ Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`);
  console.log("========================================================\n");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set in environment or .env.local");

  console.log("🔌 Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15_000, socketTimeoutMS: 45_000 });
  console.log("✅ MongoDB Atlas connected successfully.\n");

  try {
    // 1. Fetch RSS Trends
    const items = await fetchRssItems();
    if (!items.length) throw new Error("No RSS items found from Google News feed.");
    console.log(`\n📋 ${items.length} unique breaking news candidate(s) detected.\n`);

    // 2. Deduplicate
    const topic = await pickFreshTopic(items);

    // 3. Generate Article Content
    const article = await generateArticle(topic);
    console.log(`\n✨ Article Generated: "${article.title}" (~${article.readingTime} min read)`);

    // 4. Generate & Upload Cover Image
    const coverImage = await uploadCoverImage(article);

    // 5. Ensure Tags
    const tagIds = await ensureTags(article.tags);

    // 6. Save & Publish to Database
    const slug = await savePost(article, coverImage, tagIds);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log("\n========================================================");
    console.log(`🎉 Pipeline Succeeded in ${elapsed}s!`);
    console.log(`🔗 Live Article URL: https://ailatestnews.in/blog/${slug}`);
    console.log(`📰 Title: "${article.title}"`);
    console.log(`🖼️  Cover: ${coverImage}`);
    console.log(`🏷️  Tags: ${article.tags.join(", ")}`);
    console.log("========================================================\n");
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected cleanly. Ready for next scheduled run.");
  }
}

main().catch((err) => {
  console.error("\n❌ Daily AI News Automation Failed:", err);
  process.exit(1);
});
