import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_DESIGN_TOKENS, DesignTokens } from "./token-schema.test";

// ─────────────────────────────────────────────────────────────────────────────
// Publishing & Configuration State Machine Contract (PROJECT.md § Interface Contracts)
// ─────────────────────────────────────────────────────────────────────────────

export type SectionType =
  | "breaking-news"
  | "hero"
  | "model-launches"
  | "india-ai"
  | "ai-tools"
  | "guides"
  | "enterprise-ai"
  | "trending-latest"
  | "benchmark-leaderboard"
  | "model-calculator"
  | "newsletter"
  | "site-intro"
  | "faq"
  | "community-poll"
  | "model-releases";

export interface HomepageSectionConfig {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: string;
  limit?: number;
  categoryFilter?: string;
  customSettings?: Record<string, unknown>;
}

export interface IDesignConfigSnapshot {
  tokens: DesignTokens;
  homepageSections: HomepageSectionConfig[];
  version: number;
  publishedAt: Date;
  publishedBy: string;
  changeNote?: string;
}

export interface IDesignConfigDocument {
  draft: {
    tokens: DesignTokens;
    homepageSections: HomepageSectionConfig[];
    activeThemePreset?: string;
    updatedAt: Date;
    updatedBy: string;
  };
  published: {
    tokens: DesignTokens;
    homepageSections: HomepageSectionConfig[];
    activeThemePreset?: string;
    version: number;
    publishedAt: Date;
    publishedBy: string;
  };
  history: IDesignConfigSnapshot[];
  previewSecret: string;
}

// 15 Default Homepage Sections (Authoritative inventory from PROJECT.md R3/Feature Inventory)
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: "sec-breaking", type: "breaking-news", enabled: true, order: 1, title: "Breaking AI Wire" },
  { id: "sec-hero", type: "hero", enabled: true, order: 2, title: "Featured Frontier Developments" },
  { id: "sec-launches", type: "model-launches", enabled: true, order: 3, title: "Model Launches Desk" },
  { id: "sec-india-ai", type: "india-ai", enabled: true, order: 4, title: "India AI Mission & Compute" },
  { id: "sec-tools", type: "ai-tools", enabled: true, order: 5, title: "Developer Tools & Agent Runners" },
  { id: "sec-guides", type: "guides", enabled: true, order: 6, title: "Architectural Guides & Benchmarks" },
  { id: "sec-enterprise", type: "enterprise-ai", enabled: true, order: 7, title: "Enterprise AI Production" },
  { id: "sec-trending", type: "trending-latest", enabled: true, order: 8, title: "Trending & Most Read" },
  { id: "sec-benchmarks", type: "benchmark-leaderboard", enabled: true, order: 9, title: "AI Benchmark Leaderboard" },
  { id: "sec-calculator", type: "model-calculator", enabled: true, order: 10, title: "API Cost Calculator" },
  { id: "sec-newsletter", type: "newsletter", enabled: true, order: 11, title: "Daily AI Dispatch" },
  { id: "sec-intro", type: "site-intro", enabled: true, order: 12, title: "Editorial Charter & Principles" },
  { id: "sec-faq", type: "faq", enabled: true, order: 13, title: "Interactive Editorial FAQ" },
  { id: "sec-poll", type: "community-poll", enabled: true, order: 14, title: "Reader Benchmark Poll" },
  { id: "sec-timeline", type: "model-releases", enabled: true, order: 15, title: "AI Releases Timeline" },
];

// Pure, isolated state machine implementing publishing, draft save, preview, and rollback
export class PublishingWorkflowEngine {
  private config: IDesignConfigDocument;

