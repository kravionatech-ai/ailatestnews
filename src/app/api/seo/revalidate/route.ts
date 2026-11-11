import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";

function safeCompareSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function isAuthorizedRevalidateRequest(req: Request): Promise<boolean> {
  const headerSecret =
    req.headers.get("x-revalidate-secret")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";

  const candidateSecrets = [
    process.env.REVALIDATE_SECRET,
    process.env.INDEXNOW_KEY,
    process.env.AUTH_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim()));

  if (headerSecret && candidateSecrets.some((expected) => safeCompareSecret(headerSecret, expected))) {
    return true;
  }

  try {
    const session = await auth();
    if (!session?.user?.id) return false;
    await connectDB();
    const user = await User.findById(session.user.id).select("role isActive").lean();
    return Boolean(user && user.isActive && (user as { role?: string }).role === "admin");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const authorized = await isAuthorizedRevalidateRequest(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: valid secret or admin session required." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      extraPaths?: string[];
      categorySlug?: string;
      categorySlugs?: string[];
      tagSlugs?: string[];
      forceIndexNow?: boolean;
      pingUrls?: string[];
    };

    const result = await triggerSeoRevalidation({
      path: body.path || "/sitemap.xml",
      extraPaths: Array.isArray(body.extraPaths) ? body.extraPaths : [],
      categorySlug: body.categorySlug,
      categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs : [],
      tagSlugs: Array.isArray(body.tagSlugs) ? body.tagSlugs : [],
      forceIndexNow: Boolean(body.forceIndexNow),
      pingUrls: Array.isArray(body.pingUrls) ? body.pingUrls : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        revalidated: result.revalidated,
        indexNow: result.indexNow,
        stats: result.stats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to revalidate SEO feeds";
    console.error("[/api/seo/revalidate Error]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
