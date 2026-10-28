"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Category, Tag, Post, Redirect, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { slugify } from "@/lib/utils";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";
import type { ISeoMetadata } from "@/lib/seo/types";

// ─────────────────────────────────────────────────────────────
// Category Actions
// ─────────────────────────────────────────────────────────────

export async function createCategoryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const description = (formData.get("description") as string)?.trim();
  const introHtml = (formData.get("introHtml") as string)?.trim() || "";
  const parent = (formData.get("parent") as string) || null;
  const color = (formData.get("color") as string) || "#4f46e5";
  const icon = (formData.get("icon") as string) || "Folder";
  const order = Number(formData.get("order") || 0);

  // SEO payload
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }
  if (!seoPayload.metaTitle) seoPayload.metaTitle = name;
  if (!seoPayload.metaDescription) seoPayload.metaDescription = description || introHtml.slice(0, 160);
  if (!seoPayload.schemaType) seoPayload.schemaType = "CollectionPage";

  // FAQs
  const faqsRaw = formData.get("faqs") as string;
  const faqs = faqsRaw ? JSON.parse(faqsRaw) : [];

  if (!name || !slug) return { success: false, error: "Name and slug are required" };

  const existing = await Category.findOne({ slug });
  if (existing) return { success: false, error: "Category slug already exists" };

  const category = await Category.create({
    name,
    slug,
    description,
    introHtml,
    parent: parent || null,
    color,
    icon,
    order,
    faqs,
    seo: seoPayload,
  });

  await AuditLog.create({
    user: session.user.id,
    action: "create",
    resource: "Category",
    resourceId: category._id,
    details: { name, slug },
  });

  revalidatePath("/admin/taxonomies");
  revalidatePath("/");
  return { success: true, category: JSON.parse(JSON.stringify(category)) };
}

export async function updateCategoryAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const category = await Category.findById(id);
  if (!category) return { success: false, error: "Category not found" };

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const description = (formData.get("description") as string)?.trim();
  const introHtml = (formData.get("introHtml") as string)?.trim() || "";
  const parent = (formData.get("parent") as string) || null;
  const color = (formData.get("color") as string) || "#4f46e5";
  const icon = (formData.get("icon") as string) || "Folder";
  const order = Number(formData.get("order") || 0);

  // Auto 301 redirect if slug changes
  const oldSlug = category.slug;
  if (oldSlug && oldSlug !== slug) {
    const existingRedirect = await Redirect.findOne({ from: `/category/${oldSlug}` });
    if (!existingRedirect) {
      await Redirect.create({
        from: `/category/${oldSlug}`,
        to: `/category/${slug}`,
        type: 301,
        createdBy: session.user.id,
        note: `Auto-generated when category '${category.name}' was renamed to '${slug}'`,
      });
    }
  }

  // SEO payload
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = category.seo || {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  // FAQs
  const faqsRaw = formData.get("faqs") as string;
  const faqs = faqsRaw ? JSON.parse(faqsRaw) : category.faqs || [];

  category.name = name;
  category.slug = slug;
  category.description = description;
  category.introHtml = introHtml;
  category.parent = (parent ? parent : null) as unknown as typeof category.parent;
  category.color = color;
  category.icon = icon;
  category.order = order;
  category.faqs = faqs;
  category.seo = seoPayload;

  await category.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Category",
    resourceId: category._id,
    details: { name, slug, slugChanged: oldSlug !== slug },
  });

  await triggerSeoRevalidation({
    path: `/category/${slug}`,
    categorySlug: slug,
    forceIndexNow: true,
  });

  revalidatePath("/admin/taxonomies");
  revalidatePath(`/category/${slug}`);
  revalidatePath("/");

  return { success: true, category: JSON.parse(JSON.stringify(category)) };
}

export async function deleteCategoryAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const category = await Category.findById(id);
  if (!category) return { success: false, error: "Category not found" };

  // Check if posts are attached
  const postsCount = await Post.countDocuments({ category: id });
  if (postsCount > 0) {
    return {
      success: false,
      error: `Cannot delete category. ${postsCount} post(s) are assigned to it. Reassign them first.`,
    };
  }

  await Category.findByIdAndDelete(id);

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "Category",
    resourceId: id,
    details: { name: category.name, slug: category.slug },
  });

  revalidatePath("/admin/taxonomies");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Tag Actions & Merge Tool
