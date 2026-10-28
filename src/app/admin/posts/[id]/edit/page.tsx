import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connection";
import { Post, Category, Tag, User } from "@/lib/db/models";
import { PostEditor } from "@/components/admin/post-editor";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  await connectDB();

  const [post, categories, tags, authors, publishedPosts] = await Promise.all([
    Post.findById(id).lean(),
    Category.find({ isActive: true }).select("_id name").sort({ name: 1 }).lean(),
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

  if (!post) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = post as any;

  const initialData = {
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    contentHtml: p.contentHtml || "",
    category: p.category ? p.category.toString() : "",
    tags: p.tags?.map((t: unknown) => String(t)) || [],
    author: p.author ? p.author.toString() : "",
    status: p.status,
    scheduledAt: p.scheduledAt,
    coverImage: p.coverImage || "",
    coverImageAlt: p.coverImageAlt || "",
    coverImageCaption: p.coverImageCaption || "",
    focalPoint: p.focalPoint || { x: 50, y: 50 },
    relatedPosts: p.relatedPosts?.map((r: unknown) => String(r)) || [],
    faqs: p.faqs || [],
    featured: Boolean(p.featured),
    seo: p.seo || {
      metaTitle: p.title,
      metaDescription: p.excerpt,
      focusKeyword: "",
      schemaType: "NewsArticle",
    },
  };

  return (
    <PostEditor
      initialData={initialData}
      categories={JSON.parse(JSON.stringify(categories))}
      allTags={JSON.parse(JSON.stringify(tags))}
      allAuthors={JSON.parse(JSON.stringify(authors))}
      publishedPosts={JSON.parse(JSON.stringify(publishedPosts))}
    />
  );
}
