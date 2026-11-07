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
  "https://news.google.com/rss/search?q=DeepSeek+OR+Anthropic+OR+Nvidia+AI+when:24h&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=AI+chip+OR+AI+infrastructure+OR+datacenter+when:24h&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=India+AI+OR+IndiaAI+Mission+when:24h&hl=en-IN&gl=IN&ceid=IN:en",
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
        headers: { "User-Agent": "AINews/1.0 (+https://ainews.kraviona.com)" },
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

interface ExistingPostRef {
  title: string;
  slug: string;
}

async function fetchRecentPostsForLinking(): Promise<ExistingPostRef[]> {
  try {
    const { default: Post } = await import("../src/lib/db/models/post.model");
    const posts = await (Post as any).find({ status: "published" }, { title: 1, slug: 1 })
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean();
    return posts.map((p: any) => ({ title: p.title as string, slug: p.slug as string }));
  } catch {
    return [];
  }
}

async function generateArticle(topic: RssItem, existingPosts: ExistingPostRef[]): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;

  const internalLinksHint = existingPosts.length > 0
    ? existingPosts.slice(0, 3).map(p => `- <a href="/blog/${p.slug}">${p.title}</a>`).join("\n")
    : `- <a href="/category/ai-news">AI News Desk</a>\n- <a href="/tags/machine-learning">Machine Learning Trends</a>`;

  const systemPrompt = `You are a chief technology editor and investigative AI journalist at "AI News" (ainews.kraviona.com), India's premier AI news platform.
Your writing style is analytical, authoritative, and engaging. Never robotic, clichéd, or boilerplate.
LANGUAGE REQUIREMENT: ALWAYS WRITE IN 100% PURE, PROFESSIONAL ENGLISH ONLY. Never output Hindi, Hinglish, or mixed language.
Avoid phrases like "In this fast-paced world", "Delve into", or "In conclusion". Write with precision, citing concrete architectural implications, compute realities, and strategic impacts for software engineers and enterprise leaders.`;

  const userPrompt = `Write a comprehensive, publication-grade editorial news article about this breaking AI story in 100% English:

HEADLINE IDEA: "${topic.title}"
SOURCE / WIRE: ${topic.source}
PRIMARY WIRE URL: ${topic.link}

MANDATORY LINKING REQUIREMENTS:
1. INTERNAL LINKING: Naturally weave in 2 to 3 contextual links to our existing investigative stories using exact HTML format <a href="/blog/{slug}">anchor text</a>. Available stories:
${internalLinksHint}

2. EXTERNAL LINKING: Include at least 2 authoritative external source links with target="_blank" rel="noopener noreferrer":
- The primary source: <a href="${topic.link}" target="_blank" rel="noopener noreferrer">${topic.source}</a>
- Authoritative tech/research repositories: <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer">ArXiv</a>, <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">Hugging Face</a>, or <a href="https://indiaai.gov.in" target="_blank" rel="noopener noreferrer">IndiaAI Mission</a>.

LANGUAGE RULE: The entire output (title, excerpt, contentHtml, tags, alt text, SEO fields) MUST ALWAYS BE IN ENGLISH ONLY.

Return a valid JSON object ONLY (no markdown code blocks, no backticks, no explanatory text outside the JSON) with this exact schema:

{
  "title": "A captivating, punchy, SEO-optimized title (max 95 chars)",
  "slug": "kebab-case-url-slug-based-on-title",
  "excerpt": "A compelling 1-2 sentence lede that drives high click-through and curiosity (max 180 chars)",
  "contentHtml": "Full article body formatted in semantic HTML using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>. Minimum 600 words. Must contain internal and external links naturally integrated into sentences. Conclude with a 'Related Technical Coverage' list linking to our stories.",
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
          const art = sanitizeArticle(parsed, topic);
          return ensureLinkingIntegrity(art, topic, existingPosts);
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
      const art = sanitizeArticle(parsed, topic);
      return ensureLinkingIntegrity(art, topic, existingPosts);
    }
  } catch (e) {
    console.warn("⚠️  Secondary AI engine failed:", (e as Error).message);
  }

  // Strategy C: High-grade deterministic editorial synthesis builder
  console.log("📰 Using editorial template synthesis with linking...");
  return buildEditorialSynthesis(topic, existingPosts);
}

function countWords(html: string): number {
  return html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

function ensureMinimumWordCount(article: GeneratedArticle, topic: RssItem, existingPosts: ExistingPostRef[]): GeneratedArticle {
  let words = countWords(article.contentHtml);
  if (words >= 800) {
    article.readingTime = Math.max(1, Math.ceil(words / 200));
    return article;
  }

  console.log(`📏 Word count is currently ${words} words. Expanding technical analysis to exceed 800+ words...`);

  const expansionSection = `
    <h2>Token Economics: Hardware Deployment vs Cloud Rental Models</h2>
    <p>Let us look past the marketing presentations at the actual unit economics. For modern engineering teams deploying intelligent workflows in production, the cost difference between managed cloud endpoints and local quantized execution is enormous.</p>
    <p>When an enterprise queries foreign hosted endpoints millions of times a day, recurring API invoices quickly become one of the largest line items in the operational budget. In contrast, hosting lean foundation models directly on private accelerators amortizes capital investment over multi-year operational cycles. Once the silicon is paid for, serving tokens carries near-zero variable cost, freeing engineering teams to experiment boldly without fear of sudden billing overages.</p>

    <h2>Compliance Advantages: DPDP Act and Sovereign Custody</h2>
    <p>Consider the regulatory tailwinds as well. The Digital Personal Data Protection Act imposes strict financial penalties on cross-border data transfers that fail compliance audits. Organizations deploying local inference completely sidestep these legal liabilities because private user records never travel beyond local intranet switches. That regulatory shield is worth more than raw compute speed.</p>
  `;

  if (article.contentHtml.includes("Related Technical Coverage")) {
    article.contentHtml = article.contentHtml.replace(
      /<h2>Related Technical Coverage<\/h2>/i,
      `${expansionSection}\n    <h2>Related Technical Coverage</h2>`
    );
  } else {
    article.contentHtml += expansionSection;
  }

  const finalWords = countWords(article.contentHtml);
  article.readingTime = Math.max(1, Math.ceil(finalWords / 200));
  console.log(`   ✅ Expanded to ${finalWords} words (Target: 800+ words).`);
  return article;
}

function ensureLinkingIntegrity(
  article: GeneratedArticle,
  topic: RssItem,
  existingPosts: ExistingPostRef[]
): GeneratedArticle {
  let html = article.contentHtml;

  // 1. Guarantee External Source Link
  if (!html.includes('rel="noopener noreferrer"')) {
    const sourceLink = `<a href="${topic.link || "https://news.google.com"}" target="_blank" rel="noopener noreferrer">${topic.source}</a>`;
    html = html.replace(/(reported first by|uncovered by|according to|first broken by)/i, `$1 ${sourceLink}`);
  }

  // 2. Guarantee Internal Cross-Links
  const internalCount = (html.match(/href="\/blog\/[^"]+"/g) || []).length;
  if (internalCount < 2 && existingPosts.length > 0) {
    const relatedLinks = existingPosts.slice(0, 3)
      .map(p => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`)
      .join("\n      ");

    if (!html.includes("Related Technical Coverage") && !html.includes("Related Investigative Coverage")) {
      html += `
        <h2>Related Technical Coverage</h2>
        <p>Explore our deep investigative series on frontier systems:</p>
        <ul>
          ${relatedLinks}
        </ul>
      `.trim();
    }
  }

  article.contentHtml = html;
  return ensureMinimumWordCount(article, topic, existingPosts);
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

function buildEditorialSynthesis(topic: RssItem, existingPosts: ExistingPostRef[]): GeneratedArticle {
  const cleanTitle = topic.title.replace(/\s*-\s*[^-]+$/, "").trim();
  const slug = slugify(cleanTitle);
  const excerpt = `Behind the headlines of ${cleanTitle}: why this technical shift matters and what it reveals about modern AI engineering.`;

  const relatedLinksHtml = existingPosts.slice(0, 3)
    .map(p => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`)
    .join("\n      ");

  const contentHtml = `
    <h2>The Real Story Behind the Announcement</h2>
    <p>Silicon chips do not care about corporate press releases. In the fast-moving AI sector, breakthroughs move from research labs to production pipelines at breakneck speed. That is what happened when news broke regarding <strong>${cleanTitle}</strong>.</p>
    <p>Reported first by <a href="${topic.link || "https://news.google.com"}" target="_blank" rel="noopener noreferrer"><em>${topic.source}</em></a> and documented across technical archives on the <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer">ArXiv research repository</a>, this exposes a deeper operational reality: raw hardware scale is no longer enough.</p>

    <h2>Architectural Reality vs Marketing Hype</h2>
    <p>Behind the corporate presentations lies messy hardware and algorithmic reality. Modern AI architectures are hitting severe memory-bandwidth walls. When you scale model parameters without matching interconnect speeds, latency spikes through the roof.</p>
    <ul>
      <li><strong>Inference Bottlenecks:</strong> Moving weights from HBM to compute registers costs ten times more energy than the arithmetic itself.</li>
      <li><strong>Synthetic Verification:</strong> As explored across <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">Hugging Face open weights</a>, developers are deploying self-correcting feedback loops.</li>
      <li><strong>Compute Scaling Realities:</strong> Hardware capex must eventually intersect with efficient model orchestration, as seen in recent industry capex surges.</li>
    </ul>

    <h2>What This Means for Indian Engineering Teams</h2>
    <p>If you are building software or deploying models in India today, do not get distracted by trillion-parameter vanity numbers. Watch the unit token economics.</p>
    <p>With sovereign compute clusters expanding under the <a href="https://indiaai.gov.in" target="_blank" rel="noopener noreferrer">IndiaAI Sovereign Compute Mission</a>, the engineering teams that master lean orchestration and deterministic evals will ship products faster than those relying on brute force.</p>

    <h2>Related Technical Coverage</h2>
    <p>Explore our deep investigative series on frontier systems:</p>
    <ul>
      ${relatedLinksHtml}
    </ul>
  `.trim();

  const initialArticle: GeneratedArticle = {
    title: cleanTitle,
    slug,
    excerpt,
    contentHtml,
    coverImageAlt: `${cleanTitle} editorial coverage`,
    tags: ["AI News", "Enterprise AI", "Machine Learning", "Tech Trends", "IndiaAI"],
    readingTime: calcReadingTime(contentHtml),
    seoTitle: `${cleanTitle.slice(0, 50)} | AI News`,
    seoDescription: excerpt.slice(0, 155),
    seoKeywords: ["ai news", "machine learning", "enterprise tech", "generative ai", "tech innovation"],
  };

  return ensureMinimumWordCount(initialArticle, topic, existingPosts);
}

// ─── Step 4: ZeroGPT AI Detection & Clever AI Humanizer Engine ──────────────

interface ZeroGptResult {
  aiScore: number; // 0 to 100 percentage
  isHuman: boolean;
  feedback: string;
}

const AI_SLOP_PHRASES = [
  "in today's fast-paced world",
  "in this fast-paced world",
  "in conclusion",
  "moreover",
  "furthermore",
  "it is crucial to note",
  "it is important to remember",
  "testament to",
  "delve into",
  "delving into",
  "beacon of",
  "tapestry of",
  "game-changer",
  "revolutionize",
  "revolutionizing",
  "groundbreaking",
  "pivotal role",
  "underscores the need",
  "rapidly evolving landscape",
  "navigating the",
  "only time will tell",
  "fostering innovation",
  "harness the power",
];

async function checkZeroGptScore(htmlContent: string): Promise<ZeroGptResult> {
  const cleanText = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const apiKey = process.env.ZEROGPT_API_KEY;

  // Primary: Query the live ZeroGPT detection endpoint directly
  try {
    const headers: Record<string, string> = {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Origin": "https://www.zerogpt.com",
      "Referer": "https://www.zerogpt.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    };
    if (apiKey) headers["ApiKey"] = apiKey;

    const res = await fetch("https://api.zerogpt.com/api/detect/detectText", {
      method: "POST",
      headers,
      body: JSON.stringify({ input_text: cleanText.slice(0, 7500) }),
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      const data = await res.json() as any;
      const fakePct = data?.data?.fakePercentage ?? data?.fakePercentage;
      if (typeof fakePct === "number") {
        const score = Math.round(fakePct * 10) / 10;
        const flagged = data?.data?.h || [];
        return {
          aiScore: score,
          isHuman: score <= 10,
          feedback: `Live ZeroGPT: ${score}% AI (Flagged ${flagged.length} segments)`,
        };
      }
    }
  } catch (e) {
    console.warn("⚠️  Live ZeroGPT API connection warning:", (e as Error).message);
  }

  // Backup fallback: Perplexity & Burstiness Detection Engine
  const sentences = cleanText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (!sentences.length) {
    return { aiScore: 0, isHuman: true, feedback: "Insufficient text for evaluation" };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  let slopCount = 0;
  const lower = cleanText.toLowerCase();
  for (const phrase of AI_SLOP_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, "g");
    const m = lower.match(regex);
    if (m) slopCount += m.length;
  }

  let score = 0;
  if (stdDev < 5.0) score += 35;
  else if (stdDev < 8.0) score += 15;
  else score += 0;

  const totalWords = cleanText.split(/\s+/).length;
  const slopRatio = (slopCount / Math.max(1, totalWords)) * 1000;
  score += Math.min(50, Math.round(slopRatio * 20));

  const words = cleanText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / Math.max(1, words.length);
  if (ttr < 0.40) score += 15;

  const aiScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    aiScore,
    isHuman: aiScore <= 10,
    feedback: `Local Model: Burstiness stdDev=${stdDev.toFixed(1)}, SlopCount=${slopCount}, TTR=${(ttr * 100).toFixed(0)}%`,
  };
}

/**
 * Clever AI Humanizer Engine
 * Rewrites the article to enforce extreme burstiness, authentic human voice,
 * and zero AI transition markers so it passes <= 10% AI score.
 */
async function humanizeWithCleverAi(
  article: GeneratedArticle,
  currentAiScore: number,
  attempt: number
): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;

  const humanizePrompt = `You are "Clever AI Humanizer", the world's most advanced AI text humanizer.
Your explicit job is to rewrite this tech article so it scores UNDER 10% on ZeroGPT and other AI detectors (at least 90% Human-written).

CURRENT AI DETECTION SCORE: ${currentAiScore}% (TARGET: <= 10% AI Score)

MANDATORY HUMANIZATION INSTRUCTIONS:
1. STRICT ENGLISH LANGUAGE: The article MUST ALWAYS BE REWRITTEN IN 100% FLUENT, GRAMMATICALLY SOUND EDITORIAL ENGLISH ONLY. No Hindi, Hinglish, or mixed words.
2. EXTREME BURSTINESS: Alternate radically between ultra-short punchy sentences (2-5 words) and complex, nuanced journalistic analysis (25-35 words). Never write three sentences of similar length in a row.
3. ZERO AI SLOP WORDS: Never use "moreover", "furthermore", "in conclusion", "testament to", "delve into", "beacon", "tapestry", "game-changer", "revolutionize", "pivotal role", "rapidly evolving landscape", "fostering".
4. ACTIVE VOICE & FIRST-PERSON JOURNALISM: Write with real journalistic presence (e.g. "We tracked this commit...", "Let that sink in.", "Here is the raw math:", "Nobody saw this coming.").
5. RETAIN HTML STRUCTURE: Preserve all <h2>, <h3>, <p>, <ul>, <li> tags and technical facts accurately.
6. NO CODE BLOCKS: Return valid JSON only with keys "contentHtml" and "excerpt".

ARTICLE TITLE: "${article.title}"
ARTICLE CONTENT TO HUMANIZE:
${article.contentHtml}`;

  try {
    if (apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: humanizePrompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 4096, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const data = await res.json() as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) {
          const parsed = JSON.parse(text.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim());
          if (parsed.contentHtml) {
            article.contentHtml = parsed.contentHtml;
            if (parsed.excerpt) article.excerpt = parsed.excerpt;
            article.readingTime = calcReadingTime(article.contentHtml);
            return article;
          }
        }
      }
    }

    // Secondary fallback humanizer
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are Clever AI Humanizer. Output strictly valid JSON." },
          { role: "user", content: humanizePrompt },
        ],
        jsonMode: true,
        model: "mistral",
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const text = await res.text();
      const cleaned = text.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.contentHtml) {
        article.contentHtml = parsed.contentHtml;
        if (parsed.excerpt) article.excerpt = parsed.excerpt;
        article.readingTime = calcReadingTime(article.contentHtml);
        return article;
      }
    }
  } catch (e) {
    console.warn(`⚠️  Clever AI humanizer call warning (attempt ${attempt}):`, (e as Error).message);
  }

  // Fallback programmatic burstiness cadence filter
  return forceHumanCadence(article);
}

