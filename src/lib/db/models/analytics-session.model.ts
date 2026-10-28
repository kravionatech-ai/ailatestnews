import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IAnalyticsSession extends Document {
  visitorHash: string; // SHA-256 salted hash (no IP or PII stored)
  post: Types.ObjectId;
  date: Date; // Midnight UTC
  lastSeen: Date;
  createdAt: Date;
}

const AnalyticsSessionSchema = new Schema<IAnalyticsSession>(
  {
    visitorHash: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    date: { type: Date, required: true },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index: one session entry per visitor hash per post per UTC day
AnalyticsSessionSchema.index({ visitorHash: 1, post: 1, date: 1 }, { unique: true });
// TTL index: auto-purged after 48 hours to preserve database storage and privacy
AnalyticsSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

const AnalyticsSession: Model<IAnalyticsSession> =
  mongoose.models.AnalyticsSession ||
  mongoose.model<IAnalyticsSession>("AnalyticsSession", AnalyticsSessionSchema);

export default AnalyticsSession;
