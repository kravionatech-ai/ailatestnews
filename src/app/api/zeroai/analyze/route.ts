import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { analyzeTextZeroAi } from "@/lib/zeroai/analyzer";

export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 30_000;
const MIN_INPUT_CHARS = 15;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rl = await checkRateLimit(ip, {
    windowMs: 60_000,
    max: 30,
    prefix: "zeroai_analyze",
  });

  const baseHeaders: Record<string, string> = {
    ...rateLimitHeaders(rl),
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please wait a minute before running another ZeroAI scan.",
      },
      { status: 429, headers: baseHeaders }
    );
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400, headers: baseHeaders }
    );
  }

  if (typeof body?.text !== "string") {
    return NextResponse.json(
      { success: false, error: "Request must include a text string to analyze." },
      { status: 400, headers: baseHeaders }
    );
  }

  const trimmed = body.text.trim();
  if (trimmed.length < MIN_INPUT_CHARS) {
    return NextResponse.json(
      {
        success: false,
        error: `Please provide at least ${MIN_INPUT_CHARS} characters of text for stylometric analysis.`,
      },
      { status: 400, headers: baseHeaders }
    );
  }

  if (trimmed.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      {
        success: false,
        error: `Input exceeds maximum limit of ${MAX_INPUT_CHARS.toLocaleString()} characters.`,
      },
      { status: 400, headers: baseHeaders }
    );
  }

  const result = analyzeTextZeroAi(trimmed);

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200, headers: baseHeaders }
  );
}
