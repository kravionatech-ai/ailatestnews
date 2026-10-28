import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SeoSchema } from "@/lib/seo/schema";
import type { ISeoMetadata } from "@/lib/seo/types";

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  seo: ISeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      unique: true,
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
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    postCount: { type: Number, default: 0, min: 0 },
    seo: {
      type: SeoSchema,
      default: () => ({ schemaType: "CollectionPage" }),
    },
  },
  {
    timestamps: true,
  }
);

const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);

export default Tag;
