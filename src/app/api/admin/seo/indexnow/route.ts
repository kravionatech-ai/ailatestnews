import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/revalidate-and-ping";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const result = await pingIndexNow([url], true); // Force flag to test anytime

    return NextResponse.json({
      success: result.success,
      message: result.message,
      statusCode: result.statusCode,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
