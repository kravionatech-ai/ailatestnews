"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { Media, User } from "@/lib/db/models";
import { uploadImageBuffer, deleteImage } from "@/lib/services/cloudinary";

export async function uploadMediaAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in as an administrator." };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No image file provided for upload." };
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File exceeds 10MB maximum limit." };
    }

    // Type validation
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
    if (!validMimes.includes(file.type)) {
      return { success: false, error: `Invalid file type (${file.type}). Allowed: JPG, PNG, WEBP, AVIF, GIF, SVG.` };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const alt = (formData.get("alt") as string)?.trim() || "";
    const caption = (formData.get("caption") as string)?.trim() || "";
    const folder = (formData.get("folder") as string)?.trim() || "ailatestnews";

    const uploadRes = await uploadImageBuffer(buffer, file.name, folder);

    await connectDB();

    // Find or fallback to first admin user for uploadedBy
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

    revalidatePath("/admin/media");

    return {
      success: true,
      media: JSON.parse(JSON.stringify(mediaDoc)),
      url: uploadRes.url,
    };
  } catch (err: any) {
    console.error("[uploadMediaAction Error]:", err);
    return { success: false, error: err.message || "Failed to upload image." };
  }
}

export async function deleteMediaAction(mediaId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    await connectDB();
    const media = await Media.findById(mediaId);
    if (!media) {
      return { success: false, error: "Media asset not found." };
    }

    if (media.publicId) {
      await deleteImage(media.publicId);
    }

    await Media.findByIdAndDelete(mediaId);
    revalidatePath("/admin/media");

    return { success: true };
  } catch (err: any) {
    console.error("[deleteMediaAction Error]:", err);
    return { success: false, error: err.message || "Failed to delete media asset." };
  }
}

export async function getRecentMediaAction(limit = 24) {
  try {
    await connectDB();
    const items = await Media.find().sort({ createdAt: -1 }).limit(limit).lean();
    return { success: true, items: JSON.parse(JSON.stringify(items)) };
  } catch (err: any) {
    return { success: false, items: [], error: err.message };
  }
}
