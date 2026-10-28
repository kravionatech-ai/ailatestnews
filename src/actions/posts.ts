"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Post, Revision, AuditLog, Category, Tag, ViewStat } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { calculateReadingTime, slugify } from "@/lib/utils";
import { triggerSeoRevalidation, pingIndexNow } from "@/lib/seo/revalidate-and-ping";
import { getSiteUrl } from "@/lib/seo/fallback";
import type { ISeoMetadata } from "@/lib/seo/types";

export async function createPostAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || title;
  const slug = slugify(rawSlug);
  const excerpt = (formData.get("excerpt") as string)?.trim();
  const contentHtml = (formData.get("contentHtml") as string) || "";
  const categoryId = formData.get("category") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
  const status = (formData.get("status") as string) || "draft";
  const coverImage = (formData.get("coverImage") as string) || "";
  const coverImageAlt = (formData.get("coverImageAlt") as string) || "";
  const coverImageCaption = (formData.get("coverImageCaption") as string) || "";
  const focalPointRaw = formData.get("focalPoint") as string;
  const focalPoint = focalPointRaw ? JSON.parse(focalPointRaw) : { x: 50, y: 50 };
  const relatedPostsRaw = formData.get("relatedPosts") as string;
  const relatedPosts = relatedPostsRaw ? JSON.parse(relatedPostsRaw) : [];
  const faqsRaw = formData.get("faqs") as string;
  const faqs = faqsRaw ? JSON.parse(faqsRaw) : [];
  const featured = formData.get("featured") === "true";
  const authorId = (formData.get("author") as string) || session.user.id;
  const scheduledAtRaw = formData.get("scheduledAt") as string;
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;

  // Full SEO payload support
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  // Fallback to separate fields if not passed as json
  if (!seoPayload.metaTitle) seoPayload.metaTitle = title;
  if (!seoPayload.metaDescription) seoPayload.metaDescription = excerpt;
  if (!seoPayload.focusKeyword) seoPayload.focusKeyword = "";
  if (!seoPayload.schemaType) seoPayload.schemaType = "NewsArticle";

  // If FAQs are provided, enrich schema with FAQPage
  if (faqs && faqs.length > 0 && !seoPayload.schemaOverrides) {
    seoPayload.schemaOverrides = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f: { question: string; answer: string }) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    }, null, 2);
  }

  if (!title || !slug || !excerpt || !categoryId) {
    return { success: false, error: "Title, slug, excerpt, and category are required." };
  }

  // Check slug uniqueness
  const existing = await Post.findOne({ slug });
  if (existing) {
    return { success: false, error: "A post with this slug already exists." };
  }

  const readingTime = calculateReadingTime(contentHtml);
  const publishedAt = status === "published" ? new Date() : undefined;

  const post = await Post.create({
    title,
    slug,
    excerpt,
    contentHtml,
    content: { html: contentHtml },
    category: categoryId,
    tags,
    status,
    coverImage,
    coverImageAlt,
    coverImageCaption,
    focalPoint,
    relatedPosts,
    faqs,
    readingTime,
    featured,
    publishedAt,
    scheduledAt,
    author: authorId,
    seo: seoPayload,
  });

  // Create initial revision
  await Revision.create({
    post: post._id,
    title: post.title,
    content: post.content,
    contentHtml: post.contentHtml,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    seo: {
      metaTitle: seoPayload.metaTitle,
      metaDescription: seoPayload.metaDescription,
      focusKeyword: seoPayload.focusKeyword,
    },
    author: session.user.id,
    version: 1,
    changeNote: "Initial draft created",
  });

  // Audit log
  await AuditLog.create({
    user: session.user.id,
    action: "create",
    resource: "Post",
    resourceId: post._id,
    details: { title: post.title, status: post.status, seoScore: seoPayload.seoScore },
  });

  // Fetch category slug for revalidation
  const cat = await Category.findById(categoryId).select("slug").lean();
  await triggerSeoRevalidation({
    path: `/blog/${post.slug}`,
    categorySlug: cat?.slug,
    forceIndexNow: status === "published",
  });

  return { success: true, post: JSON.parse(JSON.stringify(post)) };
}

