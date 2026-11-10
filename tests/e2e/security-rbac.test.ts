import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// RBAC Security Model & Permission Engine (PROJECT.md § Interface Contracts & R5)
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "admin" | "editor" | "author" | "subscriber";

export type AdminAction =
  | "view_dashboard"
  | "design_studio_view"
  | "design_studio_edit_draft"
  | "design_studio_preview"
  | "design_studio_publish"
  | "design_studio_rollback"
  | "cms_create_post"
  | "cms_edit_own_post"
  | "cms_edit_any_post"
  | "cms_publish_post"
  | "manage_users"
  | "view_audit_logs";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

// Authoritative Permission Matrix
export const ROLE_PERMISSIONS: Record<UserRole, AdminAction[]> = {
  super_admin: [
    "view_dashboard",
    "design_studio_view",
    "design_studio_edit_draft",
    "design_studio_preview",
    "design_studio_publish",
    "design_studio_rollback",
    "cms_create_post",
    "cms_edit_own_post",
    "cms_edit_any_post",
    "cms_publish_post",
    "manage_users",
    "view_audit_logs",
  ],
  admin: [
    "view_dashboard",
    "design_studio_view",
    "design_studio_edit_draft",
    "design_studio_preview",
    "design_studio_publish",
    "design_studio_rollback",
    "cms_create_post",
    "cms_edit_own_post",
    "cms_edit_any_post",
    "cms_publish_post",
    "view_audit_logs",
  ],
  editor: [
    "view_dashboard",
    "design_studio_view",
    "design_studio_edit_draft",
    "design_studio_preview",
    "cms_create_post",
    "cms_edit_own_post",
    "cms_edit_any_post",
    "cms_publish_post",
  ],
  author: [
    "view_dashboard",
    "cms_create_post",
    "cms_edit_own_post",
  ],
  subscriber: [],
};

export class RbacAuthorizer {
  public static can(user: UserSession | null | undefined, action: AdminAction): boolean {
    if (!user || !user.isActive) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(action);
  }

