import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { DesignConfig, IDesignConfigSnapshot, IDesignConfigDocument } from "@/lib/db/models/design-config.model";
import { middleware } from "@/middleware";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { DEFAULT_HOMEPAGE_SECTIONS } from "@/lib/design-tokens/sections";

// Mock next/cache and auth for server action isolation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth/auth", () => ({
  auth: () => mockAuth(),
}));

// Import server actions after mocking
import {
  saveDraftTokensAction,
  publishDesignConfigAction,
  rollbackDesignConfigAction,
  resetDraftToPublishedAction,
  getDesignConfigAction,
} from "@/actions/design-studio";

describe("Milestone 1 Adversarial Empirical Verification Suite", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. ROLE PERMISSION BYPASS & PRIVILEGE ESCALATION ATTACKS
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Role Permission Bypass & Server Action Security", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("rejects unauthenticated requests (null session) across all server actions", async () => {
      mockAuth.mockResolvedValue(null);

      const r1 = await saveDraftTokensAction(DEFAULT_DESIGN_TOKENS);
      expect(r1.success).toBe(false);
      expect(r1.error).toMatch(/Forbidden: Administrator privileges required/);

      const r2 = await publishDesignConfigAction("Unauthenticated publish attempt");
      expect(r2.success).toBe(false);
      expect(r2.error).toMatch(/Forbidden: Administrator privileges required/);

      const r3 = await rollbackDesignConfigAction(1);
      expect(r3.success).toBe(false);
      expect(r3.error).toMatch(/Forbidden: Administrator privileges required/);

      const r4 = await resetDraftToPublishedAction();
      expect(r4.success).toBe(false);
      expect(r4.error).toMatch(/Forbidden: Administrator privileges required/);

      const r5 = await getDesignConfigAction();
      expect(r5.success).toBe(false);
      expect(r5.error).toMatch(/Forbidden: Administrator privileges required/);
    });

    it("rejects unauthorized 'subscriber' role across all server actions", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "sub-1", email: "subscriber@kraviona.com", role: "subscriber" },
      });

      const r1 = await saveDraftTokensAction(DEFAULT_DESIGN_TOKENS);
      expect(r1.success).toBe(false);
      expect(r1.error).toMatch(/Forbidden: Administrator privileges required/);

      const r2 = await publishDesignConfigAction("Subscriber publish attempt");
      expect(r2.success).toBe(false);
      expect(r2.error).toMatch(/Forbidden: Administrator privileges required/);

      const r3 = await rollbackDesignConfigAction(1);
      expect(r3.success).toBe(false);
      expect(r3.error).toMatch(/Forbidden: Administrator privileges required/);
    });

    it("rejects unauthorized 'author' role across all server actions", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "author-1", email: "author@kraviona.com", role: "author" },
      });

      const r1 = await saveDraftTokensAction(DEFAULT_DESIGN_TOKENS);
      expect(r1.success).toBe(false);
      expect(r1.error).toMatch(/Forbidden: Administrator privileges required/);

      const r2 = await publishDesignConfigAction("Author publish attempt");
      expect(r2.success).toBe(false);
      expect(r2.error).toMatch(/Forbidden: Administrator privileges required/);

      const r3 = await rollbackDesignConfigAction(1);
      expect(r3.success).toBe(false);
      expect(r3.error).toMatch(/Forbidden: Administrator privileges required/);
    });

    it("rejects 'editor' role from design publishing and rollback actions", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "editor-1", email: "editor@kraviona.com", role: "editor" },
      });

      const r1 = await saveDraftTokensAction(DEFAULT_DESIGN_TOKENS);
      expect(r1.success).toBe(false);
      expect(r1.error).toMatch(/Forbidden: Administrator privileges required/);

      const r2 = await publishDesignConfigAction("Editor publish attempt");
      expect(r2.success).toBe(false);
      expect(r2.error).toMatch(/Forbidden: Administrator privileges required/);

      const r3 = await rollbackDesignConfigAction(1);
      expect(r3.success).toBe(false);
      expect(r3.error).toMatch(/Forbidden: Administrator privileges required/);
    });

    it("defends against adversarial role manipulation and type confusion attacks", async () => {
      const maliciousSessions = [
        { user: { role: "admin " } }, // trailing whitespace
        { user: { role: "ADMIN" } },  // uppercase
        { user: { role: ["admin"] } }, // array injection
        { user: { role: { admin: true } } }, // object injection
        { user: { role: "__proto__" } }, // prototype injection
        { user: { role: null } },
        { user: { role: undefined } },
        { user: {} }, // missing role
        { user: null },
      ];

      for (const sess of maliciousSessions) {
        mockAuth.mockResolvedValue(sess);
        const res = await publishDesignConfigAction("Privilege escalation test");
        expect(res.success, `Should reject session: ${JSON.stringify(sess)}`).toBe(false);
        expect(res.error).toMatch(/Forbidden: Administrator privileges required/);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. HISTORY BOUNDS & MONGODB $slice: 50 ENFORCEMENT
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. History Bounds ($slice: 50) & Storage Growth Invariance", () => {
    let TestModel: mongoose.Model<IDesignConfigDocument>;
    const tempCollectionName = "temp_adversarial_m1_history_stress";

    beforeAll(async () => {
      await connectDB();
      const schema = DesignConfig.schema;
      TestModel = mongoose.models.TestDesignConfigHistoryStress ||
        mongoose.model<IDesignConfigDocument>("TestDesignConfigHistoryStress", schema, tempCollectionName);

      // Clean prior run data if any
      try {
        await TestModel.collection.drop();
      } catch {
        // collection doesn't exist
      }
    });

    afterAll(async () => {
      try {
        if (TestModel) {
          await TestModel.collection.drop();
        }
      } catch {
        // cleanup error ignored
      }
    });

    it("empirically clamps history to 50 snapshots after 60 rapid consecutive publishes", async () => {
      const now = new Date();
      // 1. Create baseline document (Version 1)
      const initialDoc = await TestModel.create({
        draft: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          updatedAt: now,
          updatedBy: "system",
        },
        published: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          version: 1,
          publishedAt: now,
          publishedBy: "system",
        },
        history: [
          {
            tokens: DEFAULT_DESIGN_TOKENS,
            homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
            version: 1,
            publishedAt: now,
            publishedBy: "system",
            changeNote: "Initial system seed",
          },
        ],
        previewSecret: "test-secret-empirical-stress",
      });

      expect(initialDoc.published.version).toBe(1);
      expect(initialDoc.history).toHaveLength(1);

      // 2. Perform 60 consecutive publish operations using the exact MongoDB $push with $slice: 50
      for (let i = 2; i <= 61; i++) {
        const publishTime = new Date();
        const modifiedTokens = {
          ...DEFAULT_DESIGN_TOKENS,
          colors: {
            ...DEFAULT_DESIGN_TOKENS.colors,
            primaryDark: `#${i.toString(16).padStart(6, "0")}`,
          },
        };

        const snapshot: IDesignConfigSnapshot = {
          tokens: modifiedTokens,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          activeThemePreset: "premium-editorial",
          version: i,
          publishedAt: publishTime,
          publishedBy: `admin-bot-${i}`,
          changeNote: `Consecutive publish iteration ${i}`,
        };

        await TestModel.findOneAndUpdate(
          { _id: initialDoc._id },
          {
            $set: {
              published: {
                tokens: modifiedTokens,
                homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
                activeThemePreset: "premium-editorial",
                version: i,
                publishedAt: publishTime,
                publishedBy: `admin-bot-${i}`,
              },
              "draft.updatedAt": publishTime,
              "draft.updatedBy": `admin-bot-${i}`,
            },
            $push: {
              history: {
                $each: [snapshot],
                $position: 0, // newest snapshot at index 0
                $slice: 50,   // strictly cap at 50 most recent snapshots
              },
            },
          },
          { new: true }
        );
      }

      // 3. Retrieve final document directly from MongoDB
      const finalDoc = await TestModel.findById(initialDoc._id).lean();
      expect(finalDoc).toBeDefined();
      if (!finalDoc) throw new Error("Document not found");

      // Published version must be exactly 61
      expect(finalDoc.published.version).toBe(61);

      // CRITICAL CHECK: history array length MUST be exactly 50 (NOT 61!)
      expect(finalDoc.history.length).toBe(50);

      // CRITICAL CHECK: Index 0 must contain the latest snapshot (Version 61)
      expect(finalDoc.history[0]?.version).toBe(61);
      expect(finalDoc.history[0]?.changeNote).toBe("Consecutive publish iteration 61");

      // CRITICAL CHECK: Index 49 must contain Version 12 (Versions 1-11 were evicted by $slice: 50)
      expect(finalDoc.history[49]?.version).toBe(12);

      // Storage growth check: Ensure BSON document serialized size stays under 300KB
      const serializedBytes = Buffer.byteLength(JSON.stringify(finalDoc), "utf8");
      expect(serializedBytes).toBeLessThan(300 * 1024); // well under 300 KB
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ROLLBACK INTEGRITY & MULTI-VERSION RESTORATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Rollback Integrity & Sequential Rollbacks", () => {
    let RollbackModel: mongoose.Model<IDesignConfigDocument>;
    const tempCollectionName = "temp_adversarial_m1_rollback_test";

    beforeAll(async () => {
      await connectDB();
      const schema = DesignConfig.schema;
      RollbackModel = mongoose.models.TestDesignConfigRollback ||
        mongoose.model<IDesignConfigDocument>("TestDesignConfigRollback", schema, tempCollectionName);

      try {
        await RollbackModel.collection.drop();
      } catch {
        // ignore
      }
    });

    afterAll(async () => {
      try {
        if (RollbackModel) {
          await RollbackModel.collection.drop();
        }
      } catch {
        // ignore
      }
    });

    it("rolls back to an older version (v2 from v5) creating v6 with exact v2 payload and survives subsequent rollbacks", async () => {
      // Seed 5 versions with distinct payloads
      const doc = await RollbackModel.create({
        draft: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          updatedAt: new Date(),
          updatedBy: "system",
        },
        published: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          version: 1,
          publishedAt: new Date(),
          publishedBy: "system",
        },
        history: [
          {
            tokens: DEFAULT_DESIGN_TOKENS,
            homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
            version: 1,
            publishedAt: new Date(),
            publishedBy: "system",
            changeNote: "Version 1 default baseline",
          },
        ],
        previewSecret: "rollback-test-secret",
      });

      const versionColors = [
        "#10B981", // v1
        "#3B82F6", // v2 (Target rollback)
        "#EF4444", // v3
        "#8B5CF6", // v4
        "#F59E0B", // v5
      ];

      // Publish v2, v3, v4, v5
      for (let v = 2; v <= 5; v++) {
        const color = versionColors[v - 1] ?? "#10B981";
        const tokens = {
          ...DEFAULT_DESIGN_TOKENS,
          colors: { ...DEFAULT_DESIGN_TOKENS.colors, primaryAccent: color },
        };
        const snapshot: IDesignConfigSnapshot = {
          tokens,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          activeThemePreset: `preset-v${v}`,
          version: v,
          publishedAt: new Date(),
          publishedBy: "admin",
          changeNote: `Published version ${v}`,
        };

        await RollbackModel.findOneAndUpdate(
          { _id: doc._id },
          {
            $set: {
              published: {
                tokens,
                homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
                activeThemePreset: `preset-v${v}`,
                version: v,
                publishedAt: new Date(),
                publishedBy: "admin",
              },
              draft: {
                tokens,
                homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
                activeThemePreset: `preset-v${v}`,
                updatedAt: new Date(),
                updatedBy: "admin",
              },
            },
            $push: {
              history: {
                $each: [snapshot],
                $position: 0,
                $slice: 50,
              },
            },
          }
        );
      }

      // Verify currently at Version 5 with Amber color
      let current = await RollbackModel.findById(doc._id).lean();
      expect(current?.published.version).toBe(5);
      expect(current?.published.tokens.colors.primaryAccent).toBe("#F59E0B");

      // ── Step 1: Execute Rollback to Version 2 ──────────────────────────────
      const targetSnapshot = current?.history.find((s) => s.version === 2);
      expect(targetSnapshot).toBeDefined();
      if (!targetSnapshot) throw new Error("v2 snapshot missing");

      const nextVersion = (current?.published?.version || 0) + 1; // 6
      const rollbackSnapshot: IDesignConfigSnapshot = {
        tokens: targetSnapshot.tokens,
        homepageSections: targetSnapshot.homepageSections,
        activeThemePreset: targetSnapshot.activeThemePreset,
        version: nextVersion,
        publishedAt: new Date(),
        publishedBy: "admin-rollback",
        changeNote: "Rolled back to version 2",
      };

      await RollbackModel.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            published: {
              tokens: targetSnapshot.tokens,
              homepageSections: targetSnapshot.homepageSections,
              activeThemePreset: targetSnapshot.activeThemePreset,
              version: nextVersion,
              publishedAt: new Date(),
              publishedBy: "admin-rollback",
            },
            draft: {
              tokens: targetSnapshot.tokens,
              homepageSections: targetSnapshot.homepageSections,
              activeThemePreset: targetSnapshot.activeThemePreset,
              updatedAt: new Date(),
              updatedBy: "admin-rollback",
            },
          },
          $push: {
            history: {
              $each: [rollbackSnapshot],
              $position: 0,
              $slice: 50,
            },
          },
        }
      );

      // Verify state after Rollback to v2
      current = await RollbackModel.findById(doc._id).lean();
      expect(current?.published.version).toBe(6);
      expect(current?.published.tokens.colors.primaryAccent).toBe("#3B82F6"); // Exactly v2's blue!
      expect(current?.draft.tokens.colors.primaryAccent).toBe("#3B82F6");
      expect(current?.history[0]?.version).toBe(6);
      expect(current?.history[0]?.changeNote).toBe("Rolled back to version 2");

      // ── Step 2: Rollback to Version 4 from Version 6 ────────────────────────
      const v4Snapshot = current?.history.find((s) => s.version === 4);
      expect(v4Snapshot).toBeDefined();
      if (!v4Snapshot) throw new Error("v4 snapshot missing");

      const v7Version = (current?.published?.version || 0) + 1; // 7
      const v7Snapshot: IDesignConfigSnapshot = {
        tokens: v4Snapshot.tokens,
        homepageSections: v4Snapshot.homepageSections,
        activeThemePreset: v4Snapshot.activeThemePreset,
        version: v7Version,
        publishedAt: new Date(),
        publishedBy: "admin-rollback",
        changeNote: "Rolled back to version 4",
      };

      await RollbackModel.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            published: {
              tokens: v4Snapshot.tokens,
              homepageSections: v4Snapshot.homepageSections,
              activeThemePreset: v4Snapshot.activeThemePreset,
              version: v7Version,
              publishedAt: new Date(),
              publishedBy: "admin-rollback",
            },
          },
          $push: {
            history: {
              $each: [v7Snapshot],
              $position: 0,
              $slice: 50,
            },
          },
        }
      );

      current = await RollbackModel.findById(doc._id).lean();
      expect(current?.published.version).toBe(7);
      expect(current?.published.tokens.colors.primaryAccent).toBe("#8B5CF6"); // Exactly v4's purple!

      // ── Step 3: Rollback to Version 6 (Rolling back to a previous rollback) ──
      const v6Snapshot = current?.history.find((s) => s.version === 6);
      expect(v6Snapshot).toBeDefined();
      if (!v6Snapshot) throw new Error("v6 snapshot missing");

      const v8Version = (current?.published?.version || 0) + 1; // 8
      const v8Snapshot: IDesignConfigSnapshot = {
        tokens: v6Snapshot.tokens,
        homepageSections: v6Snapshot.homepageSections,
        activeThemePreset: v6Snapshot.activeThemePreset,
        version: v8Version,
        publishedAt: new Date(),
        publishedBy: "admin-rollback",
        changeNote: "Rolled back to version 6",
      };

      await RollbackModel.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            published: {
              tokens: v6Snapshot.tokens,
              homepageSections: v6Snapshot.homepageSections,
              activeThemePreset: v6Snapshot.activeThemePreset,
              version: v8Version,
              publishedAt: new Date(),
              publishedBy: "admin-rollback",
            },
          },
          $push: {
            history: {
              $each: [v8Snapshot],
              $position: 0,
              $slice: 50,
            },
          },
        }
      );

      current = await RollbackModel.findById(doc._id).lean();
      expect(current?.published.version).toBe(8);
      expect(current?.published.tokens.colors.primaryAccent).toBe("#3B82F6"); // Back to blue!
      expect(current?.history.map((s) => s.version)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. DRAFT ISOLATION & ZERO-BLEED GUARANTEE
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Draft Isolation (Unpublished Drafts Never Leak to Public)", () => {
    let DraftModel: mongoose.Model<IDesignConfigDocument>;
    const tempCollectionName = "temp_adversarial_m1_draft_isolation";

    beforeAll(async () => {
      await connectDB();
      const schema = DesignConfig.schema;
      DraftModel = mongoose.models.TestDesignConfigDraftIsolation ||
        mongoose.model<IDesignConfigDocument>("TestDesignConfigDraftIsolation", schema, tempCollectionName);

      try {
        await DraftModel.collection.drop();
      } catch {
        // ignore
      }
    });

    afterAll(async () => {
      try {
        if (DraftModel) {
          await DraftModel.collection.drop();
        }
      } catch {
        // ignore
      }
    });

    it("verifies that saving draft tokens leaves published tokens and version strictly untouched", async () => {
      const doc = await DraftModel.create({
        draft: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          updatedAt: new Date(),
          updatedBy: "system",
        },
        published: {
          tokens: DEFAULT_DESIGN_TOKENS,
          homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
          version: 1,
          publishedAt: new Date(),
          publishedBy: "system",
        },
        history: [],
        previewSecret: "preview-secret-isolation-test",
      });

      const initialPublishedColor = doc.published.tokens.colors.primaryAccent; // #10B981
      expect(initialPublishedColor).toBe("#10B981");

      // Save draft with a radical red color and disabled section
      const draftColor = "#EF4444";
      const modifiedSections = DEFAULT_HOMEPAGE_SECTIONS.map((sec, idx) => ({
        ...sec,
        enabled: idx !== 0, // disable first section
      }));

      await DraftModel.findOneAndUpdate(
        { _id: doc._id },
        {
          $set: {
            "draft.tokens.colors.primaryAccent": draftColor,
            "draft.homepageSections": modifiedSections,
            "draft.updatedAt": new Date(),
            "draft.updatedBy": "admin@kraviona.com",
          },
        },
        { new: true }
      );

      // Re-fetch document from DB
      const updatedDoc = await DraftModel.findById(doc._id).lean();
      expect(updatedDoc).toBeDefined();

      // DRAFT has been updated
      expect(updatedDoc?.draft.tokens.colors.primaryAccent).toBe("#EF4444");
      expect(updatedDoc?.draft.homepageSections[0]?.enabled).toBe(false);

      // CRITICAL CHECK: PUBLISHED tokens remain 100% UNMUTATED
      expect(updatedDoc?.published.tokens.colors.primaryAccent).toBe("#10B981");
      expect(updatedDoc?.published.homepageSections[0]?.enabled).toBe(true);
      expect(updatedDoc?.published.version).toBe(1); // Version NOT bumped on draft save
      expect(updatedDoc?.history).toHaveLength(0);   // History untouched
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. PREVIEW SECURITY & EDGE MIDDLEWARE ENFORCEMENT
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Preview Security & Edge Middleware Route Guards", () => {
    it("returns HTTP 401 JSON for unauthenticated requests to /api/admin/* endpoints", async () => {
      const adminEndpoints = [
        "https://ainews.kraviona.com/api/admin/media",
        "https://ainews.kraviona.com/api/admin/media/upload",
        "https://ainews.kraviona.com/api/admin/seo/ai-generate",
        "https://ainews.kraviona.com/api/admin/seo/indexnow",
        "https://ainews.kraviona.com/api/admin/analytics",
        "https://ainews.kraviona.com/api/admin/design-config/preview",
        "https://ainews.kraviona.com/api/admin/any-arbitrary-subroute",
      ];

      for (const url of adminEndpoints) {
        const req = new NextRequest(url);
        const res = middleware(req);

        expect(res.status, `Endpoint ${url} must return 401`).toBe(401);
        expect(res.headers.get("content-type")).toContain("application/json");

        const body = await res.json();
        expect(body).toEqual({ error: "Unauthorized: Missing authentication token" });
      }
    });

    it("rejects blank or whitespace-only authjs.session-token cookies with 401 JSON", async () => {
      const testCases = [
        "",
        "   ",
        "\t\n",
      ];

      for (const tokenVal of testCases) {
        const req = new NextRequest("https://ainews.kraviona.com/api/admin/media", {
          headers: {
            cookie: `authjs.session-token=${tokenVal}`,
          },
        });
        const res = middleware(req);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("Unauthorized: Missing authentication token");
      }
    });

    it("redirects unauthenticated requests to /admin UI with callbackUrl", () => {
      const req = new NextRequest("https://ainews.kraviona.com/admin/design-studio");
      const res = middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/auth/login?callbackUrl=%2Fadmin%2Fdesign-studio");
    });

    it("blocks unauthorized live preview attempts without valid secret or session", () => {
      // 1. Attacker requests preview without secret or session
      const req1 = new NextRequest("https://ainews.kraviona.com/?preview=draft");
      const res1 = middleware(req1);
      expect(res1.status).toBe(200);
      expect(res1.headers.get("X-Robots-Tag")).toBeNull();

      // 2. Attacker provides incorrect preview secret
      const req2 = new NextRequest("https://ainews.kraviona.com/?preview=draft&secret=invalid-secret-key");
      const res2 = middleware(req2);
      expect(res2.headers.get("X-Robots-Tag")).toBeNull();

      // 3. Attacker provides empty secret param
      const req3 = new NextRequest("https://ainews.kraviona.com/?preview=draft&secret=");
      const res3 = middleware(req3);
      expect(res2.headers.get("X-Robots-Tag")).toBeNull();
    });

    it("authorizes preview mode and sets noindex robots tag when valid preview secret matches env", () => {
      const originalSecret = process.env.DESIGN_PREVIEW_SECRET;
      process.env.DESIGN_PREVIEW_SECRET = "super-secret-preview-token-777";

      try {
        const req = new NextRequest("https://ainews.kraviona.com/?preview=draft&secret=super-secret-preview-token-777");
        const res = middleware(req);

        // Preview authorized: robots tag must prevent indexing
        expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
      } finally {
        process.env.DESIGN_PREVIEW_SECRET = originalSecret;
      }
    });

    it("strictly injects SAMEORIGIN framing and anti-clickjacking headers on reader and authenticated admin responses", () => {
      const testCases = [
        { url: "https://ainews.kraviona.com/", cookie: "" },
        { url: "https://ainews.kraviona.com/blog/sample-ai-post", cookie: "" },
        { url: "https://ainews.kraviona.com/admin/design-studio", cookie: "authjs.session-token=valid-token" },
      ];

      for (const { url, cookie } of testCases) {
        const req = new NextRequest(url, {
          headers: cookie ? { cookie } : {},
        });
        const res = middleware(req);

        expect(res.headers.get("X-Frame-Options"), `Failed for ${url}`).toBe("SAMEORIGIN");
        expect(res.headers.get("Content-Security-Policy")).toBe("frame-ancestors 'self'");
        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      }
    });
  });
});
