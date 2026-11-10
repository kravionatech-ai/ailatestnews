import { connectDB } from "@/lib/db/connection";
import { Category, Post } from "@/lib/db/models";
import { VIRTUAL_TOPIC_DESKS } from "./topics";

export interface ResolvedCategoryPageData {
  category: {
    _id?: string;
    name: string;
    slug: string;
    description?: string;
    introHtml?: string;
    image?: string;
    seo?: Record<string, any>;
    faqs?: Array<{ question: string; answer: string }>;
    isVirtual?: boolean;
  };
  posts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function resolveCategoryOrTopic(
  slug: string,
  page = 1,
  limit = 9
): Promise<ResolvedCategoryPageData | null> {
  await connectDB();

  // 1. Check real MongoDB Category first (preserves 100% of existing URLs)
  const dbCat = await Category.findOne({ slug }).lean();

  if (dbCat) {
    const skip = (page - 1) * limit;
    const query = { status: "published", category: dbCat._id };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title slug excerpt coverImage coverImageAlt readingTime views featured publishedAt createdAt category author tags"
        )
        .populate("author", "name image slug bio")
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      category: JSON.parse(JSON.stringify(dbCat)),
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

  // 2. Fallback to Kraviona Virtual Editorial Topic Desk
  const virtualDesk = VIRTUAL_TOPIC_DESKS[slug];
  if (!virtualDesk) return null;

  const sourceCats = await Category.find({
    slug: { $in: virtualDesk.sourceCategorySlugs },
  })
    .select("_id")
    .lean();
  const catIds = sourceCats.map((c) => c._id);

  // Match either posts in the curated category desks OR keyword matches in title/excerpt
  const keywordRegexes = virtualDesk.keywords.map((kw) => new RegExp(kw, "i"));
  const orConditions: any[] = [];
  if (catIds.length > 0) {
    orConditions.push({ category: { $in: catIds } });
  }
  for (const rx of keywordRegexes) {
    orConditions.push({ title: rx }, { excerpt: rx });
  }

  const query =
    orConditions.length > 0
      ? { status: "published", $or: orConditions }
      : { status: "published" };

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title slug excerpt coverImage coverImageAlt readingTime views featured publishedAt createdAt category author tags"
      )
      .populate("author", "name image slug bio")
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .lean(),
    Post.countDocuments(query),
  ]);

  return {
    category: {
      name: virtualDesk.name,
      slug: virtualDesk.slug,
      description: virtualDesk.description,
      introHtml: virtualDesk.introHtml,
      isVirtual: true,
    },
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
