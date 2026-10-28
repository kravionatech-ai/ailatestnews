import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IMedia extends Document {
  _id: Types.ObjectId;
  filename: string;
  originalName: string;
  url: string;
  publicId: string; // Cloudinary public_id
  format: string;
  width?: number;
  height?: number;
  size: number; // bytes
  alt?: string;
  caption?: string;
  folder: string;
  blurHash?: string;
  uploadedBy: Types.ObjectId;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    format: {
      type: String,
      required: true,
    },
    width: { type: Number },
    height: { type: Number },
    size: {
      type: Number,
      required: true,
    },
    alt: {
      type: String,
      maxlength: [300, "Alt text cannot exceed 300 characters"],
    },
    caption: {
      type: String,
      maxlength: [500, "Caption cannot exceed 500 characters"],
    },
    folder: {
      type: String,
      default: "general",
      index: true,
    },
    blurHash: { type: String },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    usageCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

MediaSchema.index({ folder: 1, createdAt: -1 });
MediaSchema.index({ filename: "text", alt: "text" });

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
