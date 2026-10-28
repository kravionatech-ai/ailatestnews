"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Comment, Post } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function addCommentAction(formData: FormData) {
  const postId = formData.get("postId") as string;
  const content = (formData.get("content") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  const guestName = (formData.get("guestName") as string)?.trim() || "Anonymous Reader";
  const guestEmail = (formData.get("guestEmail") as string)?.trim() || "";

  if (!postId || !content) {
    return { success: false, error: "Post and comment content are required." };
  }

  // Rate limit by IP or user
  const session = await auth();
  const rateLimitId = session?.user?.id || guestEmail || "guest_rate_limit";
  const rateCheck = await checkRateLimit(rateLimitId, { windowMs: 60_000, max: 5 });
  if (!rateCheck.allowed) {
    return { success: false, error: "Too many comments submitted. Please wait a minute." };
  }

  await connectDB();

  const post = await Post.findById(postId);
  if (!post || !post.allowComments) {
    return { success: false, error: "Comments are disabled for this article." };
  }

  const comment = await Comment.create({
    post: postId,
    content,
    contentHtml: `<p>${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
    parentId: parentId || undefined,
    author: session?.user ? session.user.id : undefined,
    guestName: !session?.user ? guestName : undefined,
    guestEmail: !session?.user ? guestEmail : undefined,
    status: "approved", // Auto-approve for seamless experience, or pending for strict moderation
  });

  revalidatePath(`/blog/${post.slug}`);
  return { success: true, comment: JSON.parse(JSON.stringify(comment)) };
}

export async function moderateCommentAction(commentId: string, status: "approved" | "spam" | "trash") {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  await connectDB();
  await Comment.findByIdAndUpdate(commentId, { status });

  revalidatePath("/admin/comments");
  return { success: true };
}

export async function likeCommentAction(commentId: string) {
  await connectDB();
  await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });
  return { success: true };
}