// ─────────────────────────────────────────────────────────────

export async function createTagAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const description = (formData.get("description") as string)?.trim() || "";

  // SEO payload
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }
  if (!seoPayload.metaTitle) seoPayload.metaTitle = `${name} - Tagged Articles`;
  if (!seoPayload.metaDescription) seoPayload.metaDescription = description || `Read latest dispatches tagged with ${name}`;
  if (!seoPayload.schemaType) seoPayload.schemaType = "CollectionPage";

  if (!name || !slug) return { success: false, error: "Name and slug are required" };

  const existing = await Tag.findOne({ slug });
  if (existing) return { success: false, error: "Tag slug already exists" };

  const tag = await Tag.create({ name, slug, description, seo: seoPayload });

  await AuditLog.create({
    user: session.user.id,
    action: "create",
    resource: "Tag",
    resourceId: tag._id,
    details: { name, slug },
  });

  revalidatePath("/admin/taxonomies");
  return { success: true, tag: JSON.parse(JSON.stringify(tag)) };
}

export async function updateTagAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const tag = await Tag.findById(id);
  if (!tag) return { success: false, error: "Tag not found" };

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const description = (formData.get("description") as string)?.trim() || "";

  // SEO payload
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = tag.seo || {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  tag.name = name;
  tag.slug = slug;
  tag.description = description;
  tag.seo = seoPayload;

  await tag.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Tag",
    resourceId: tag._id,
    details: { name, slug },
  });

  revalidatePath("/admin/taxonomies");
  revalidatePath(`/tag/${slug}`);

  return { success: true, tag: JSON.parse(JSON.stringify(tag)) };
}

export async function deleteTagAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const tag = await Tag.findById(id);
  if (!tag) return { success: false, error: "Tag not found" };

  // Remove tag reference from all posts
  await Post.updateMany({ tags: id }, { $pull: { tags: id } });
  await Tag.findByIdAndDelete(id);

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "Tag",
    resourceId: id,
    details: { name: tag.name, slug: tag.slug },
  });

  revalidatePath("/admin/taxonomies");
  return { success: true };
}

/**
 * Merge Tags Tool:
 * Consolidate duplicate or variant tags (e.g. merge "llm" into "llms").
 * Updates all posts referencing sourceTagId to point to targetTagId,
 * removes sourceTagId, and recalculates postCount.
 */
export async function mergeTagsAction(sourceTagId: string, targetTagId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  if (sourceTagId === targetTagId) {
    return { success: false, error: "Source and target tags must be different" };
  }

  await connectDB();
  const [sourceTag, targetTag] = await Promise.all([
    Tag.findById(sourceTagId),
    Tag.findById(targetTagId),
  ]);

  if (!sourceTag || !targetTag) {
    return { success: false, error: "One or both tags could not be found" };
  }

  // 1. Add targetTagId to all posts that have sourceTagId (avoid duplicate with $addToSet)
  await Post.updateMany({ tags: sourceTagId }, { $addToSet: { tags: targetTagId } });

  // 2. Remove sourceTagId from all posts
  const result = await Post.updateMany({ tags: sourceTagId }, { $pull: { tags: sourceTagId } });

  // 3. Recalculate target post count
  const updatedCount = await Post.countDocuments({ tags: targetTagId });
  targetTag.postCount = updatedCount;
  await targetTag.save();

  // 4. Delete source tag
  await Tag.findByIdAndDelete(sourceTagId);

  // 5. Audit Log
  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Tag",
    resourceId: targetTag._id,
    details: {
      action: "merge_tags",
      source: sourceTag.name,
      target: targetTag.name,
      postsAffected: result.modifiedCount,
    },
  });

  revalidatePath("/admin/taxonomies");
  revalidatePath(`/tag/${targetTag.slug}`);

  return {
    success: true,
    message: `Merged '${sourceTag.name}' into '${targetTag.name}'. ${result.modifiedCount} article(s) updated.`,
  };
}
