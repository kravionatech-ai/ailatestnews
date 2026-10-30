import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { Media, User } from "@/lib/db/models";
import { uploadImageBuffer } from "@/lib/services/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB maximum limit." }, { status: 400 });
    }

    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format (${file.type}). Allowed: JPG, PNG, WEBP, AVIF, GIF, SVG.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const alt = (formData.get("alt") as string)?.trim() || "";
    const caption = (formData.get("caption") as string)?.trim() || "";
    const folder = (formData.get("folder") as string)?.trim() || "ailatestnews";

    const uploadRes = await uploadImageBuffer(buffer, file.name, folder);

    await connectDB();

    let userId = session.user.id;
    if (!userId) {
      const adminUser = await User.findOne({ role: "admin" }).select("_id").lean();
      userId = adminUser?._id?.toString();
    }

    const mediaDoc = await Media.create({
      filename: uploadRes.originalName,
      originalName: uploadRes.originalName,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
      format: uploadRes.format,
      width: uploadRes.width,
      height: uploadRes.height,
      size: uploadRes.size,
      alt,
      caption,
      folder,
      uploadedBy: userId,
    });

    return NextResponse.json({
      success: true,
      url: uploadRes.url,
      media: JSON.parse(JSON.stringify(mediaDoc)),
    });
  } catch (err: any) {
    console.error("[POST /api/admin/media/upload Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to upload image." }, { status: 500 });
  }
}
