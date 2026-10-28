import Link from "next/link";
import { Plus } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Post, Category, User } from "@/lib/db/models";
import { PostsManagerTable } from "@/components/admin/posts/posts-manager-table";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  await connectDB();

  const [posts, categories, authors] = await Promise.all([
    Post.find()
      .populate("category", "name slug")
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .lean(),
    Category.find().select("name slug").sort({ name: 1 }).lean(),
    User.find({ role: { $in: ["admin", "editor", "author"] } })
      .select("name email")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Articles &amp; Dispatches
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Publish, schedule, bulk-edit, and monitor real-time SEO rankings for all news dispatches.
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Compose Article
        </Link>
      </div>

      {/* Posts Manager Table */}
      <PostsManagerTable
        initialPosts={JSON.parse(JSON.stringify(posts))}
        categories={JSON.parse(JSON.stringify(categories))}
        authors={JSON.parse(JSON.stringify(authors))}
      />
    </div>
  );
}
