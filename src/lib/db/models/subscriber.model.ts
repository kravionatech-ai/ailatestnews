import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type SubscriberStatus = "pending" | "active" | "unsubscribed";

export interface ISubscriber extends Document {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  status: SubscriberStatus;
  confirmToken?: string;
  unsubscribeToken: string;
  subscribedAt?: Date;
  unsubscribedAt?: Date;
  source?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "unsubscribed"],
      default: "pending",
      index: true,
    },
    confirmToken: { type: String, select: false },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
    },
    subscribedAt: { type: Date },
    unsubscribedAt: { type: Date },
    source: { type: String }, // e.g., "footer", "popup", "post-inline"
    ip: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
