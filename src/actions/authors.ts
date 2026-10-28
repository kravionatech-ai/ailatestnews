"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { User, AuditLog, Redirect } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { slugify } from "@/lib/utils";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";
import type { ISeoMetadata } from "@/lib/seo/types";

export async function createAuthorAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const role = (formData.get("role") as string) || "author";
  const bio = (formData.get("bio") as string)?.trim() || "";
  const image = (formData.get("image") as string)?.trim() || "";
  const website = (formData.get("website") as string)?.trim() || "";

  const twitter = (formData.get("twitter") as string)?.trim();
  const github = (formData.get("github") as string)?.trim();
  const linkedin = (formData.get("linkedin") as string)?.trim();
  const youtube = (formData.get("youtube") as string)?.trim();

  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  if (!name || !email || !slug) {
    return { success: false, error: "Name, email, and slug are required" };
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) return { success: false, error: "A user with this email already exists" };

  const existingSlug = await User.findOne({ slug });
  if (existingSlug) return { success: false, error: "An author with this slug already exists" };

  if (!seoPayload.metaTitle) seoPayload.metaTitle = `${name} | AI Author`;
  if (!seoPayload.metaDescription) seoPayload.metaDescription = bio || `Technical AI dispatches and articles by ${name}.`;
  if (!seoPayload.schemaType) seoPayload.schemaType = "ProfilePage";

  const user = await User.create({
    name,
    email,
    slug,
    role,
    bio,
    image,
    website,
    socialLinks: { twitter, github, linkedin, youtube },
    seo: seoPayload,
    isActive: true,
  });

  await AuditLog.create({
    user: session.user.id,
    action: "create",
    resource: "User",
    resourceId: user._id,
    details: { name, slug, role },
  });

  await triggerSeoRevalidation({
    path: `/author/${slug}`,
    forceIndexNow: true,
  });

  revalidatePath("/admin/authors");
  revalidatePath(`/author/${slug}`);

  return { success: true, user: JSON.parse(JSON.stringify(user)) };
}

export async function updateAuthorAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();

  const user = await User.findById(id);
  if (!user) return { success: false, error: "Author not found" };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const rawSlug = (formData.get("slug") as string)?.trim() || name;
  const slug = slugify(rawSlug);
  const role = (formData.get("role") as string) || user.role;
  const bio = (formData.get("bio") as string)?.trim() || "";
  const image = (formData.get("image") as string)?.trim() || "";
  const website = (formData.get("website") as string)?.trim() || "";

  const twitter = (formData.get("twitter") as string)?.trim();
  const github = (formData.get("github") as string)?.trim();
  const linkedin = (formData.get("linkedin") as string)?.trim();
  const youtube = (formData.get("youtube") as string)?.trim();

  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = user.seo || {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  // Handle auto-301 redirect if slug changes
  const oldSlug = user.slug;
  if (oldSlug && oldSlug !== slug) {
    const existingRedirect = await Redirect.findOne({ from: `/author/${oldSlug}` });
    if (!existingRedirect) {
      await Redirect.create({
        from: `/author/${oldSlug}`,
        to: `/author/${slug}`,
        type: 301,
        createdBy: session.user.id,
        note: `Auto-generated when author '${user.name}' was renamed to '${slug}'`,
      });
    }
  }

  user.name = name;
  user.email = email;
  user.slug = slug;
  user.role = role as any;
  user.bio = bio;
  user.image = image;
  user.website = website;
  user.socialLinks = { twitter, github, linkedin, youtube };
  user.seo = seoPayload;

  await user.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "User",
    resourceId: user._id,
    details: { name, slug, role },
  });

  await triggerSeoRevalidation({
    path: `/author/${slug}`,
    forceIndexNow: true,
  });

  revalidatePath("/admin/authors");
  revalidatePath(`/author/${slug}`);
  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/author/${oldSlug}`);
  }

  return { success: true, user: JSON.parse(JSON.stringify(user)) };
}

export async function deleteAuthorAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();

  // Guard against deleting oneself
  if (session.user.id === id) {
    return { success: false, error: "You cannot delete your own administrative account." };
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) return { success: false, error: "Author not found" };

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "User",
    resourceId: user._id,
    details: { name: user.name, email: user.email },
  });

  revalidatePath("/admin/authors");
  return { success: true };
}