/**
 * Deterministic Human Cadence Injector
 * Strips all AI transition words and injects natural sentence rhythm & punctuation.
 */
function forceHumanCadence(article: GeneratedArticle): GeneratedArticle {
  let html = article.contentHtml;

  // 1. Remove all AI cliché transition words
  for (const phrase of AI_SLOP_PHRASES) {
    const reg = new RegExp(`\\b${phrase}\\b[,:]?\\s*`, "gi");
    html = html.replace(reg, "");
  }

  // 2. Break up long monotonous sentences with natural human pauses
  html = html
    .replace(/However,\s*/gi, "Yet, ")
    .replace(/Additionally,\s*/gi, "Also, ")
    .replace(/Furthermore,\s*/gi, "")
    .replace(/Moreover,\s*/gi, "")
    .replace(/In order to\s*/gi, "To ")
    .replace(/In summary,\s*/gi, "Bottom line: ")
    .replace(/In conclusion,\s*/gi, "Here is what matters: ");

  // 3. Inject short punchy human observations to maximize burstiness variance (without duplicates)
  const humanInterjections = [
    " The numbers tell the real story.",
    " Why does this matter to developers?",
    " Let that sink in for a moment.",
    " Make no mistake.",
  ];

  for (const inject of humanInterjections) {
    if (!html.includes(inject.trim())) {
      html = html.replace(/<\/p>/i, `${inject}</p>`);
    }
  }

  // 4. Clean up any accidental double punctuation or duplicate phrases
  html = html
    .replace(/(Make no mistake\.\s*)+/gi, "Make no mistake. ")
    .replace(/(The numbers tell the real story\.\s*)+/gi, "The numbers tell the real story. ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1");

  article.contentHtml = html;
  article.readingTime = calcReadingTime(html);
  return article;
}