export async function updatePostAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();

  const post = await Post.findById(id);
  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || title;
  const slug = slugify(rawSlug);
  const excerpt = (formData.get("excerpt") as string)?.trim();
  const contentHtml = (formData.get("contentHtml") as string) || "";
  const categoryId = formData.get("category") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
  const status = (formData.get("status") as string) || post.status;
  const coverImage = (formData.get("coverImage") as string) || post.coverImage;
  const coverImageAlt = (formData.get("coverImageAlt") as string) ?? post.coverImageAlt ?? "";
  const coverImageCaption = (formData.get("coverImageCaption") as string) ?? post.coverImageCaption ?? "";
  const focalPointRaw = formData.get("focalPoint") as string;
  const focalPoint = focalPointRaw ? JSON.parse(focalPointRaw) : post.focalPoint || { x: 50, y: 50 };
  const relatedPostsRaw = formData.get("relatedPosts") as string;
  const relatedPosts = relatedPostsRaw ? JSON.parse(relatedPostsRaw) : post.relatedPosts || [];
  const faqsRaw = formData.get("faqs") as string;
  const faqs = faqsRaw ? JSON.parse(faqsRaw) : post.faqs || [];
  const featured = formData.get("featured") === "true";
  const authorId = (formData.get("author") as string) || post.author;
  const scheduledAtRaw = formData.get("scheduledAt") as string;
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : post.scheduledAt;

  // Check if slug changed -> add old slug to redirectFrom (auto 301)
  const previousSlug = post.slug;
  const slugChanged = previousSlug && previousSlug !== slug;

  // Full SEO payload support
  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = post.seo || {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  if (slugChanged) {
    const redirects = seoPayload.redirectFrom || [];
    if (!redirects.includes(`/blog/${previousSlug}`)) {
      redirects.push(`/blog/${previousSlug}`);
    }
    seoPayload.redirectFrom = redirects;
  }

  // If FAQs provided, sync schema
  if (faqs && faqs.length > 0 && !seoPayload.schemaOverrides) {
    seoPayload.schemaOverrides = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f: { question: string; answer: string }) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    }, null, 2);
  }

  // Check if publishing for the first time
  let publishedAt = post.publishedAt;
  if (status === "published" && !post.publishedAt) {
    publishedAt = new Date();
  }

  const readingTime = calculateReadingTime(contentHtml);

  // Increment revision count
  const latestRevision = await Revision.findOne({ post: post._id }).sort({ version: -1 });
  const nextVersion = (latestRevision?.version || 0) + 1;

  await Revision.create({
    post: post._id,
    title,
    content: { html: contentHtml },
    contentHtml,
    excerpt,
    coverImage,
    seo: {
      metaTitle: seoPayload.metaTitle,
      metaDescription: seoPayload.metaDescription,
      focusKeyword: seoPayload.focusKeyword,
    },
    author: session.user.id,
    version: nextVersion,
    changeNote: (formData.get("changeNote") as string) || `Revision v${nextVersion}`,
  });

  post.title = title;
  post.slug = slug;
  post.excerpt = excerpt;
  post.contentHtml = contentHtml;
  post.content = { html: contentHtml };
  post.category = categoryId as unknown as typeof post.category;
  post.tags = tags;
  post.status = status as typeof post.status;
  post.coverImage = coverImage;
  post.coverImageAlt = coverImageAlt;
  post.coverImageCaption = coverImageCaption;
  post.focalPoint = focalPoint;
  post.relatedPosts = relatedPosts;
  post.faqs = faqs;
  post.readingTime = readingTime;
  post.featured = featured;
  post.author = authorId as unknown as typeof post.author;
  post.scheduledAt = scheduledAt;
  post.publishedAt = publishedAt;
  post.seo = seoPayload;

  await post.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Post",
    resourceId: post._id,
    details: { title: post.title, status: post.status, slugChanged },
  });

  // Revalidate & IndexNow ping
  const cat = await Category.findById(categoryId).select("slug").lean();
  await triggerSeoRevalidation({
    path: `/blog/${post.slug}`,
    categorySlug: cat?.slug,
    forceIndexNow: status === "published",
  });

  return { success: true, post: JSON.parse(JSON.stringify(post)) };
}

