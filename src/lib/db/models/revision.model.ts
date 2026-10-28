import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IRevision extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  title: string;
  content: Record<string, unknown>;
  contentHtml: string;
  excerpt: string;
  coverImage?: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  author: Types.ObjectId; // Who made the revision
  version: number;
  changeNote?: string;
  createdAt: Date;
}

const RevisionSchema = new Schema<IRevision>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    contentHtml: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    coverImage: { type: String },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      focusKeyword: { type: String },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    changeNote: { type: String, maxlength: 300 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RevisionSchema.index({ post: 1, version: -1 });
RevisionSchema.index({ post: 1, createdAt: -1 });

const Revision: Model<IRevision> =
  mongoose.models.Revision || mongoose.model<IRevision>("Revision", RevisionSchema);

export default Revision;
