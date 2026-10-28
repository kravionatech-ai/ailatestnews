import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SeoSchema } from "@/lib/seo/schema";
import type { ISeoMetadata } from "@/lib/seo/types";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export type PostStatus = "draft" | "scheduled" | "published" | "archived";
export type SchemaType = "BlogPosting" | "NewsArticle" | "TechArticle" | "Review" | "HowTo";

export interface IPostFaq {
  question: string;
  answer: string;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: Record<string, unknown>; // Tiptap JSON
  contentHtml: string; // Sanitized HTML for SSR
  excerpt: string;
  coverImage?: string;
  coverImageBlurHash?: string;
  coverImageAlt?: string;
  coverImageCaption?: string;
  focalPoint?: { x: number; y: number };
  author: Types.ObjectId;
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  relatedPosts?: Types.ObjectId[];
  faqs?: IPostFaq[];
  series?: Types.ObjectId;
  seriesOrder?: number;
  status: PostStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  seo: ISeoMetadata;
  views: number;
  readingTime: number; // minutes
  featured: boolean;
  allowComments: boolean;
  locale: string;
  previewToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
// Schema
// ──────────────────────────────────────

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [200, "Slug cannot exceed 200 characters"],
    },
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
    contentHtml: {
      type: String,
      default: "",
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    coverImage: { type: String },
    coverImageBlurHash: { type: String },
    coverImageAlt: { type: String, default: "" },
    coverImageCaption: { type: String, default: "" },
    focalPoint: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    relatedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    series: {
      type: Schema.Types.ObjectId,
      ref: "Series",
    },
    seriesOrder: { type: Number },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, index: true },
    scheduledAt: { type: Date },
    seo: {
      type: SeoSchema,
      default: () => ({}),
    },
    views: { type: Number, default: 0, min: 0 },
    readingTime: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    locale: { type: String, default: "en" },
    previewToken: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ──────────────────────────────────────
// Indexes
// ──────────────────────────────────────

PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ category: 1, status: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ featured: 1, publishedAt: -1 });
PostSchema.index(
  { title: "text", excerpt: "text", contentHtml: "text" },
  {
    weights: { title: 10, excerpt: 5, contentHtml: 1 },
    name: "post_text_search",
  }
);

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
