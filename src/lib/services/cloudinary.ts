import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  size: number;
  originalName: string;
}

/**
 * Upload an image buffer directly to Cloudinary CDN with fallback to local disk storage.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  originalName: string,
  folder = "ailatestnews"
): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash("sha1")
        .update(paramsToSign + apiSecret)
        .digest("hex");

      const ext = path.extname(originalName).toLowerCase().replace(".", "") || "png";
      const mime = ext === "svg" ? "svg+xml" : ext;
      const base64Data = `data:image/${mime};base64,${buffer.toString("base64")}`;

      const formData = new FormData();
      formData.append("file", base64Data);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `Cloudinary upload failed with status ${res.status}`);
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format || ext,
        width: data.width,
        height: data.height,
        size: data.bytes || buffer.length,
        originalName,
      };
    } catch (err) {
      console.error("[Cloudinary Upload Error, falling back to local storage]:", err);
    }
  }

  // Fallback to local storage in public/uploads
  try {
    const cleanExt = path.extname(originalName).toLowerCase() || ".png";
    const baseClean = path
      .basename(originalName, cleanExt)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);
    const filename = `${Date.now()}-${baseClean}${cleanExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer);

    return {
      url: `/uploads/${filename}`,
      publicId: `local_${filename}`,
      format: cleanExt.replace(".", ""),
      size: buffer.length,
      originalName,
    };
  } catch (err: any) {
    console.error("[Local Upload Fallback Error]:", err);
    throw new Error(`Failed to upload media asset: ${err.message}`);
  }
}

/**
 * Delete an image asset from Cloudinary or local storage.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  if (publicId.startsWith("local_")) {
    try {
      const filename = publicId.replace("local_", "");
      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (err) {
      console.error("[Local Delete Error]:", err);
      return false;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash("sha1")
        .update(paramsToSign + apiSecret)
        .digest("hex");

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      return res.ok && data.result === "ok";
    } catch (err) {
      console.error("[Cloudinary Delete Error]:", err);
      return false;
    }
  }

  return false;
}
