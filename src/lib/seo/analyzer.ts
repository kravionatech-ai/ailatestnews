import type { ISeoAnalysisResult, ISeoScoreRule } from "./types";
import { slugify, stripHtml } from "@/lib/utils";

export interface AnalyzeContentInput {
  title?: string;
  slug?: string;
  contentHtml?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  ogImage?: string;
  coverImage?: string;
  canonicalUrl?: string;
}

/**
 * Estimate Google SERP pixel width for a text string
 * Average proportions on Arial 20px (title) ~ 9.5px per char; 14px (description) ~ 6.1px
 */
export function estimateTitlePixelWidth(text: string): number {
  if (!text) return 0;
  let width = 0;
  for (const char of text) {
    if (/[il|.,'!]/.test(char)) width += 4.5;
    else if (/[wWmMOQ@]/.test(char)) width += 14;
    else if (/[A-Z]/.test(char)) width += 11.5;
    else if (/[0-9]/.test(char)) width += 9.5;
    else if (char === " ") width += 5;
    else width += 9;
  }
  return Math.round(width);
}

export function estimateDescriptionPixelWidth(text: string): number {
  if (!text) return 0;
  let width = 0;
  for (const char of text) {
    if (/[il|.,'!]/.test(char)) width += 3.2;
    else if (/[wWmMOQ@]/.test(char)) width += 9.5;
    else if (/[A-Z]/.test(char)) width += 8.0;
    else if (/[0-9]/.test(char)) width += 6.5;
    else if (char === " ") width += 3.5;
    else width += 6.1;
  }
  return Math.round(width);
}

/**
 * Calculate Flesch Reading Ease score
 */
function calculateReadability(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  if (words.length === 0 || sentences.length === 0) return 70;

  let syllables = 0;
  for (const w of words) {
    const word = w.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) {
      syllables += 1;
      continue;
    }
    const matches = word.match(/[aeiouy]{1,2}/g);
    syllables += matches ? matches.length : 1;
  }

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Perform comprehensive, real-time SEO analysis
 */
export function analyzeSeoContent(input: AnalyzeContentInput): ISeoAnalysisResult {
  const checklist: ISeoScoreRule[] = [];
  const keyword = input.focusKeyword?.trim().toLowerCase() || "";
  const effectiveTitle = input.metaTitle?.trim() || input.title?.trim() || "";
  const effectiveDescription = input.metaDescription?.trim() || "";
  const cleanHtml = input.contentHtml || "";
  const plainText = stripHtml(cleanHtml);
  const words = plainText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const titlePx = estimateTitlePixelWidth(effectiveTitle);
  const descPx = estimateDescriptionPixelWidth(effectiveDescription);

  // 1. Keyword in Title
  if (!keyword) {
    checklist.push({
      id: "keyword_title",
      label: "Focus keyword in title",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "No focus keyword provided.",
      fixHint: "Define a focus keyword to evaluate keyword placement.",
    });
  } else if (effectiveTitle.toLowerCase().includes(keyword)) {
    checklist.push({
      id: "keyword_title",
      label: "Focus keyword in title",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: `Focus keyword "${keyword}" appears in the title.`,
    });
  } else {
    checklist.push({
      id: "keyword_title",
      label: "Focus keyword in title",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: `Title does not contain "${keyword}".`,
      fixHint: "Include the focus keyword near the beginning of your title.",
    });
  }

  // 2. Keyword in Slug / URL
  const slugKeyword = slugify(keyword);
  if (!keyword) {
    checklist.push({
      id: "keyword_slug",
      label: "Focus keyword in URL slug",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: "No focus keyword provided.",
    });
  } else if (input.slug && slugKeyword && input.slug.toLowerCase().includes(slugKeyword)) {
    checklist.push({
      id: "keyword_slug",
      label: "Focus keyword in URL slug",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: "The URL slug includes the focus keyword.",
    });
  } else {
    checklist.push({
      id: "keyword_slug",
      label: "Focus keyword in URL slug",
      status: "warn",
      points: 4,
      maxPoints: 10,
      message: "Slug does not match the focus keyword.",
      fixHint: "Keep the slug concise with your primary keyword.",
    });
  }

  // 3. Keyword in Meta Description
  if (!keyword) {
    checklist.push({
      id: "keyword_desc",
      label: "Focus keyword in meta description",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "No focus keyword specified.",
    });
  } else if (effectiveDescription.toLowerCase().includes(keyword)) {
    checklist.push({
      id: "keyword_desc",
      label: "Focus keyword in meta description",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: "Focus keyword found in meta description.",
    });
  } else {
    checklist.push({
      id: "keyword_desc",
      label: "Focus keyword in meta description",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "Meta description does not contain focus keyword.",
      fixHint: "Work the focus keyword naturally into the meta description.",
    });
  }

  // 4. Keyword in First Paragraph (first 100 words)
  const first100Words = words.slice(0, 100).join(" ").toLowerCase();
  if (keyword && first100Words.includes(keyword)) {
    checklist.push({
      id: "keyword_intro",
      label: "Focus keyword in introduction",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: "Focus keyword appears within the first 100 words.",
    });
  } else if (keyword && wordCount > 0) {
    checklist.push({
      id: "keyword_intro",
      label: "Focus keyword in introduction",
      status: "warn",
      points: 4,
      maxPoints: 10,
      message: "Keyword not detected in the opening paragraph.",
      fixHint: "Mention the primary topic in the first sentence or two.",
    });
  } else {
    checklist.push({
      id: "keyword_intro",
      label: "Focus keyword in introduction",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: "No content available to check introduction.",
    });
  }

  // 5. Title Length (50-60 chars / ~580px)
  const titleLen = effectiveTitle.length;
  if (titleLen >= 45 && titleLen <= 65 && titlePx <= 580) {
    checklist.push({
      id: "title_length",
      label: "Title tag length",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: `Ideal length (${titleLen} chars / ~${titlePx}px). Fits within Google desktop limits.`,
    });
  } else if (titleLen > 65 || titlePx > 580) {
    checklist.push({
      id: "title_length",
      label: "Title tag length",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: `Title is long (${titleLen} chars / ~${titlePx}px). May truncate with '…' in search results.`,
      fixHint: "Aim for 50-60 characters (< 580px).",
    });
  } else if (titleLen > 0 && titleLen < 45) {
    checklist.push({
      id: "title_length",
      label: "Title tag length",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: `Title is somewhat short (${titleLen} chars). You could expand with keywords.`,
      fixHint: "Utilize 50-60 characters for maximum search visibility.",
    });
  } else {
    checklist.push({
      id: "title_length",
      label: "Title tag length",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "Title is missing.",
      fixHint: "Provide an engaging title.",
    });
  }

  // 6. Meta Description Length (120-160 chars / ~960px)
  const descLen = effectiveDescription.length;
  if (descLen >= 120 && descLen <= 165 && descPx <= 960) {
    checklist.push({
      id: "desc_length",
      label: "Meta description length",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: `Optimal snippet length (${descLen} chars / ~${descPx}px).`,
    });
  } else if (descLen > 165 || descPx > 960) {
    checklist.push({
      id: "desc_length",
      label: "Meta description length",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: `Description exceeds optimal length (${descLen} chars / ~${descPx}px). Will truncate.`,
      fixHint: "Trim down to 140-160 characters.",
    });
  } else if (descLen > 0 && descLen < 120) {
    checklist.push({
      id: "desc_length",
      label: "Meta description length",
      status: "warn",
      points: 5,
      maxPoints: 10,
      message: `Short description (${descLen} chars). Expand to highlight key insights.`,
      fixHint: "Use 120-160 characters to capture user intent.",
    });
  } else {
    checklist.push({
      id: "desc_length",
      label: "Meta description length",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "Meta description is missing.",
      fixHint: "Write a concise summary containing a call to action.",
    });
  }

  // 7. Heading Hierarchy (H2/H3 present)
  const h2Count = (cleanHtml.match(/<h2/gi) || []).length;
  const h3Count = (cleanHtml.match(/<h3/gi) || []).length;
  if (h2Count >= 2) {
    checklist.push({
      id: "headings",
      label: "Heading hierarchy",
      status: "pass",
      points: 8,
      maxPoints: 8,
      message: `Good structure (${h2Count} H2s, ${h3Count} H3s).`,
    });
  } else if (h2Count === 1) {
    checklist.push({
      id: "headings",
      label: "Heading hierarchy",
      status: "warn",
      points: 4,
      maxPoints: 8,
      message: "Only 1 H2 tag found. Break content into more sub-sections.",
    });
  } else if (wordCount > 150) {
    checklist.push({
      id: "headings",
      label: "Heading hierarchy",
      status: "fail",
      points: 0,
      maxPoints: 8,
      message: "No H2 subheadings found in article content.",
      fixHint: "Use H2 and H3 headings to structure your points.",
    });
  } else {
    checklist.push({
      id: "headings",
      label: "Heading hierarchy",
      status: "pass",
      points: 8,
      maxPoints: 8,
      message: "Concise page structure.",
    });
  }

  // 8. Image Alt Text & Media
  const imgMatches = cleanHtml.match(/<img[^>]*>/gi) || [];
  const imgCount = imgMatches.length;
  const hasAlt = imgMatches.filter((img) => /alt=["'][^"']+["']/i.test(img)).length;
  if (imgCount === 0) {
    checklist.push({
      id: "image_alt",
      label: "Images & Alt attributes",
      status: "warn",
      points: 4,
      maxPoints: 8,
      message: "No inline images found. Visual media improves dwell time.",
    });
  } else if (hasAlt === imgCount) {
    checklist.push({
      id: "image_alt",
      label: "Images & Alt attributes",
      status: "pass",
      points: 8,
      maxPoints: 8,
      message: `All ${imgCount} images have descriptive alt text.`,
    });
  } else {
    checklist.push({
      id: "image_alt",
      label: "Images & Alt attributes",
      status: "fail",
      points: 2,
      maxPoints: 8,
      message: `${imgCount - hasAlt} of ${imgCount} images are missing alt text.`,
      fixHint: "Add descriptive alt attributes to all images for screen readers and SEO.",
    });
  }

  // 9. Internal Links
  const internalLinks = (cleanHtml.match(/href=["'](\/|https?:\/\/ailatestnews\.in)/gi) || []).length;
  if (internalLinks >= 2) {
    checklist.push({
      id: "internal_links",
      label: "Internal links count",
      status: "pass",
      points: 8,
      maxPoints: 8,
      message: `Found ${internalLinks} internal links. Great for site architecture.`,
    });
  } else if (internalLinks === 1) {
    checklist.push({
      id: "internal_links",
      label: "Internal links count",
      status: "warn",
      points: 4,
      maxPoints: 8,
      message: "Only 1 internal link found. Add at least 1 more related link.",
    });
  } else {
    checklist.push({
      id: "internal_links",
      label: "Internal links count",
      status: "fail",
      points: 0,
      maxPoints: 8,
      message: "No internal links found in the text.",
      fixHint: "Link to other relevant guides, categories, or model launches.",
    });
  }

  // 10. External Reference Links
  const externalLinks = (cleanHtml.match(/href=["']https?:\/\/(?!ailatestnews\.in)/gi) || []).length;
  if (externalLinks >= 1) {
    checklist.push({
      id: "external_links",
      label: "External reference links",
      status: "pass",
      points: 6,
      maxPoints: 6,
      message: `Found ${externalLinks} external authoritative citation links.`,
    });
  } else {
    checklist.push({
      id: "external_links",
      label: "External reference links",
      status: "warn",
      points: 2,
      maxPoints: 6,
      message: "No external references. Citing original research papers or docs builds trust.",
    });
  }

  // 11. Word Count & Readability
  if (wordCount >= 600) {
    checklist.push({
      id: "word_count",
      label: "Content depth (word count)",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: `Deep content (${wordCount} words). Thoroughly covers the topic.`,
    });
  } else if (wordCount >= 300) {
    checklist.push({
      id: "word_count",
      label: "Content depth (word count)",
      status: "warn",
      points: 6,
      maxPoints: 10,
      message: `Moderate length (${wordCount} words). Consider adding practical examples.`,
    });
  } else if (wordCount > 0) {
    checklist.push({
      id: "word_count",
      label: "Content depth (word count)",
      status: "fail",
      points: 2,
      maxPoints: 10,
      message: `Thin content (${wordCount} words). Risk of low quality signal.`,
      fixHint: "Aim for at least 500-600 words for technical articles.",
    });
  } else {
    checklist.push({
      id: "word_count",
      label: "Content depth (word count)",
      status: "pass",
      points: 8,
      maxPoints: 10,
      message: "Standard taxonomy or landing page entry.",
    });
  }

  // 12. Social / OG Image
  const hasOg = Boolean(input.ogImage?.trim() || input.coverImage?.trim());
  if (hasOg) {
    checklist.push({
      id: "og_image",
      label: "Social OpenGraph image",
      status: "pass",
      points: 10,
      maxPoints: 10,
      message: "OpenGraph / social share image is configured.",
    });
  } else {
    checklist.push({
      id: "og_image",
      label: "Social OpenGraph image",
      status: "fail",
      points: 0,
      maxPoints: 10,
      message: "Missing social share image.",
      fixHint: "Set an OG cover image (1200x630) for rich previews on X, LinkedIn and WhatsApp.",
    });
  }

  // Calculate total score
  const totalPoints = checklist.reduce((sum, item) => sum + item.points, 0);
  const maxPossible = checklist.reduce((sum, item) => sum + item.maxPoints, 0);
  const score = Math.round((totalPoints / (maxPossible || 1)) * 100);

  let grade: "poor" | "ok" | "good" | "excellent" = "poor";
  if (score >= 85) grade = "excellent";
  else if (score >= 70) grade = "good";
  else if (score >= 50) grade = "ok";

  return {
    score,
    grade,
    checklist,
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
    titlePixelWidth: titlePx,
    descriptionPixelWidth: descPx,
  };
}
