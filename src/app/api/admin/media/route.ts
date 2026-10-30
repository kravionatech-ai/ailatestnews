import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { Media } from "@/lib/db/models";
import { deleteImage } from "@/lib/services/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));

    await connectDB();

    const query: any = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ filename: regex }, { alt: regex }, { originalName: regex }];
    }

    const items = await Media.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({ success: true, items: JSON.parse(JSON.stringify(items)) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing media ID." }, { status: 400 });
    }

    await connectDB();
    const media = await Media.findById(id);
    if (!media) {
      return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    }

    if (media.publicId) {
      await deleteImage(media.publicId);
    }

    await Media.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Asset deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