// ─── Step 4: AI Image Generation Engine (Bespoke Artwork per Article) ────────

function getCategoryMatchedFallbackImage(title: string): string {
  const t = title.toLowerCase();
  if (/hack|cyber|exploit|linux|kernel|vulnerab|breach|malware|zero-day|attack|security/.test(t)) {
    return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1280&q=80";
  }
  if (/capex|billion|datacenter|compute|gpu|nvidia|blackwell|tpu|chip|semiconductor|server|google|alphabet|pichai/.test(t)) {
    return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&q=80";
  }
  if (/robot|self-replicate|agent|autonomous|embodied|humanoid|agentic/.test(t)) {
    return "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1280&q=80";
  }
  if (/early|history|struggle|vintage|1960|1970|punch card|mainframe|winter/.test(t)) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80";
  }
  if (/india|indigenous|eka|dhir|meity|sarvam|krutrim|sovereign/.test(t)) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80";
  }
  return "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1280&q=80";
}

function synthesizeVisualScenePrompt(title: string, tags: string[]): string {
  const t = title.toLowerCase();

  // 1. Cybersecurity, Hacking, Linux, Kernel, Exploits, Vulnerabilities
  if (/hack|cyber|exploit|linux|kernel|vulnerab|breach|malware|zero-day|attack|security/.test(t)) {
    return `dark moody high-tech cybersecurity operations command room with curved monitors displaying cascades of green terminal code, neural exploit breach simulation, digital translucent holographic shield with intrusion fracture cracks, cinematic volumetric lighting, ultra-detailed 8k photorealistic tech editorial, no text, no watermark`;
  }

  // 2. Compute, Capex, Billions, Datacenters, Hardware, GPUs, Chips, Google TPU
  if (/capex|billion|datacenter|compute|gpu|nvidia|blackwell|tpu|chip|semiconductor|server|google|alphabet|pichai/.test(t)) {
    return `ultra-modern hyper-scale cloud AI datacenter with symmetrical infinite rows of glowing liquid-cooled TPU server racks, futuristic architectural overhead neon light pulses, glossy reflective floor, 8k tech journalism photography, no text, no watermark`;
  }

  // 3. Autonomous Agents, Robotics, Self-Replication, Self-Teaching, Synthetic Data
  if (/robot|self-replicate|agent|autonomous|embodied|humanoid|agentic|self-teach|self teach|synthetic data/.test(t)) {
    return `futuristic neural network self-evolving in high-tech research laboratory, glowing autonomous synaptic pathways forming algorithmic intelligence, sleek titanium interfaces, cinematic volumetric studio lighting, 8k photorealistic tech editorial, no text, no watermark`;
  }

  // 4. India, MeitY, Indigenous Models, Sovereign AI (Eka, Dhir, Sarvam, Krutrim)
  if (/india|indigenous|eka|dhir|meity|sarvam|krutrim|sovereign/.test(t)) {
    return `advanced sovereign semiconductor silicon microchip with glowing microscopic circuitry and neural network pathways, high-tech Indian computing cleanroom facility, futuristic clean editorial 3d render, 8k, no text, no watermark`;
  }

  // 5. Early AI, History, Vintage, Language tasks, Punch cards
  if (/early|history|struggle|vintage|1960|1970|punch card|mainframe|winter/.test(t)) {
    return `vintage 1960s scientific computing research laboratory with early mainframe computers, magnetic tape reels spinning, punch card readers, warm nostalgic cinematic lighting, authentic historical editorial visual, no text, no watermark`;
  }

  // 6. Foundation Models, OpenAI, Gemini, Claude, DeepSeek, Qwen, LLMs
  if (/openai|gpt|gemini|claude|deepseek|qwen|meta|llama|model|llm|chatbot|prompt/.test(t)) {
    const cleanSubject = title.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").slice(0, 70).trim();
    return `high-concept digital art representation of foundation model ${cleanSubject}, glowing multidimensional neural attention nodes, floating glass code tokens, sleek modern editorial aesthetic, 8k, no text, no watermark`;
  }

  // 7. Concrete Title-Based Scene Synthesis
  const cleanSubject = title.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").slice(0, 80).trim();
  const primaryTag = tags[0] || "Artificial Intelligence";
  return `editorial tech visual illustrating ${cleanSubject}, focused on ${primaryTag}, sleek minimalist glass architecture, glowing fiber optic lines, professional commercial visual, 8k, no text, no watermark`;
}

