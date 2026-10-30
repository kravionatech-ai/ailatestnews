import { cache } from "react";
import { connectDB } from "../connection";
import { Category, Tag, User, Post } from "../models";

export const getAllCategories = cache(async function getAllCategories() {
  try {
    await connectDB();
    const [categories, counts] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
      Post.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      counts.map((c: any) => [c._id ? c._id.toString() : "", c.count])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoriesWithCount = categories.map((cat: any) => ({
      ...cat,
      postCount: countMap.get(cat._id.toString()) || 0,
    }));

    return JSON.parse(JSON.stringify(categoriesWithCount));
  } catch (err) {
    console.warn("[getAllCategories] DB query fallback:", err);
    return [];
  }
});

export const getCategoryBySlug = cache(async function getCategoryBySlug(slug: string) {
  try {
    await connectDB();
    const category = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) return null;
    return JSON.parse(JSON.stringify(category));
  } catch (err) {
    console.warn("[getCategoryBySlug] DB query fallback:", err);
    return null;
  }
});

export const getAllTags = cache(async function getAllTags() {
  try {
    await connectDB();
    const [tags, counts] = await Promise.all([
      Tag.find().sort({ name: 1 }).lean(),
      Post.aggregate([
        { $match: { status: "published" } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      counts.map((c: any) => [c._id ? c._id.toString() : "", c.count])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tagsWithCount = tags.map((tag: any) => ({
      ...tag,
      postCount: countMap.get(tag._id.toString()) || 0,
    }));

    return JSON.parse(JSON.stringify(tagsWithCount));
  } catch (err) {
    console.warn("[getAllTags] DB query fallback:", err);
    return [];
  }
});

export const getTagBySlug = cache(async function getTagBySlug(slug: string) {
  try {
    await connectDB();
    const tag = await Tag.findOne({ slug }).lean();
    if (!tag) return null;
    return JSON.parse(JSON.stringify(tag));
  } catch (err) {
    console.warn("[getTagBySlug] DB query fallback:", err);
    return null;
  }
});

export const getAuthorBySlug = cache(async function getAuthorBySlug(slug: string) {
  try {
    await connectDB();
    const author = await User.findOne({ slug, isActive: true })
      .select("name email image bio website socialLinks role slug")
      .lean();
    if (!author) return null;
    return JSON.parse(JSON.stringify(author));
  } catch (err) {
    console.warn("[getAuthorBySlug] DB query fallback:", err);
    return null;
  }
});
