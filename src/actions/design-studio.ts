"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { DesignConfig, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { DesignTokensSchema } from "@/lib/design-tokens/schema";
import { HomepageSectionsSchema } from "@/lib/design-tokens/sections";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { DEFAULT_HOMEPAGE_SECTIONS } from "@/lib/design-tokens/sections";
import { invalidateDesignTokensCache, invalidateHomepageSectionsCache } from "@/lib/design-tokens/service";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import type { IDesignConfigSnapshot } from "@/lib/db/models/design-config.model";

interface AdminUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  slug?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Authorization Helper
// ─────────────────────────────────────────────────────────────────────────────
async function requireAdminSession(): Promise<{ session: unknown; user: AdminUser }> {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  const role = user?.role;
  if (!session || !user || (role !== "admin" && role !== "super_admin")) {
    throw new Error("Forbidden: Administrator privileges required.");
  }
  return { session, user };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getDesignConfigAction
// ─────────────────────────────────────────────────────────────────────────────
export async function getDesignConfigAction() {
  try {
    await requireAdminSession();
    await connectDB();

    let config = await DesignConfig.findOne().sort({ createdAt: -1 });

    // Seed default configuration if none exists in database
    if (!config) {
      const now = new Date();
      const initialSnapshot: IDesignConfigSnapshot = {
        tokens: DEFAULT_DESIGN_TOKENS,
        homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
        activeThemePreset: "premium-editorial",
        version: 1,
        publishedAt: now,
        publishedBy: "system",
        changeNote: "Initial system seed configuration",
      };

      config = await DesignConfig.create({
        draft: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          activeThemePreset: "premium-editorial",
          updatedAt: now,
          updatedBy: "system",
        },
        published: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          activeThemePreset: "premium-editorial",
          version: 1,
          publishedAt: now,
          publishedBy: "system",
        },
        history: [initialSnapshot],
        previewSecret: crypto.randomBytes(24).toString("hex"),
      });

      console.log("[DesignStudio] Seeded initial DesignConfig version 1");
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(config)),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load design config";
    console.error("[getDesignConfigAction Error]", err);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. saveDraftTokensAction
// ─────────────────────────────────────────────────────────────────────────────
export async function saveDraftTokensAction(
  draftTokens: unknown,
  homepageSections?: unknown,
  activeThemePreset?: string
) {
  try {
    const { user } = await requireAdminSession();
    await connectDB();

    // 1. Zod schema validation & injection defense
    let parsedTokens = DesignTokensSchema.safeParse(draftTokens);
    if (!parsedTokens.success) {
      // Support partial token merges with current draft/defaults
      const current = await DesignConfig.findOne().sort({ createdAt: -1 });
      const baseTokens = current?.draft?.tokens || DEFAULT_DESIGN_TOKENS;
      const mergedTokens = {
        ...baseTokens,
        ...(typeof draftTokens === "object" && draftTokens !== null ? draftTokens : {}),
        colors: {
          ...baseTokens.colors,
          ...((draftTokens as Record<string, unknown>)?.colors as Record<string, unknown> || {}),
        },
      };
      const retryResult = DesignTokensSchema.safeParse(mergedTokens);
      if (retryResult.success) {
        parsedTokens = retryResult;
      } else {
        return {
          success: false,
          error: "Validation failed: Invalid token format or forbidden characters detected",
          details: parsedTokens.error.format(),
        };
      }
    }

    let parsedSections: HomepageSectionConfig[] | undefined = undefined;
    if (homepageSections !== undefined) {
      const sectionsResult = HomepageSectionsSchema.safeParse(homepageSections);
      if (!sectionsResult.success) {
        return {
          success: false,
          error: "Validation failed: Invalid homepage sections format",
          details: sectionsResult.error.format(),
        };
      }
      parsedSections = sectionsResult.data;
    }

    // 2. Build MongoDB update payload
    const now = new Date();
    const updateSet: Record<string, unknown> = {
      "draft.tokens": parsedTokens.data,
      "draft.updatedAt": now,
      "draft.updatedBy": user.id || user.email || "admin",
    };

    if (parsedSections !== undefined) {
      updateSet["draft.homepageSections"] = parsedSections;
    }
    if (activeThemePreset) {
      updateSet["draft.activeThemePreset"] = activeThemePreset;
    }

    // 3. Atomic MongoDB Update
    const updated = await DesignConfig.findOneAndUpdate(
      {},
      { $set: updateSet },
      { new: true, upsert: true }
    );

    // 4. Record in AuditLog
    const userId = user.id || "";
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : new mongoose.Types.ObjectId();

    await AuditLog.create({
      user: userObjectId,
      action: "update",
      resource: "DesignConfig",
      resourceId: updated?._id,
      details: {
        operation: "save_draft",
        activeThemePreset,
        updatedAt: now,
      },
    });

    // Revalidate Design Studio UI only (do NOT bust public CDN cache for drafts)
    revalidatePath("/admin/design-studio");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated?.draft)),
      message: "Draft saved successfully. Visible in live preview.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save draft";
    console.error("[saveDraftTokensAction Error]", err);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. publishDesignConfigAction
// ─────────────────────────────────────────────────────────────────────────────
export async function publishDesignConfigAction(changeNote?: string) {
  try {
    const { user } = await requireAdminSession();
    await connectDB();

    const current = await DesignConfig.findOne().sort({ createdAt: -1 });
    if (!current || !current.draft) {
      return { success: false, error: "No design draft found to publish." };
    }

    // Validate that current draft is fully schema compliant before promoting
    const parsedTokens = DesignTokensSchema.safeParse(current.draft.tokens);
    if (!parsedTokens.success) {
      return {
        success: false,
        error: "Cannot publish draft: Token schema validation failed",
        details: parsedTokens.error.format(),
      };
    }

    const nextVersion = (current.published?.version || 0) + 1;
    const now = new Date();
    const publisher = user.id || user.email || "admin";

    // Create immutable snapshot for version history
    const snapshot: IDesignConfigSnapshot = {
      tokens: parsedTokens.data,
      homepageSections: current.draft.homepageSections || DEFAULT_HOMEPAGE_SECTIONS,
      activeThemePreset: current.draft.activeThemePreset || "premium-editorial",
      version: nextVersion,
      publishedAt: now,
      publishedBy: publisher,
      changeNote: changeNote?.trim() || `Published version ${nextVersion}`,
    };

    // Promote draft to published and record snapshot in history (keep up to 50 most recent)
    const updated = await DesignConfig.findOneAndUpdate(
      { _id: current._id },
      {
        $set: {
          published: {
            tokens: parsedTokens.data,
            homepageSections: current.draft.homepageSections || DEFAULT_HOMEPAGE_SECTIONS,
            activeThemePreset: current.draft.activeThemePreset || "premium-editorial",
            version: nextVersion,
            publishedAt: now,
            publishedBy: publisher,
          },
          "draft.updatedAt": now,
          "draft.updatedBy": publisher,
        },
        $push: {
          history: {
            $each: [snapshot],
            $position: 0, // newest snapshot at index 0
            $slice: 50,    // keep 50 most recent snapshots
          },
        },
      },
      { new: true }
    );

    // Invalidate in-memory tokens and homepage sections cache
    invalidateDesignTokensCache();
    invalidateHomepageSectionsCache();

    // Record publication in AuditLog
    const userId = user.id || "";
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : new mongoose.Types.ObjectId();

    await AuditLog.create({
      user: userObjectId,
      action: "publish",
      resource: "DesignConfig",
      resourceId: updated?._id,
      details: {
        version: nextVersion,
        changeNote: snapshot.changeNote,
      },
    });

    // Invalidate public caches across the entire site
    revalidatePath("/", "layout");
    revalidatePath("/admin/design-studio");

    return {
      success: true,
      version: nextVersion,
      data: JSON.parse(JSON.stringify(updated?.published)),
      message: `Version ${nextVersion} published successfully to production.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to publish design config";
    console.error("[publishDesignConfigAction Error]", err);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. rollbackDesignConfigAction
// ─────────────────────────────────────────────────────────────────────────────
export async function rollbackDesignConfigAction(versionNumber: number) {
  try {
    const { user } = await requireAdminSession();
    await connectDB();

    const current = await DesignConfig.findOne().sort({ createdAt: -1 });
    if (!current || !Array.isArray(current.history) || current.history.length === 0) {
      return { success: false, error: "No historical snapshots available for rollback." };
    }

    // Locate target version snapshot in history
    const targetSnapshot = current.history.find(
      (s: IDesignConfigSnapshot) => s.version === versionNumber
    );

    if (!targetSnapshot) {
      return {
        success: false,
        error: `Rollback target version ${versionNumber} not found in history snapshots.`,
      };
    }

    const nextVersion = (current.published?.version || 0) + 1;
    const now = new Date();
    const rollbackOperator = user.id || user.email || "admin";

    // New snapshot representing the rollback deployment
    const rollbackSnapshot: IDesignConfigSnapshot = {
      tokens: targetSnapshot.tokens,
      homepageSections: targetSnapshot.homepageSections,
      activeThemePreset: targetSnapshot.activeThemePreset,
      version: nextVersion,
      publishedAt: now,
      publishedBy: rollbackOperator,
      changeNote: `Rolled back to version ${versionNumber}`,
    };

    // Atomically restore published and draft states to target snapshot
    const updated = await DesignConfig.findOneAndUpdate(
      { _id: current._id },
      {
        $set: {
          published: {
            tokens: targetSnapshot.tokens,
            homepageSections: targetSnapshot.homepageSections,
            activeThemePreset: targetSnapshot.activeThemePreset,
            version: nextVersion,
            publishedAt: now,
            publishedBy: rollbackOperator,
          },
          draft: {
            tokens: targetSnapshot.tokens,
            homepageSections: targetSnapshot.homepageSections,
            activeThemePreset: targetSnapshot.activeThemePreset,
            updatedAt: now,
            updatedBy: rollbackOperator,
          },
        },
        $push: {
          history: {
            $each: [rollbackSnapshot],
            $position: 0,
            $slice: 50,
          },
        },
      },
      { new: true }
    );

    // Invalidate in-memory tokens and homepage sections cache
    invalidateDesignTokensCache();
    invalidateHomepageSectionsCache();

    // Record rollback in AuditLog
    const userId = user.id || "";
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : new mongoose.Types.ObjectId();

    await AuditLog.create({
      user: userObjectId,
      action: "update",
      resource: "DesignConfig",
      resourceId: updated?._id,
      details: {
        operation: "rollback",
        restoredFromVersion: versionNumber,
        newVersion: nextVersion,
      },
    });

    // Invalidate public caches across the entire site
    revalidatePath("/", "layout");
    revalidatePath("/admin/design-studio");

    return {
      success: true,
      restoredFromVersion: versionNumber,
      currentVersion: nextVersion,
      data: JSON.parse(JSON.stringify(updated?.published)),
      message: `Successfully rolled back to version ${versionNumber}. Published as version ${nextVersion}.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to execute rollback";
    console.error("[rollbackDesignConfigAction Error]", err);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. resetDraftToPublishedAction (Helper: Discard Unsaved Draft Changes)
// ─────────────────────────────────────────────────────────────────────────────
export async function resetDraftToPublishedAction() {
  try {
    const { user } = await requireAdminSession();
    await connectDB();

    const current = await DesignConfig.findOne().sort({ createdAt: -1 });
    if (!current || !current.published) {
      return { success: false, error: "No published design configuration found." };
    }

    const now = new Date();
    const updated = await DesignConfig.findOneAndUpdate(
      { _id: current._id },
      {
        $set: {
          draft: {
            tokens: current.published.tokens,
            homepageSections: current.published.homepageSections,
            activeThemePreset: current.published.activeThemePreset,
            updatedAt: now,
            updatedBy: user.id || user.email || "admin",
          },
        },
      },
      { new: true }
    );

    revalidatePath("/admin/design-studio");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated?.draft)),
      message: "Draft reset to current published production settings.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to reset draft";
    return { success: false, error: errorMsg };
  }
}
