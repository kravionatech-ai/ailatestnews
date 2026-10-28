import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, feedback } = body as {
      rating: "up" | "down";
      feedback?: string;
    };

    // Log anonymized feedback metric
    console.log("[Chatbot Anonymized Feedback]", {
      rating,
      feedbackLength: feedback?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true },
      { headers: { "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 400, headers: { "X-Robots-Tag": "noindex, nofollow" } }
    );
  }
}