/**
 * Quick edit drawer update without opening full editor.
 */
export async function quickUpdatePostAction(
  id: string,
  data: {
    title?: string;
    slug?: string;
    status?: string;
    categoryId?: string;
    authorId?: string;
    noindex?: boolean;
    canonicalUrl?: string;
    featured?: boolean;
    publishedAt?: string;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  const post = await Post.findById(id);
  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (data.title) post.title = data.title.trim();
  if (data.slug) post.slug = slugify(data.slug.trim());
  if (data.status) {
    post.status = data.status as typeof post.status;
    if (data.status === "published" && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }
  if (data.categoryId) post.category = data.categoryId as unknown as typeof post.category;
  if (data.authorId) post.author = data.authorId as unknown as typeof post.author;
  if (data.publishedAt) post.publishedAt = new Date(data.publishedAt);
  if (typeof data.featured === "boolean") {
    post.featured = data.featured;
  }

  // Update SEO robots or canonical if passed
  post.seo = post.seo || {};
  if (typeof data.noindex === "boolean") {
    post.seo.robots = post.seo.robots || { index: true, follow: true };
    post.seo.robots.index = !data.noindex;
  }
  if (data.canonicalUrl !== undefined) {
    post.seo.canonicalUrl = data.canonicalUrl;
  }

  await post.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Post",
    resourceId: post._id,
    details: { title: post.title, quickEdit: true },
  });

  revalidatePath("/admin/posts");
  revalidatePath(`/blog/${post.slug}`);

  return { success: true, post: JSON.parse(JSON.stringify(post)) };
}

/**
 * Bulk action dispatcher for Posts Manager.
 */
export async function bulkActionPostsAction(
  ids: string[],
  action:
    | "publish"
    | "draft"
    | "archive"
    | "delete"
    | "category"
    | "addTag"
    | "removeTag"
    | "noindex"
    | "index"
    | "indexnow"
    | "feature"
    | "unfeature",
  payloadValue?: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();

  if (!ids || ids.length === 0) {
    return { success: false, error: "No posts selected" };
  }

  switch (action) {
    case "feature": {
      await Post.updateMany({ _id: { $in: ids } }, { $set: { featured: true } });
      break;
    }
    case "unfeature": {
      await Post.updateMany({ _id: { $in: ids } }, { $set: { featured: false } });
      break;
    }
    case "publish": {
      await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { status: "published", publishedAt: new Date() } }
      );
      break;
    }
    case "draft": {
      await Post.updateMany({ _id: { $in: ids } }, { $set: { status: "draft" } });
      break;
    }
    case "archive": {
      await Post.updateMany({ _id: { $in: ids } }, { $set: { status: "archived" } });
      break;
    }
    case "delete": {
      await Post.deleteMany({ _id: { $in: ids } });
      break;
    }
    case "category": {
      if (!payloadValue) return { success: false, error: "Category ID required" };
      await Post.updateMany({ _id: { $in: ids } }, { $set: { category: payloadValue } });
      break;
    }
    case "addTag": {
      if (!payloadValue) return { success: false, error: "Tag ID required" };
      await Post.updateMany({ _id: { $in: ids } }, { $addToSet: { tags: payloadValue } });
      break;
    }
    case "removeTag": {
      if (!payloadValue) return { success: false, error: "Tag ID required" };
      await Post.updateMany({ _id: { $in: ids } }, { $pull: { tags: payloadValue } });
      break;
    }
    case "noindex": {
      await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { "seo.robots.index": false } }
      );
      break;
    }
    case "index": {
      await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { "seo.robots.index": true } }
      );
      break;
    }
    case "indexnow": {
      const posts = await Post.find({ _id: { $in: ids }, status: "published" }).select("slug").lean();
      const siteUrl = getSiteUrl();
      const urls = posts.map((p) => `${siteUrl}/blog/${p.slug}`);
      if (urls.length > 0) {
        await pingIndexNow(urls, true);
        await Post.updateMany(
          { _id: { $in: posts.map((p) => p._id) } },
          { $set: { "seo.indexNowLastPing": new Date(), "seo.indexNowStatus": "submitted" } }
        );
      }
      break;
    }
  }

  await AuditLog.create({
    user: session.user.id,
    action: action === "delete" ? "delete" : "update",
    resource: "Post",
    details: { bulkAction: action, count: ids.length, payloadValue },
  });

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/posts");

  return { success: true };
}

