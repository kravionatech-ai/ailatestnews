import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SeoSchema } from "@/lib/seo/schema";
import type { ISeoMetadata } from "@/lib/seo/types";

export interface IPageBlock {
  type: "hero" | "text" | "faq" | "cta" | "featured_posts" | "post_grid";
  title?: string;
  subtitle?: string;
  content?: string;
  settings?: Record<string, unknown>;
}

export interface IPage extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  blocks?: IPageBlock[];
  status: "published" | "draft" | "archived";
  template: "default" | "landing" | "directory" | "legal";
  seo: ISeoMetadata;
  showInMenu: boolean;
  showInFooter: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PageBlockSchema = new Schema<IPageBlock>(
  {
    type: {
      type: String,
      enum: ["hero", "text", "faq", "cta", "featured_posts", "post_grid"],
      required: true,
    },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    content: { type: String },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PageSchema = new Schema<IPage>(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: { type: String, maxlength: 300 },
    contentHtml: { type: String, default: "" },
    blocks: [PageBlockSchema],
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
    },
    template: {
      type: String,
      enum: ["default", "landing", "directory", "legal"],
      default: "default",
    },
    seo: { type: SeoSchema, default: () => ({}) },
    showInMenu: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Page: Model<IPage> =
  mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);

export default Page;
