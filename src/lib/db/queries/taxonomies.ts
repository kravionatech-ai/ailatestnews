import { connectDB } from "../connection";
import { Category, Tag, User, Post } from "../models";

export async function getAllCategories() {
  await connectDB();
  const categories = await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  // Populate dynamic post counts
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Post.countDocuments({
        category: cat._id,
        status: "published",
      });
      return { ...cat, postCount: count };
    })
  );

  return JSON.parse(JSON.stringify(categoriesWithCount));
}

export async function getCategoryBySlug(slug: string) {
  await connectDB();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return null;
  return JSON.parse(JSON.stringify(category));
}

export async function getAllTags() {
  await connectDB();
  const tags = await Tag.find().sort({ name: 1 }).lean();

  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
      const count = await Post.countDocuments({
        tags: tag._id,
        status: "published",
      });
      return { ...tag, postCount: count };
    })
  );

  return JSON.parse(JSON.stringify(tagsWithCount));
}

export async function getTagBySlug(slug: string) {
  await connectDB();
  const tag = await Tag.findOne({ slug }).lean();
  if (!tag) return null;
  return JSON.parse(JSON.stringify(tag));
}

export async function getAuthorBySlug(slug: string) {
  await connectDB();
  const author = await User.findOne({ slug, isActive: true })
    .select("name email image bio website socialLinks role slug")
    .lean();
  if (!author) return null;
  return JSON.parse(JSON.stringify(author));
}
