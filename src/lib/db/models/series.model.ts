import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ISeries extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  author: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema = new Schema<ISeries>(
  {
    title: {
      type: String,
      required: [true, "Series title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
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
    coverImage: { type: String },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SeriesSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "series",
});

const Series: Model<ISeries> =
  mongoose.models.Series || mongoose.model<ISeries>("Series", SeriesSchema);

export default Series;