/**
 * Fetch revision history for a post.
 */
export async function getPostRevisionsAction(postId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  const revisions = await Revision.find({ post: postId })
    .populate("author", "name email image")
    .sort({ version: -1 })
    .limit(20)
    .lean();

  return { success: true, revisions: JSON.parse(JSON.stringify(revisions)) };
}

/**
 * Restore a post to a previous revision.
 */
export async function restorePostRevisionAction(revisionId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  const revision = await Revision.findById(revisionId);
  if (!revision) {
    return { success: false, error: "Revision not found" };
  }

  const post = await Post.findById(revision.post);
  if (!post) {
    return { success: false, error: "Post not found" };
  }

  post.title = revision.title;
  post.content = revision.content;
  post.contentHtml = revision.contentHtml;
  post.excerpt = revision.excerpt;
  if (revision.coverImage) post.coverImage = revision.coverImage;
  if (revision.seo) {
    post.seo = {
      ...post.seo,
      metaTitle: revision.seo.metaTitle || post.seo?.metaTitle,
      metaDescription: revision.seo.metaDescription || post.seo?.metaDescription,
      focusKeyword: revision.seo.focusKeyword || post.seo?.focusKeyword,
    };
  }

  // Create a new revision noting the restore
  const latestRev = await Revision.findOne({ post: post._id }).sort({ version: -1 });
  const nextVersion = (latestRev?.version || 0) + 1;

  await Revision.create({
    post: post._id,
    title: post.title,
    content: post.content,
    contentHtml: post.contentHtml,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    seo: revision.seo,
    author: session.user.id,
    version: nextVersion,
    changeNote: `Restored to Revision v${revision.version}`,
  });

  await post.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Post",
    resourceId: post._id,
    details: { restoredFromVersion: revision.version },
  });

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${post._id}/edit`);
  revalidatePath(`/blog/${post.slug}`);

  return { success: true };
}

export async function deletePostAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();

  const post = await Post.findById(id);
  if (!post) {
    return { success: false, error: "Post not found" };
  }

  await Post.findByIdAndDelete(id);

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "Post",
    resourceId: id,
    details: { title: post.title },
  });

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/posts");

  return { success: true };
}

export async function bulkDeletePostsAction(ids: string[]) {
  return bulkActionPostsAction(ids, "delete");
}

export async function bulkUpdatePostStatusAction(ids: string[], status: "draft" | "published" | "archived") {
  const actionMap: Record<string, "draft" | "publish" | "archive"> = {
    published: "publish",
    archived: "archive",
    draft: "draft",
  };
  return bulkActionPostsAction(ids, actionMap[status] || "draft");
}

export async function incrementPostViews(id: string) {
  try {
    await connectDB();
    // The article page passes its slug, while older callers may pass an ID.
    let post = await Post.findOneAndUpdate({ slug: id }, { $inc: { views: 1 } }, { new: true }).select("_id").lean();
    if (!post && /^[a-f\d]{24}$/i.test(id)) {
      post = await Post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).select("_id").lean();
    }
    if (!post) return { success: false };

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    await ViewStat.findOneAndUpdate(
      { post: post._id, date },
      { $inc: { views: 1 }, $setOnInsert: { uniqueVisitors: 0 } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function duplicatePostAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original: any = await Post.findById(id).lean();
  if (!original) {
    return { success: false, error: "Post not found" };
  }

  const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
  const duplicate = await Post.create({
    ...original,
    _id: undefined,
    title: `${original.title} (Copy)`,
    slug: newSlug,
    status: "draft",
    publishedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/admin/posts");
  return { success: true, post: JSON.parse(JSON.stringify(duplicate)) };
}
