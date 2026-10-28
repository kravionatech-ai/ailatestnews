import { connectDB } from "../connection";
import { Comment } from "../models";

export async function getCommentsByPost(postId: string) {
  await connectDB();

  const comments = await Comment.find({
    post: postId,
    status: "approved",
  })
    .sort({ createdAt: 1 })
    .populate("author", "name image")
    .lean();

  const parsed = JSON.parse(JSON.stringify(comments));

  // Build nested threaded comments tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootComments: any[] = [];

  parsed.forEach((c: { _id: string; replies?: unknown[] }) => {
    c.replies = [];
    commentMap.set(c._id.toString(), c);
  });

  parsed.forEach((c: { _id: string; parentId?: string }) => {
    if (c.parentId && commentMap.has(c.parentId.toString())) {
      commentMap.get(c.parentId.toString()).replies.push(c);
    } else {
      rootComments.push(c);
    }
  });

  return rootComments;
}
