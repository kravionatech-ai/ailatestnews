import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export type CommentStatus = "pending" | "approved" | "spam" | "trash";

export interface IComment extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  author?: Types.ObjectId; // Registered user
  guestName?: string; // Guest commenter
  guestEmail?: string;
  guestWebsite?: string;
  content: string;
  contentHtml: string;
  parentId?: Types.ObjectId; // For nested/threaded comments
  status: CommentStatus;
  likes: number;
  ip?: string;
  userAgent?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
// Schema
// ──────────────────────────────────────

const CommentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required"],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    guestName: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    guestWebsite: { type: String },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: [5000, "Comment cannot exceed 5000 characters"],
    },
    contentHtml: {
      type: String,
      default: "",
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "spam", "trash"],
      default: "pending",
      index: true,
    },
    likes: { type: Number, default: 0, min: 0 },
    ip: { type: String, select: false },
    userAgent: { type: String, select: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
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

CommentSchema.index({ post: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ author: 1 });

// ──────────────────────────────────────
// Virtuals
// ──────────────────────────────────────

CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentId",
});

// ──────────────────────────────────────
// Export
// ──────────────────────────────────────

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
