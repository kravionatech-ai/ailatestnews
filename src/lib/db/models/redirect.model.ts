import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type RedirectType = 301 | 302;

export interface IRedirect extends Document {
  _id: Types.ObjectId;
  from: string;
  to: string;
  type: RedirectType;
  hits: number;
  isActive: boolean;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RedirectSchema = new Schema<IRedirect>(
  {
    from: {
      type: String,
      required: [true, "Source path is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    to: {
      type: String,
      required: [true, "Destination path is required"],
      trim: true,
    },
    type: {
      type: Number,
      enum: [301, 302],
      default: 301,
    },
    hits: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    note: { type: String, maxlength: 300 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RedirectSchema.index({ isActive: 1 });

const Redirect: Model<IRedirect> =
  mongoose.models.Redirect || mongoose.model<IRedirect>("Redirect", RedirectSchema);

export default Redirect;
