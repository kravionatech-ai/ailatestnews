import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { SeoSchema } from "@/lib/seo/schema";
import type { ISeoMetadata } from "@/lib/seo/types";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export type UserRole = "admin" | "editor" | "author" | "subscriber";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  password?: string;
  role: UserRole;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    youtube?: string;
  };
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  slug: string;
  seo: ISeoMetadata;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
// Schema
// ──────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    emailVerified: { type: Date },
    image: { type: String },
    password: {
      type: String,
      select: false, // Never return password by default
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "editor", "author", "subscriber"],
      default: "subscriber",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    website: { type: String },
    socialLinks: {
      twitter: { type: String },
      github: { type: String },
      linkedin: { type: String },
      youtube: { type: String },
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    seo: {
      type: SeoSchema,
      default: () => ({ schemaType: "ProfilePage" }),
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
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

UserSchema.index({ role: 1 });

// ──────────────────────────────────────
// Pre-save: generate slug from name
// ──────────────────────────────────────

UserSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

// ──────────────────────────────────────
// Export (avoid re-compilation in dev)
// ──────────────────────────────────────

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
