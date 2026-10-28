import { connectDB } from "../connection";
import { Post, Category, Tag, User } from "../models";
import { auth } from "@/lib/auth/auth";

export interface GetPostsOptions {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  search?: string;
  sort?: "latest" | "popular" | "oldest";
  status?: string | object;
  excludeIds?: string[];
}

/**
 * Public status filter: strictly "published" unless an authorized override is provided.
 * No drafts are ever exposed to the public.
 */
function getStatusFilter(overrideStatus?: string | object) {
  if (overrideStatus) return overrideStatus;
  return "published";
}

export async function getPublishedPosts({
  page = 1,
  limit = 9,
  categorySlug,
  tagSlug,
  authorSlug,
  search,
  sort = "latest",
  status,
  excludeIds = [],
}: GetPostsOptions = {}) {
  await connectDB();

  const statusFilter = getStatusFilter(status);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { status: statusFilter };

  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
    if (cat) query.category = cat._id;
  }

  if (tagSlug) {
    const tag = await Tag.findOne({ slug: tagSlug }).select("_id").lean();
    if (tag) query.tags = tag._id;
  }

  if (authorSlug) {
    const author = await User.findOne({ slug: authorSlug }).select("_id").lean();
    if (author) query.author = author._id;
  }

  if (search && search.trim()) {
    const rawSearch = search.trim();
    const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$or = [
      { title: { $regex: regex } },
      { excerpt: { $regex: regex } },
      { slug: { $regex: regex } },
    ];
  }

  let sortOption: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1 };
  if (sort === "popular") sortOption = { views: -1, publishedAt: -1 };
  if (sort === "oldest") sortOption = { publishedAt: 1 };

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("author", "name email image slug bio")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .lean(),
    Post.countDocuments(query),
  ]);

  return {
    posts: JSON.parse(JSON.stringify(posts)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getPostBySlug(slug: string, isPreview = false, previewToken?: string) {
  await connectDB();

  // Explicitly authenticated preview flow: allow draft only if session is active or valid token
  let allowDraft = false;
  if (isPreview) {
    try {
      const session = await auth();
      if (session?.user) {
        allowDraft = true;
      } else if (previewToken) {
        const match = await Post.findOne({ slug, previewToken }).select("_id").lean();
        if (match) allowDraft = true;
      }
    } catch {
      allowDraft = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { slug };
  if (!allowDraft) {
    query.status = "published";
  }

  const post = await Post.findOne(query)
    .populate("author", "name email image slug bio socialLinks")
    .populate("category", "name slug description")
    .populate("tags", "name slug")
    .lean();

  if (!post) return null;

  // Fetch 3 related posts based on category and tags (strictly published)
  const relatedPosts = await Post.find({
    _id: { $ne: post._id },
    status: "published",
    $or: [{ category: post.category }, { tags: { $in: post.tags } }],
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(3)
    .populate("author", "name image slug")
    .populate("category", "name slug")
    .select("title slug excerpt coverImage readingTime publishedAt views")
    .lean();

  return {
    post: JSON.parse(JSON.stringify(post)),
    relatedPosts: JSON.parse(JSON.stringify(relatedPosts)),
  };
}

export async function getFeaturedPosts(limit = 4, excludeIds: string[] = []) {
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    status: "published",
    featured: true,
  };

  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  const posts = await Post.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "name image slug")
    .populate("category", "name slug")
    .lean();

  return JSON.parse(JSON.stringify(posts));
}

export async function getTrendingPosts(limit = 5, excludeIds: string[] = []) {
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { status: "published" };
  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  const posts = await Post.find(query)
    .sort({ views: -1, publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("category", "name slug")
    .select("title slug readingTime views publishedAt createdAt")
    .lean();

  return JSON.parse(JSON.stringify(posts));
}

export async function getBreakingHeadlines(limit = 5) {
  await connectDB();

  const posts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .select("title slug publishedAt createdAt")
    .lean();

  return JSON.parse(JSON.stringify(posts));
}

export async function getAllPostSlugs() {
  await connectDB();
  const posts = await Post.find({ status: "published" }).select("slug updatedAt").lean();
  return JSON.parse(JSON.stringify(posts));
}
