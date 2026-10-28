import { NextResponse } from "next/server";
import { stripHtml } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, title = "", excerpt = "", contentHtml = "", focusKeyword = "" } = body;

    const plainText = stripHtml(contentHtml).slice(0, 3000);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Helper for Anthropic Claude API call
    const callClaude = async (systemPrompt: string, userPrompt: string) => {
      if (!apiKey) return null;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 600,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.content?.[0]?.text?.trim() || null;
        }
      } catch (err) {
        console.warn("Claude API call failed, falling back to local engine:", err);
      }
      return null;
    };

    switch (action) {
      case "title": {
        const systemPrompt =
          "You are an elite SEO headline engineer for AI Latest News in India. Create a compelling, high-CTR meta title between 50 and 60 characters. Must contain the primary topic or keyword. Return ONLY the title text, nothing else.";
        const userPrompt = `Headline: ${title}\nFocus Keyword: ${focusKeyword}\nContext: ${excerpt || plainText.slice(0, 300)}`;

        let generatedTitle = await callClaude(systemPrompt, userPrompt);
        if (!generatedTitle) {
          // Heuristic generator
          const topic = focusKeyword || title.split(":")[0] || "AI Breakthrough";
          generatedTitle = `${topic}: Complete 2026 Breakdown for India | AI Latest News`;
          if (generatedTitle.length > 60) {
            generatedTitle = `${topic}: 2026 Guide for India | AI News`;
          }
        }
        return NextResponse.json({ success: true, result: generatedTitle });
      }

      case "description": {
        const systemPrompt =
          "You are a search snippet optimizer for AI Latest News. Write an actionable meta description between 135 and 155 characters that summarizes the article and drives clicks. Include the focus keyword naturally. Return ONLY the description text, nothing else.";
        const userPrompt = `Title: ${title}\nFocus Keyword: ${focusKeyword}\nExcerpt: ${excerpt}\nContent Summary: ${plainText.slice(0, 500)}`;

        let generatedDesc = await callClaude(systemPrompt, userPrompt);
        if (!generatedDesc) {
          const kw = focusKeyword || "generative AI";
          generatedDesc = `Explore our in-depth analysis of ${kw}. Discover benchmarks, Indian rupee pricing, compute infrastructure, and hands-on developer insights today.`;
        }
        return NextResponse.json({ success: true, result: generatedDesc });
      }

      case "keywords": {
        const systemPrompt =
          "Generate 1 primary focus keyword and 4 secondary long-tail keywords for an article on AI Latest News (India). Return JSON in format: {\"focusKeyword\": \"...\", \"secondaryKeywords\": [\"...\", \"...\", \"...\"]}. Return ONLY valid JSON.";
        const userPrompt = `Title: ${title}\nContent: ${plainText.slice(0, 500)}`;

        let jsonText = await callClaude(systemPrompt, userPrompt);
        let parsed = null;
        if (jsonText) {
          try {
            parsed = JSON.parse(jsonText.replace(/```json|```/g, ""));
          } catch {
            // fallback
          }
        }
        if (!parsed) {
          const baseTopic = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter((w: string) => w.length > 3).slice(0, 2).join(" ");
          parsed = {
            focusKeyword: baseTopic || "artificial intelligence",
            secondaryKeywords: [
              `${baseTopic} in India`,
              `${baseTopic} benchmarks`,
              `${baseTopic} developer guide`,
              "sovereign AI models",
            ],
          };
        }
        return NextResponse.json({ success: true, result: parsed });
      }

      case "faq": {
        const systemPrompt =
          "Generate 3 high-intent FAQ questions and concise answers based on this AI article. Format as JSON array: [{\"question\": \"...\", \"answer\": \"...\"}]. Return ONLY valid JSON.";
        const userPrompt = `Title: ${title}\nContent: ${plainText.slice(0, 800)}`;

        let jsonText = await callClaude(systemPrompt, userPrompt);
        let faqs = null;
        if (jsonText) {
          try {
            faqs = JSON.parse(jsonText.replace(/```json|```/g, ""));
          } catch {
            // fallback
          }
        }
        if (!faqs || !Array.isArray(faqs)) {
          faqs = [
            {
              question: `What makes ${title.split(":")[0] || "this release"} important for India?`,
              answer: "It introduces optimized token efficiency for Indic languages and reduces compute overhead for domestic startups and developers.",
            },
            {
              question: "Can this model or tool be deployed locally?",
              answer: "Yes, quantized open-weight versions can be hosted on on-premise hardware using Ollama or vLLM to maintain full data sovereignty.",
            },
            {
              question: "How does it compare on rupee pricing?",
              answer: "It provides significantly lower inference costs compared to proprietary frontier APIs, drastically slashing token expenditure.",
            },
          ];
        }
        return NextResponse.json({ success: true, result: faqs });
      }

      case "schema": {
        const schemaType =
          title.toLowerCase().includes("vs") || title.toLowerCase().includes("review")
            ? "Review"
            : title.toLowerCase().includes("guide") || title.toLowerCase().includes("how to")
            ? "HowTo"
            : title.toLowerCase().includes("breakdown") || title.toLowerCase().includes("architecture")
            ? "TechArticle"
            : "NewsArticle";

        const sampleSchema = {
          "@context": "https://schema.org",
          "@type": schemaType,
          headline: title,
          description: excerpt || "Analysis from AI Latest News",
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://ailatestnews.in/blog/${title.toLowerCase().replace(/\s+/g, "-")}`,
          },
        };

        return NextResponse.json({
          success: true,
          result: {
            schemaType,
            schemaOverrides: JSON.stringify(sampleSchema, null, 2),
          },
        });
      }

      case "alt": {
        const altText = `Infographic diagram and benchmark visualization for ${title} on AI Latest News`;
        return NextResponse.json({ success: true, result: altText });
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
