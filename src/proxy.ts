import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveDomainRedirect } from "@/lib/seo/domain";

// Regex matching static file extensions to skip auth/header proxy processing
const STATIC_FILE_REGEX = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|eot|map|txt|xml|webmanifest)$/i;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 0. Optional single-hop 301 Domain Migration Redirect
  // Gated by ENABLE_DOMAIN_REDIRECTS === "true" (OFF until target domain is verified on Vercel).
  // Runs before STATIC_FILE_REGEX so legacy /sitemap.xml, /robots.txt, and /feed.xml also redirect cleanly.
  const domainRedirect = resolveDomainRedirect({
    requestUrl: request.nextUrl,
    hostHeader: request.headers.get("x-forwarded-host") || request.headers.get("host"),
    forwardedProtoHeader: request.headers.get("x-forwarded-proto"),
  });
  if (domainRedirect) {
    return NextResponse.redirect(domainRedirect.destination, domainRedirect.status);
  }

  // 1. Skip next static assets, build chunks, and known asset files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    STATIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Extract session token (supporting both standard dev HTTP and __Secure production HTTPS)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // 2. Protect Admin API Routes (/api/admin/*)
  // MUST return 401 JSON, NOT an HTML redirect
  if (pathname.startsWith("/api/admin")) {
    if (!sessionToken || sessionToken.trim() === "") {
      return NextResponse.json(
        {
          error: "Unauthorized: Missing authentication token",
        },
        { status: 401 }
      );
    }
  }

  // 3. Protect Admin UI Routes (/admin/*)
  // Unauthenticated users are redirected to login page with callbackUrl
  if (pathname.startsWith("/admin")) {
    if (!sessionToken || sessionToken.trim() === "") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Preview Mode Authentication & Header Forwarding
  const isPreviewRequested =
    searchParams.get("preview") === "draft" ||
    searchParams.get("preview") === "true" ||
    request.cookies.get("design_preview")?.value === "draft" ||
    request.cookies.get("design_preview")?.value === "true";

  const requestHeaders = new Headers(request.headers);
  let isAuthorizedPreview = false;

  if (isPreviewRequested) {
    const previewSecretParam = searchParams.get("secret");
    const configuredSecret = process.env.DESIGN_PREVIEW_SECRET;

    // Authorized if user has active admin session OR valid secret query param
    if (sessionToken || (configuredSecret && previewSecretParam === configuredSecret)) {
      isAuthorizedPreview = true;
      requestHeaders.set("x-design-preview", "true");
    }
  }

  // Pass forwarded headers to Server Components (layout.tsx, page.tsx)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Security Headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent search engines from ever indexing draft previews
  if (isAuthorizedPreview) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