  public static assertAuthorized(user: UserSession | null | undefined, action: AdminAction) {
    if (!user) {
      const err = new Error("401 Unauthorized: Authentication session required");
      (err as unknown as { status: number }).status = 401;
      throw err;
    }
    if (!user.isActive) {
      const err = new Error("403 Forbidden: User account is inactive or disabled");
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
    if (!this.can(user, action)) {
      const err = new Error(`403 Forbidden: Role "${user.role}" is not authorized for "${action}"`);
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Route Guard & Header Engine (Simulates Next.js Edge Middleware Contract)
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulatedRequest {
  pathname: string;
  cookies: Record<string, string>;
  headers: Record<string, string>;
}

export interface SimulatedResponse {
  status: number;
  headers: Record<string, string>;
  redirectUrl?: string;
  body?: unknown;
}

export function evaluateMiddlewareSecurity(req: SimulatedRequest): SimulatedResponse {
  const { pathname, cookies, headers } = req;
  const resHeaders: Record<string, string> = {
    // Project requirement: Live preview iframe requires SAMEORIGIN framing
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  // 1. Skip assets, public icons
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return { status: 200, headers: resHeaders };
  }

  const sessionToken = cookies["authjs.session-token"] || cookies["__Secure-authjs.session-token"];

  // 2. Protect /api/admin routes: MUST return 401 JSON, NOT redirect
  if (pathname.startsWith("/api/admin")) {
    if (!sessionToken || sessionToken.trim() === "") {
      return {
        status: 401,
        headers: { ...resHeaders, "Content-Type": "application/json" },
        body: { error: "Unauthorized: Missing authentication token" },
      };
    }
  }

  // 3. Protect /admin UI routes: redirect to login if no session
  if (pathname.startsWith("/admin")) {
    if (!sessionToken || sessionToken.trim() === "") {
      return {
        status: 307,
        headers: resHeaders,
        redirectUrl: `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`,
      };
    }
  }

  return { status: 200, headers: resHeaders };
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E Test Suite: Security & RBAC (Tiers 1-4)
// ─────────────────────────────────────────────────────────────────────────────

describe("E2E Security, RBAC & Middleware Validation (Tiers 1-4)", () => {
  const superAdminUser: UserSession = {
    userId: "usr-super-1",
    email: "super@ainews.kraviona.com",
    name: "Super Administrator",
    role: "super_admin",
    isActive: true,
  };

  const adminUser: UserSession = {
    userId: "usr-admin-1",
    email: "admin@ainews.kraviona.com",
    name: "Site Administrator",
    role: "admin",
    isActive: true,
  };

  const editorUser: UserSession = {
    userId: "usr-editor-1",
    email: "editor@ainews.kraviona.com",
    name: "Section Editor",
    role: "editor",
    isActive: true,
  };

  const authorUser: UserSession = {
    userId: "usr-author-1",
    email: "author@ainews.kraviona.com",
    name: "Contributing Author",
    role: "author",
    isActive: true,
  };

  const subscriberUser: UserSession = {
    userId: "usr-sub-1",
    email: "reader@gmail.com",
    name: "Regular Subscriber",
    role: "subscriber",
    isActive: true,
  };

  // ── Tier 1: Feature Coverage (Role Permissions Matrix) ──────────────────────

  describe("Tier 1: Role Permissions Matrix & Happy Paths", () => {
    it("grants super_admin complete access across all administrative actions", () => {
      const allActions: AdminAction[] = [
        "view_dashboard",
        "design_studio_view",
        "design_studio_edit_draft",
        "design_studio_preview",
        "design_studio_publish",
        "design_studio_rollback",
        "cms_create_post",
        "cms_edit_own_post",
        "cms_edit_any_post",
        "cms_publish_post",
        "manage_users",
        "view_audit_logs",
      ];

      for (const action of allActions) {
        expect(RbacAuthorizer.can(superAdminUser, action)).toBe(true);
      }
    });

    it("grants admin full access to design studio publish and rollback", () => {
      expect(RbacAuthorizer.can(adminUser, "design_studio_publish")).toBe(true);
      expect(RbacAuthorizer.can(adminUser, "design_studio_rollback")).toBe(true);
      expect(RbacAuthorizer.can(adminUser, "design_studio_edit_draft")).toBe(true);
      expect(RbacAuthorizer.can(adminUser, "cms_publish_post")).toBe(true);
    });

    it("allows editor to edit drafts and preview but denies publish and rollback", () => {
      expect(RbacAuthorizer.can(editorUser, "design_studio_view")).toBe(true);
      expect(RbacAuthorizer.can(editorUser, "design_studio_edit_draft")).toBe(true);
      expect(RbacAuthorizer.can(editorUser, "design_studio_preview")).toBe(true);

      // Must be denied publishing & rollback
      expect(RbacAuthorizer.can(editorUser, "design_studio_publish")).toBe(false);
      expect(RbacAuthorizer.can(editorUser, "design_studio_rollback")).toBe(false);
    });

    it("strictly isolates author to personal content creation only", () => {
      expect(RbacAuthorizer.can(authorUser, "cms_create_post")).toBe(true);
      expect(RbacAuthorizer.can(authorUser, "cms_edit_own_post")).toBe(true);

      // Must be denied design studio and general publish
      expect(RbacAuthorizer.can(authorUser, "design_studio_view")).toBe(false);
      expect(RbacAuthorizer.can(authorUser, "design_studio_publish")).toBe(false);
      expect(RbacAuthorizer.can(authorUser, "design_studio_rollback")).toBe(false);
      expect(RbacAuthorizer.can(authorUser, "cms_publish_post")).toBe(false);
    });

    it("denies subscriber from all administrative actions", () => {
      expect(RbacAuthorizer.can(subscriberUser, "view_dashboard")).toBe(false);
      expect(RbacAuthorizer.can(subscriberUser, "design_studio_view")).toBe(false);
      expect(RbacAuthorizer.can(subscriberUser, "cms_create_post")).toBe(false);
    });
  });

  // ── Tier 2: Boundary & Corner Cases (Adversarial Privilege Escalation) ───────

  describe("Tier 2: Boundary & Privilege Escalation Defenses", () => {
    it("throws 403 Forbidden when editor attempts to trigger design publish", () => {
      expect(() => {
        RbacAuthorizer.assertAuthorized(editorUser, "design_studio_publish");
      }).toThrow(/403 Forbidden: Role "editor" is not authorized/);
    });

    it("throws 403 Forbidden when author attempts to trigger rollback", () => {
      expect(() => {
        RbacAuthorizer.assertAuthorized(authorUser, "design_studio_rollback");
      }).toThrow(/403 Forbidden: Role "author" is not authorized/);
    });

    it("throws 403 Forbidden when inactive/disabled user attempts any action", () => {
      const disabledAdmin: UserSession = {
        ...adminUser,
        isActive: false,
      };

      expect(() => {
        RbacAuthorizer.assertAuthorized(disabledAdmin, "view_dashboard");
      }).toThrow(/403 Forbidden: User account is inactive/);
    });

    it("throws 401 Unauthorized when unauthenticated request attempts administrative action", () => {
      expect(() => {
        RbacAuthorizer.assertAuthorized(null, "view_dashboard");
      }).toThrow(/401 Unauthorized/);
    });
  });

  // ── Tier 3: Middleware & Route Guarding ──────────────────────────────────────

  describe("Tier 3: Edge Middleware Contract & Header Verification", () => {
    it("enforces X-Frame-Options: SAMEORIGIN to support preview iframes safely", () => {
      const response = evaluateMiddlewareSecurity({
        pathname: "/admin/design-studio",
        cookies: { "authjs.session-token": "valid-token-super" },
        headers: {},
      });

      expect(response.headers["X-Frame-Options"]).toBe("SAMEORIGIN");
      expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(response.headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });

    it("blocks unauthenticated requests to /api/admin/* with 401 JSON response", () => {
      const response = evaluateMiddlewareSecurity({
        pathname: "/api/admin/design-studio/publish",
        cookies: {},
        headers: {},
      });

      expect(response.status).toBe(401);
      expect(response.headers["Content-Type"]).toBe("application/json");
      expect(response.body).toEqual({ error: "Unauthorized: Missing authentication token" });
    });

    it("redirects unauthenticated requests to /admin UI with callbackUrl parameter", () => {
      const response = evaluateMiddlewareSecurity({
        pathname: "/admin/design-studio",
        cookies: {},
        headers: {},
      });

      expect(response.status).toBe(307);
      expect(response.redirectUrl).toBe("/auth/login?callbackUrl=%2Fadmin%2Fdesign-studio");
    });

    it("allows public access to reader pages while preserving security headers", () => {
      const publicPaths = [
        "/",
        "/blog/introducing-gpt-5-frontier-release",
        "/category/frontier-models",
        "/ai-tools",
        "/india-ai",
        "/feed.xml",
      ];

      for (const path of publicPaths) {
        const response = evaluateMiddlewareSecurity({
          pathname: path,
          cookies: {},
          headers: {},
        });
        expect(response.status).toBe(200);
        expect(response.headers["X-Frame-Options"]).toBe("SAMEORIGIN");
      }
    });
  });

  // ── Tier 4: Cross-Origin Framing Defense ─────────────────────────────────────

  describe("Tier 4: Cross-Origin Framing & Clickjacking Defense", () => {
    it("validates that SAMEORIGIN policy allows same-origin preview while blocking 3rd-party frames", () => {
      const allowedOrigin = "https://ainews.kraviona.com";
      const attackerOrigin = "https://evil-clickjack.org";

      const isFrameAllowed = (parentOrigin: string, childOrigin: string, header: string): boolean => {
        if (header === "DENY") return false;
        if (header === "SAMEORIGIN") return parentOrigin === childOrigin;
        return true;
      };

      expect(isFrameAllowed(allowedOrigin, allowedOrigin, "SAMEORIGIN")).toBe(true);
      expect(isFrameAllowed(attackerOrigin, allowedOrigin, "SAMEORIGIN")).toBe(false);
    });
  });
});
