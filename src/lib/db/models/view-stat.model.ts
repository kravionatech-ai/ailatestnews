import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IViewStat extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  date: Date; // Day-level granularity (midnight UTC)
  views: number;
  uniqueVisitors: number;
  referrers: Map<string, number>;
  countries: Map<string, number>;
  devices: Map<string, number>;
  readingDepth: {
    quarter: number; // Reached 25%
    half: number; // Reached 50%
    threeQuarter: number; // Reached 75%
    full: number; // Reached 100%
  };
}

const ViewStatSchema = new Schema<IViewStat>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    views: { type: Number, default: 0, min: 0 },
    uniqueVisitors: { type: Number, default: 0, min: 0 },
    referrers: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    countries: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    devices: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    readingDepth: {
      quarter: { type: Number, default: 0 },
      half: { type: Number, default: 0 },
      threeQuarter: { type: Number, default: 0 },
      full: { type: Number, default: 0 },
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index: one document per post per day
ViewStatSchema.index({ post: 1, date: 1 }, { unique: true });
ViewStatSchema.index({ date: -1 });

const ViewStat: Model<IViewStat> =
  mongoose.models.ViewStat || mongoose.model<IViewStat>("ViewStat", ViewStatSchema);

export default ViewStat;
