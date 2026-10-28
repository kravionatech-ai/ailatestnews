import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SeoSchema } from "@/lib/seo/schema";
import type { ISeoMetadata } from "@/lib/seo/types";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export interface ICategoryFaq {
  question: string;
  answer: string;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  introHtml?: string;
  image?: string;
  icon?: string;
  color?: string;
  parent?: Types.ObjectId;
  order: number;
  showInMenu: boolean;
  faqs?: ICategoryFaq[];
  seo: ISeoMetadata;
  postCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
// Schema
// ──────────────────────────────────────

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    introHtml: { type: String, default: "" },
    image: { type: String },
    icon: { type: String, default: "Folder" },
    color: { type: String, default: "#4f46e5" },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    order: { type: Number, default: 0 },
    showInMenu: { type: Boolean, default: true },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    seo: {
      type: SeoSchema,
      default: () => ({ schemaType: "CollectionPage" }),
    },
    postCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CategorySchema.index({ order: 1 });
CategorySchema.index({ parent: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
