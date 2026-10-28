import { z } from "zod";

/**
 * Zod schemas for Post validation.
 * Used in both server actions and form validation.
 */

export const postSeoSchema = z.object({
  metaTitle: z
    .string()
    .max(70, "Meta title cannot exceed 70 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description cannot exceed 160 characters")
    .optional(),
  focusKeyword: z
    .string()
    .max(50, "Focus keyword cannot exceed 50 characters")
    .optional(),
  canonical: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  noindex: z.boolean().optional().default(false),
  ogImage: z.string().optional(),
  schemaType: z
    .enum(["BlogPosting", "NewsArticle", "TechArticle", "Review", "HowTo"])
    .optional()
    .default("BlogPosting"),
});

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  content: z.record(z.unknown()).optional().default({}),
  contentHtml: z.string().optional().default(""),
  excerpt: z
    .string()
    .min(1, "Excerpt is required")
    .max(500, "Excerpt cannot exceed 500 characters"),
  coverImage: z.string().optional(),
  coverImageBlurHash: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional().default([]),
  series: z.string().optional(),
  seriesOrder: z.number().int().positive().optional(),
  status: z
    .enum(["draft", "scheduled", "published", "archived"])
    .optional()
    .default("draft"),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  seo: postSeoSchema.optional(),
  featured: z.boolean().optional().default(false),
  allowComments: z.boolean().optional().default(true),
  locale: z.string().optional().default("en"),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1, "Post ID is required"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
