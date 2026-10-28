import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ posts: [] });
  }

  try {
    await connectDB();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const posts = await Post.find({
      status: "published",
      $or: [
        { title: { $regex: regex } },
        { excerpt: { $regex: regex } },
        { slug: { $regex: regex } },
      ],
    })
      .select("title slug excerpt coverImage category publishedAt readingTime views")
      .populate("category", "name slug")
      .sort({ publishedAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({ posts: JSON.parse(JSON.stringify(posts)) });
  } catch (err) {
    console.error("[Search API Error]", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
