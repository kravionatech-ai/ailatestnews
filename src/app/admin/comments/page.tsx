import { CheckCircle2, ShieldAlert, Trash2, MessageSquare } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Comment } from "@/lib/db/models";
import { formatDate } from "@/lib/utils";
import { moderateCommentAction } from "@/actions/comments";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  await connectDB();

  const comments = await Comment.find()
    .sort({ createdAt: -1 })
    .populate("post", "title slug")
    .populate("author", "name email")
    .lean();

  async function handleModerate(formData: FormData) {
    "use server";
    const commentId = formData.get("commentId") as string;
    const status = formData.get("status") as "approved" | "spam" | "trash";
    await moderateCommentAction(commentId, status);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Discussion Moderation
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Review community perspectives, approve pending entries, and eliminate spam.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-2xs divide-y divide-[var(--border)] overflow-hidden">
        {comments.map((comment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const author = comment.author as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const post = comment.post as any;

          return (
            <div key={comment._id.toString()} className="p-5 space-y-3 hover:bg-[var(--background-secondary)] transition-colors">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--foreground)]">
                    {author?.name || comment.guestName || "Anonymous Reader"}
                  </span>
                  <span className="text-[var(--foreground-muted)]">•</span>
                  <span className="text-[var(--foreground-muted)]">
                    {formatDate(comment.createdAt)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      comment.status === "approved"
                        ? "bg-green-50 text-green-700"
                        : comment.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {comment.status !== "approved" && (
                    <form action={handleModerate}>
                      <input type="hidden" name="commentId" value={comment._id.toString()} />
                      <input type="hidden" name="status" value="approved" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    </form>
                  )}

                  {comment.status !== "spam" && (
                    <form action={handleModerate}>
                      <input type="hidden" name="commentId" value={comment._id.toString()} />
                      <input type="hidden" name="status" value="spam" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> Spam
                      </button>
                    </form>
                  )}

                  <form action={handleModerate}>
                    <input type="hidden" name="commentId" value={comment._id.toString()} />
                    <input type="hidden" name="status" value="trash" />
                    <button
                      type="submit"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                {comment.content}
              </p>

              {post && (
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  On article:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {post.title}
                  </span>
                </p>
              )}
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="p-12 text-center text-xs text-[var(--foreground-muted)]">
            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            No comments submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}