  constructor(initialSecret = "test-preview-secret-key-12345") {
    const now = new Date("2026-11-09T00:00:00Z");
    this.config = {
      draft: {
        tokens: JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS)),
        homepageSections: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS)),
        updatedAt: now,
        updatedBy: "system",
      },
      published: {
        tokens: JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS)),
        homepageSections: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS)),
        version: 1,
        publishedAt: now,
        publishedBy: "system",
      },
      history: [
        {
          tokens: JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS)),
          homepageSections: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS)),
          version: 1,
          publishedAt: now,
          publishedBy: "system",
          changeNote: "Initial production baseline",
        },
      ],
      previewSecret: initialSecret,
    };
  }

  // Get configuration as viewed by public visitor (never sees drafts)
  public getPublicConfig() {
    return {
      tokens: JSON.parse(JSON.stringify(this.config.published.tokens)),
      homepageSections: JSON.parse(JSON.stringify(this.config.published.homepageSections)),
      version: this.config.published.version,
      publishedAt: this.config.published.publishedAt,
    };
  }

  // Get preview configuration (requires valid secret)
  public getPreviewConfig(secretToken: string) {
    if (!secretToken || secretToken !== this.config.previewSecret) {
      throw new Error("Unauthorized: Invalid or missing preview secret token");
    }
    return {
      tokens: JSON.parse(JSON.stringify(this.config.draft.tokens)),
      homepageSections: JSON.parse(JSON.stringify(this.config.draft.homepageSections)),
      isPreview: true,
      draftUpdatedAt: this.config.draft.updatedAt,
    };
  }

  // Save changes to draft
  public saveDraft(
    updater: (draft: { tokens: DesignTokens; homepageSections: HomepageSectionConfig[] }) => void,
    user = "editor@ainews.kraviona.com"
  ) {
    const draftClone = {
      tokens: JSON.parse(JSON.stringify(this.config.draft.tokens)),
      homepageSections: JSON.parse(JSON.stringify(this.config.draft.homepageSections)),
    };
    updater(draftClone);

    this.config.draft = {
      tokens: draftClone.tokens,
      homepageSections: draftClone.homepageSections,
      updatedAt: new Date(),
      updatedBy: user,
    };
  }

  // Publish current draft to production
  public publish(publishedBy = "admin@ainews.kraviona.com", changeNote?: string) {
    const nextVersion = this.config.published.version + 1;
    const now = new Date();

    const snapshot: IDesignConfigSnapshot = {
      tokens: JSON.parse(JSON.stringify(this.config.draft.tokens)),
      homepageSections: JSON.parse(JSON.stringify(this.config.draft.homepageSections)),
      version: nextVersion,
      publishedAt: now,
      publishedBy,
      changeNote,
    };

    // Promote draft to published
    this.config.published = {
      tokens: JSON.parse(JSON.stringify(this.config.draft.tokens)),
      homepageSections: JSON.parse(JSON.stringify(this.config.draft.homepageSections)),
      version: nextVersion,
      publishedAt: now,
      publishedBy,
    };

    // Append to immutable history
    this.config.history.push(snapshot);

    return {
      success: true,
      version: nextVersion,
      publishedAt: now,
    };
  }

  // Rollback to a specific historical version
  public rollback(targetVersion: number, rollbackBy = "admin@ainews.kraviona.com") {
    const targetSnapshot = this.config.history.find((s) => s.version === targetVersion);
    if (!targetSnapshot) {
      throw new Error(`Rollback failed: Version ${targetVersion} does not exist in history`);
    }

    const nextVersion = this.config.published.version + 1;
    const now = new Date();

    // Restored state
    const restoredTokens = JSON.parse(JSON.stringify(targetSnapshot.tokens));
    const restoredSections = JSON.parse(JSON.stringify(targetSnapshot.homepageSections));

    // Update published and draft
    this.config.published = {
      tokens: restoredTokens,
      homepageSections: restoredSections,
      version: nextVersion,
      publishedAt: now,
      publishedBy: rollbackBy,
    };

    this.config.draft = {
      tokens: JSON.parse(JSON.stringify(restoredTokens)),
      homepageSections: JSON.parse(JSON.stringify(restoredSections)),
      updatedAt: now,
      updatedBy: rollbackBy,
    };

    // Record rollback event snapshot in history
    this.config.history.push({
      tokens: restoredTokens,
      homepageSections: restoredSections,
      version: nextVersion,
      publishedAt: now,
      publishedBy: rollbackBy,
      changeNote: `Rolled back to version ${targetVersion}`,
    });

    return {
      success: true,
      restoredFromVersion: targetVersion,
      currentVersion: nextVersion,
    };
  }

  public getHistory() {
    return JSON.parse(JSON.stringify(this.config.history));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E Test Suite: Publishing Workflow & Rollback Logic (Tiers 1-4)
// ─────────────────────────────────────────────────────────────────────────────

describe("E2E Publishing Workflow & Version Control (Tiers 1-4)", () => {
  let engine: PublishingWorkflowEngine;

  beforeEach(() => {
    engine = new PublishingWorkflowEngine("test-secret-preview-token");
  });

  // ── Tier 1: Feature Coverage (Core Happy Paths) ──────────────────────────────

  describe("Tier 1: Core Draft, Preview, Publish & History Mechanics", () => {
    it("initializes with version 1, default tokens, and 15 homepage sections", () => {
      const publicConfig = engine.getPublicConfig();
      expect(publicConfig.version).toBe(1);
      expect(publicConfig.tokens.colors.primaryAccent).toBe("#10B981");
      expect(publicConfig.homepageSections.length).toBe(15);
      expect(publicConfig.homepageSections[0].type).toBe("breaking-news");
    });

    it("ensures draft changes are completely isolated from public visitors until published", () => {
      // Modify draft accent color
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryAccent = "#3B82F6"; // Change to Blue in draft
      });

      // Public visitor MUST still see default emerald
      const publicConfig = engine.getPublicConfig();
      expect(publicConfig.tokens.colors.primaryAccent).toBe("#10B981");

      // Draft preview MUST see the blue accent
      const previewConfig = engine.getPreviewConfig("test-secret-preview-token");
      expect(previewConfig.tokens.colors.primaryAccent).toBe("#3B82F6");
    });

    it("promotes draft to published state and increments version monotonically", () => {
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryAccent = "#F59E0B"; // Amber
      });

      const publishResult = engine.publish("lead-editor", "Promoted amber theme");
      expect(publishResult.success).toBe(true);
      expect(publishResult.version).toBe(2);

      // Now public visitor sees amber
      const publicConfig = engine.getPublicConfig();
      expect(publicConfig.version).toBe(2);
      expect(publicConfig.tokens.colors.primaryAccent).toBe("#F59E0B");
    });

    it("records full snapshot in version history on publish", () => {
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryDark = "#000000";
      });
      engine.publish("admin@ainews.kraviona.com", "Switched primary dark to pure black");

      const history = engine.getHistory();
      expect(history.length).toBe(2);
      expect(history[1].version).toBe(2);
      expect(history[1].publishedBy).toBe("admin@ainews.kraviona.com");
      expect(history[1].changeNote).toBe("Switched primary dark to pure black");
      expect(history[1].tokens.colors.primaryDark).toBe("#000000");
    });

    it("rolls back published settings to target historical version", () => {
      // Version 1 has primaryAccent = #10B981
      // Version 2 has primaryAccent = #EC4899 (Pink)
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryAccent = "#EC4899";
      });
      engine.publish("admin", "Pink release");
      expect(engine.getPublicConfig().tokens.colors.primaryAccent).toBe("#EC4899");

      // Rollback to Version 1
      const rollbackResult = engine.rollback(1, "admin-ops");
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.restoredFromVersion).toBe(1);
      expect(rollbackResult.currentVersion).toBe(3);

      // Public site is now back to #10B981
      const publicConfig = engine.getPublicConfig();
      expect(publicConfig.version).toBe(3);
      expect(publicConfig.tokens.colors.primaryAccent).toBe("#10B981");
    });
  });

  // ── Tier 2: Boundary & Corner Cases ────────────────────────────────────────

  describe("Tier 2: Boundary & Corner Cases (Errors & Immunity)", () => {
    it("rejects preview access when secret is missing, empty, or incorrect", () => {
      expect(() => engine.getPreviewConfig("")).toThrow(/Unauthorized/);
      expect(() => engine.getPreviewConfig("wrong-secret")).toThrow(/Unauthorized/);
      expect(() => engine.getPreviewConfig("attack-injection-key")).toThrow(/Unauthorized/);
    });

    it("rejects rollback to non-existent or negative version numbers", () => {
      expect(() => engine.rollback(999)).toThrow(/Version 999 does not exist/);
      expect(() => engine.rollback(0)).toThrow(/Version 0 does not exist/);
      expect(() => engine.rollback(-1)).toThrow(/Version -1 does not exist/);
    });

    it("preserves immutability of historical snapshots when subsequent edits occur", () => {
      const initialHistory = engine.getHistory();
      const v1SnapshotColor = initialHistory[0].tokens.colors.primaryAccent;

      // Make 5 consecutive draft modifications
      for (let i = 0; i < 5; i++) {
        engine.saveDraft((draft) => {
          draft.tokens.colors.primaryAccent = `#${i}0B981`;
        });
      }

      // Verify v1 snapshot in history was never mutated
      const freshHistory = engine.getHistory();
      expect(freshHistory[0].tokens.colors.primaryAccent).toBe(v1SnapshotColor);
    });

    it("guarantees monotonic version sequence under rapid publish cycles", () => {
      const versions: number[] = [engine.getPublicConfig().version];

      for (let i = 0; i < 5; i++) {
        engine.saveDraft((draft) => {
          draft.tokens.typography.baseFontSize = `${16 + i}px`;
        });
        const pub = engine.publish("test-user", `Iteration ${i}`);
        versions.push(pub.version);
      }

      expect(versions).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  // ── Tier 3: Cross-Feature Interactions (Sections & Theme Presets) ───────────

  describe("Tier 3: Cross-Feature Combinations (Sections & Themes)", () => {
    it("isolates section reordering and disabling in draft until published", () => {
      // Draft disables breaking news and moves model calculator to position 1
      engine.saveDraft((draft) => {
        const breaking = draft.homepageSections.find((s) => s.type === "breaking-news");
        if (breaking) breaking.enabled = false;

        const calculator = draft.homepageSections.find((s) => s.type === "model-calculator");
        if (calculator) calculator.order = 0;

        draft.homepageSections.sort((a, b) => a.order - b.order);
      });

      // Public site still has breaking-news enabled at position 1
      const publicSections = engine.getPublicConfig().homepageSections;
      expect(publicSections[0].type).toBe("breaking-news");
      expect(publicSections[0].enabled).toBe(true);

      // Publish the changes
      engine.publish("admin", "Reordered sections");

      // Now public site reflects the new section order
      const updatedPublic: HomepageSectionConfig[] = engine.getPublicConfig().homepageSections;
      expect(updatedPublic[0]!.type).toBe("model-calculator");
      const breakingUpdated = updatedPublic.find((s: HomepageSectionConfig) => s.type === "breaking-news");
      expect(breakingUpdated?.enabled).toBe(false);
    });

    it("handles complex multi-version rollback restoring both tokens and section configurations", () => {
      // v1: 15 sections, emerald accent
      // v2: disabled FAQ, blue accent
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryAccent = "#3B82F6";
        const faq = draft.homepageSections.find((s: HomepageSectionConfig) => s.type === "faq");
        if (faq) faq.enabled = false;
      });
      engine.publish("admin", "v2: disabled FAQ");

      // v3: disabled Poll, orange accent
      engine.saveDraft((draft) => {
        draft.tokens.colors.primaryAccent = "#F97316";
        const poll = draft.homepageSections.find((s: HomepageSectionConfig) => s.type === "community-poll");
        if (poll) poll.enabled = false;
      });
      engine.publish("admin", "v3: disabled Poll");

      // Rollback to v1
      engine.rollback(1, "admin-emergency-rollback");

      const publicConfig = engine.getPublicConfig();
      expect(publicConfig.tokens.colors.primaryAccent).toBe("#10B981");
      const faq = publicConfig.homepageSections.find((s: HomepageSectionConfig) => s.type === "faq");
      const poll = publicConfig.homepageSections.find((s: HomepageSectionConfig) => s.type === "community-poll");
      expect(faq?.enabled).toBe(true);
      expect(poll?.enabled).toBe(true);
    });
  });

  // ── Tier 4: Real-World Multi-Device Simulation ──────────────────────────────

  describe("Tier 4: Live Preview Mode & Cache Reset Invariance", () => {
    it("simulates preview iframe querying draft state without polluting client cache", () => {
      engine.saveDraft((draft) => {
        draft.tokens.layout.maxContentWidth = "1440px";
      });

      const previewView = engine.getPreviewConfig("test-secret-preview-token");
      expect(previewView.isPreview).toBe(true);
      expect(previewView.tokens.layout.maxContentWidth).toBe("1440px");

      // Simulating page reload without preview token receives standard 1280px
      const standardView = engine.getPublicConfig();
      expect(standardView.tokens.layout.maxContentWidth).toBe("1280px");
    });
  });
});