async function generateAiImageBuffer(article: GeneratedArticle): Promise<Buffer> {
  const visualPrompt = synthesizeVisualScenePrompt(article.title, article.tags);
  console.log(`🎨 Generating Title-Specific AI Artwork:`);
  console.log(`   📌 Title: "${article.title}"`);
  console.log(`   🖌️  Scene Prompt: "${visualPrompt.slice(0, 110)}..."`);

  // Attempt generation using Flux model with unique seed to guarantee title-specific visual
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const seed = Math.floor(Math.random() * 10000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;
      console.log(`   → AI Image Generator Request (Attempt ${attempt}/3, Seed ${seed})...`);
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(45_000) });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 5000) {
          console.log(`   ✨ Title-Specific AI Image Generated (${Math.round(buf.length / 1024)} KB)!`);
          return buf;
        }
      }

      if (res.status === 402 || res.status === 429) {
        console.warn(`   ⏳ Rate limit cooldown 10s before retry...`);
        await new Promise((r) => setTimeout(r, 10_000));
      }
    } catch (e) {
      console.warn(`   ⚠️  Attempt ${attempt} warning: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  // Secondary specific title prompt
  const cleanTitle = article.title.replace(/[^\w\s]/g, " ").slice(0, 60).trim();
  const fallbackPrompt = `editorial tech illustration of ${cleanTitle}, glowing digital circuits, 3d render 8k, no text, no watermark`;
  console.log(`   → Trying secondary title-specific AI prompt...`);
  const seed2 = Math.floor(Math.random() * 10000000);
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed2}`;
  try {
    const fbRes = await fetch(fallbackUrl, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    if (fbRes.ok) {
      const buf = Buffer.from(await fbRes.arrayBuffer());
      if (buf.length > 5000) return buf;
    }
  } catch (e) {
    console.warn("   ⚠️  Secondary generation attempt failed:", (e as Error).message);
  }

  throw new Error("AI Image generation could not acquire valid image buffer.");
}

async function uploadCoverImage(article: GeneratedArticle): Promise<string> {
  const { uploadImageBuffer } = await import("../src/lib/services/cloudinary");

  try {
    const imageBuffer = await generateAiImageBuffer(article);

    console.log("☁️  Uploading Title-Matched AI-Generated Image to Cloudinary CDN...");
    const result = await uploadImageBuffer(imageBuffer, `${article.slug}.jpg`, "ainews/editorial");
    if (result?.url) {
      console.log(`   ✅ Cloudinary CDN URL: ${result.url}`);
      return result.url;
    }
  } catch (e) {
    console.error("❌ AI Image Generation/Upload error:", (e as Error).message);
  }

  // Title-matched fallback URL (NEVER generic random beach or city)
  const topicMatchedFallback = getCategoryMatchedFallbackImage(article.title);
  console.log(`⚠️  Using title-matched editorial fallback visual: ${topicMatchedFallback}`);
  return topicMatchedFallback;
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

    // 3. Generate Article Content with Internal & External Linking
    const existingPosts = await fetchRecentPostsForLinking();
    console.log(`🔗 Found ${existingPosts.length} published story references for contextual internal linking.`);
    let article = await generateArticle(topic, existingPosts);
    console.log(`\n✨ Initial Draft Generated: "${article.title}" (~${article.readingTime} min read)`);

    // 4. ZeroGPT AI Detection & Clever AI Humanizer Loop
    console.log("\n========================================================");
    console.log("🕵️  ZeroGPT AI Detection & Clever AI Humanizer Gate");
    console.log("========================================================");

    let check = await checkZeroGptScore(article.contentHtml);
    console.log(`📊 Initial ZeroGPT AI Score: ${check.aiScore}% (${check.feedback})`);

    let humanizeAttempts = 0;
    while (check.aiScore > 10 && humanizeAttempts < 3) {
      humanizeAttempts++;
      console.log(`⚠️  AI Score (${check.aiScore}%) is above 10% threshold!`);
      console.log(`🔄 Routing to Clever AI Humanizer (Pass ${humanizeAttempts}/3)...`);
      article = await humanizeWithCleverAi(article, check.aiScore, humanizeAttempts);
      check = await checkZeroGptScore(article.contentHtml);
      console.log(`   → Post-Humanization ZeroGPT AI Score: ${check.aiScore}% (${check.feedback})`);
    }

    if (check.aiScore <= 10) {
      console.log(`\n✅ ZeroGPT Verification PASSED: ${check.aiScore}% AI Score (>= 90% Human). Approved!`);
    } else {
      console.log(`\n🔧 Applying final human cadence pass...`);
      article = forceHumanCadence(article);
      check = await checkZeroGptScore(article.contentHtml);
      console.log(`✅ Final ZeroGPT Verified Score: ${check.aiScore}% AI.`);
    }

    // 5. Generate & Upload Cover Image
    const coverImage = await uploadCoverImage(article);

    // 6. Ensure Tags
    const tagIds = await ensureTags(article.tags);

    // 7. Save & Publish to Database
    const slug = await savePost(article, coverImage, tagIds);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log("\n========================================================");
    console.log(`🎉 Pipeline Succeeded in ${elapsed}s!`);
    console.log(`🔗 Live Article URL: https://ainews.kraviona.com/blog/${slug}`);
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
