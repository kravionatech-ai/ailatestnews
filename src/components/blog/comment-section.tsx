"use client";

import { useState } from "react";
import { MessageSquare, Send, Reply, Heart, AlertCircle, CheckCircle2 } from "lucide-react";
import { addCommentAction, likeCommentAction } from "@/actions/comments";
import { formatDate } from "@/lib/utils";

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  likes: number;
  author?: {
    name: string;
    image?: string;
  };
  guestName?: string;
  replies?: CommentItem[];
}

export function CommentSection({
  postId,
  initialComments = [],
}: {
  postId: string;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("content", content);
    formData.append("guestName", guestName || "Anonymous Reader");
    if (replyTo) formData.append("parentId", replyTo);

    try {
      const res = await addCommentAction(formData);
      if (res.success && res.comment) {
        if (!replyTo) {
          setComments([res.comment, ...comments]);
        } else {
          // Add to nested replies
          setComments(
            comments.map((c) =>
              c._id === replyTo
                ? { ...c, replies: [...(c.replies || []), res.comment] }
                : c
            )
          );
        }
        setContent("");
        setReplyTo(null);
        setStatusMessage({ type: "success", text: "Comment posted successfully!" });
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to post comment" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    await likeCommentAction(commentId);
    setComments(
      comments.map((c) =>
        c._id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
      )
    );
  };

  return (
    <section className="mt-16 pt-12 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
        <h3 className="text-xl font-bold text-[var(--foreground)]">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-[var(--accent)] bg-[var(--accent-light)] px-3 py-1.5 rounded-lg mb-3">
            <span>Replying to thread</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="font-bold hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Your Name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3.5 py-2 text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>

        <textarea
          rows={3}
          required
          placeholder="Share your perspective, technical feedback, or questions..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3.5 text-sm outline-none focus:border-[var(--accent)] focus:bg-white transition-all"
        />

        {statusMessage && (
          <div
            className={`mt-2 flex items-center gap-2 text-xs p-2 rounded-lg ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Post Comment
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment._id} className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                <span className="font-semibold text-[var(--foreground)]">
                  {comment.author?.name || comment.guestName || "Reader"}
                </span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {comment.content}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <button
                  onClick={() => handleLike(comment._id)}
                  className="flex items-center gap-1 text-[var(--foreground-muted)] hover:text-rose-500 transition-colors"
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span>{comment.likes || 0}</span>
                </button>
                <button
                  onClick={() => setReplyTo(comment._id)}
                  className="flex items-center gap-1 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 space-y-3 border-l-2 border-[var(--border)] pl-4">
                {comment.replies.map((reply) => (
                  <div
                    key={reply._id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-1.5">
                      <span className="font-semibold text-[var(--foreground)]">
                        {reply.author?.name || reply.guestName || "Reader"}
                      </span>
                      <span>{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-sm text-[var(--foreground-muted)] py-6">
            No comments yet. Start the conversation!
          </p>
        )}
      </div>
    </section>
  );
}
