import { connectDB } from "@/lib/db/connection";
import { User, Post } from "@/lib/db/models";
import { AuthorsManager } from "@/components/admin/authors/authors-manager";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  await connectDB();

  const rawAuthors = await User.find().sort({ role: 1, name: 1 }).lean();

  const authors = await Promise.all(
    rawAuthors.map(async (u: any) => ({
      ...JSON.parse(JSON.stringify(u)),
      _id: u._id.toString(),
      postCount: await Post.countDocuments({ author: u._id, status: "published" }),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Authors &amp; Editorial Contributors
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Maintain verified editorial personas, credentials, biographies, and author-page SEO schema.
        </p>
      </div>

      <AuthorsManager initialAuthors={authors} />
    </div>
  );
}
