"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Post, Category, Page, Tag, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";
import type { ISeoMetadata, EntityType } from "@/lib/seo/types";

interface SaveEntitySeoParams {
  id: string;
  type: "post" | "category" | "page" | "tag";
  seo: Partial<ISeoMetadata>;
  partial?: boolean;
}

export async function saveEntitySeoAction({
  id,
  type,
  seo,
  partial = false,
}: SaveEntitySeoParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Admin session required." };
    }

    await connectDB();

    let doc: any = null;
    let path = "/";

    if (type === "post") {
      doc = await Post.findById(id);
      if (doc) path = `/blog/${doc.slug}`;
    } else if (type === "category") {
      doc = await Category.findById(id);
      if (doc) path = `/category/${doc.slug}`;
    } else if (type === "page") {
      doc = await Page.findById(id);
      if (doc) path = doc.slug === "home" ? "/" : `/${doc.slug}`;
    } else if (type === "tag") {
      doc = await Tag.findById(id);
      if (doc) path = `/tag/${doc.slug}`;
    }

    if (!doc) {
      return { success: false, error: `${type} record not found for ID: ${id}` };
    }

    // Preserve existing SEO fields when partial update (e.g. bulk editor) is used
    if (partial) {
      const existingSeo = doc.seo ? (doc.seo.toObject ? doc.seo.toObject() : doc.seo) : {};
      doc.seo = {
        ...existingSeo,
        ...seo,
        // Ensure nested objects aren't wiped if only top-level fields are passed
        robots: seo.robots ? { ...(existingSeo.robots || {}), ...seo.robots } : existingSeo.robots,
        sitemap: seo.sitemap ? { ...(existingSeo.sitemap || {}), ...seo.sitemap } : existingSeo.sitemap,
      };
    } else {
      doc.seo = seo;
    }

    await doc.save();

    await AuditLog.create({
      user: session.user.id,
      action: "update",
      resource: `${type.toUpperCase()}_SEO`,
      resourceId: doc._id,
      details: { title: doc.title || doc.name, slug: doc.slug, path, partial },
    });

    // Revalidate affected cache paths
    await triggerSeoRevalidation({
      path,
      forceIndexNow: doc.status === "published" || type === "category" || type === "tag",
    });

    revalidatePath("/admin/seo");
    revalidatePath("/sitemap.xml");
    revalidatePath(path);

    return {
      success: true,
      seo: JSON.parse(JSON.stringify(doc.seo)),
      path,
    };
  } catch (err: any) {
    console.error("[saveEntitySeoAction Error]", err);
    return { success: false, error: err.message || "Failed to update SEO" };
  }
}
