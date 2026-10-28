import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "login"
  | "logout"
  | "role_change"
  | "settings_update"
  | "export"
  | "import"
  | "bulk_action";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  action: AuditAction;
  resource: string; // e.g., "Post", "User", "Category"
  resourceId?: Types.ObjectId;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "create", "update", "delete", "publish", "unpublish",
        "login", "logout", "role_change", "settings_update",
        "export", "import", "bulk_action",
      ],
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    capped: { size: 50 * 1024 * 1024, max: 100000 }, // 50MB cap, 100k docs max
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
