import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category, Post } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const categorySlug = searchParams.get("category")?.trim() || "";

  if (!q && !categorySlug) {
    return NextResponse.json({ posts: [] });
  }

  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { status: "published" };

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
      if (cat) {
        filter.category = cat._id;
      }
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { title: { $regex: regex } },
        { excerpt: { $regex: regex } },
        { slug: { $regex: regex } },
      ];
    }

    const posts = await Post.find(filter)
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
