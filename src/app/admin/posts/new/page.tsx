import { connectDB } from "@/lib/db/connection";
import { Category, Tag, User, Post } from "@/lib/db/models";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await connectDB();
  const [categories, tags, authors, publishedPosts] = await Promise.all([
    Category.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 })
      .lean(),
    Tag.find().select("_id name slug").sort({ name: 1 }).lean(),
    User.find({ role: { $in: ["admin", "editor", "author"] } })
      .select("_id name")
      .sort({ name: 1 })
      .lean(),
    Post.find({ status: "published" })
      .select("_id title slug")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return (
    <PostEditor
      categories={JSON.parse(JSON.stringify(categories))}
      allTags={JSON.parse(JSON.stringify(tags))}
      allAuthors={JSON.parse(JSON.stringify(authors))}
      publishedPosts={JSON.parse(JSON.stringify(publishedPosts))}
    />
  );
}
