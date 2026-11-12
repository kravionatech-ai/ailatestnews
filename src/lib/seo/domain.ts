/**
 * Centralized Domain Configuration & Future-Proof Migration Utility
 *
 * Single source of truth for canonical origin, legacy host rewriting,
 * single-hop redirect resolution, and verification/tracking IDs.
 *
 * Future migration (e.g. kraviona.site -> ailatestnews.in):
 *   1. Update NEXT_PUBLIC_SITE_URL=https://ailatestnews.in
 *   2. Update NEXT_PUBLIC_LEGACY_DOMAINS=ainews.kraviona.com,kraviona.site
 *   3. Set REDIRECT_SOURCE_DOMAINS=ainews.kraviona.com,www.ainews.kraviona.com,kraviona.site,www.kraviona.site
 */

export const DEFAULT_PRODUCTION_SITE_URL = "https://kraviona.site";
export const DEFAULT_LOCAL_SITE_URL = "http://localhost:3000";

export const HISTORICAL_MIGRATION_HOSTS = [
  "ainews.kraviona.com",
  "kraviona.site",
] as const;

export const DEFAULT_GOOGLE_SITE_VERIFICATION =
  "-XV8p9zE9MYruAbDWo-gSDEYRFLrSB200khCkukUysg";
export const DEFAULT_GTM_ID = "GTM-5Q53H625";
export const DEFAULT_GA_ID = "G-RC5GPJKKW2";

export interface DomainRedirectDecision {
  destination: string;
  status: 301;
  reason: "legacy-host" | "www-canonical" | "https-upgrade";
}

export interface ResolveDomainRedirectInput {
  requestUrl: string | URL;
  hostHeader?: string | null;
  forwardedProtoHeader?: string | null;
  enabled?: boolean;
  targetSiteUrl?: string;
  sourceDomainsRaw?: string;
  legacyDomainsRaw?: string;
}

/**
 * Strip protocol, port, and trailing slashes from a hostname string.
 */
export function normalizeHostname(rawHost?: string | null): string {
  if (!rawHost) return "";
  const first = rawHost.split(",")[0]?.trim() || "";
  if (!first) return "";

  const withoutProtocol = first.replace(/^https?:\/\//i, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  // Strip IPv4/domain :port suffix while preserving bracketed IPv6 if present
  const withoutPort = withoutPath.startsWith("[")
    ? withoutPath.replace(/\]:\d+$/, "]")
    : withoutPath.replace(/:\d+$/, "");

  return withoutPort.replace(/\.+$/, "").toLowerCase().trim();
}

/**
 * Check if a hostname refers to a local development host.
 */
export function isLocalhostHost(hostname?: string | null): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return false;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  );
}

/**
 * Parse and validate an http/https URL string.
 * Rejects empty values, malformed hosts, embedded credentials, and unsafe schemes.
 */
export function parseValidSiteUrl(rawUrl?: string | null): URL | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject unsafe non-http(s) schemes (javascript:, data:, vbscript:, file:, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = isLocalhostHost(candidate) ? `http://${candidate}` : `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname || /\s/.test(parsed.hostname) || parsed.username || parsed.password) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Strictly validate a configured site URL, returning a clean normalized origin.
 * Throws if invalid.
 */
export function validateSiteUrl(rawUrl: string): string {
  const parsed = parseValidSiteUrl(rawUrl);
  if (!parsed) {
    throw new Error(`Invalid site URL configuration: "${rawUrl}"`);
  }
  return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
}

/**
 * Normalize any configured URL into a clean origin with zero trailing slashes.
 */
export function normalizeSiteUrl(
  rawUrl?: string | null,
  fallback: string = DEFAULT_PRODUCTION_SITE_URL
): string {
  const parsed = parseValidSiteUrl(rawUrl);
  if (parsed) {
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
  }
  const parsedFallback = parseValidSiteUrl(fallback);
  if (parsedFallback) {
    return `${parsedFallback.protocol}//${parsedFallback.host}`.replace(/\/+$/, "");
  }
  return DEFAULT_PRODUCTION_SITE_URL;
}

/**
 * Check if a URL string points to a local development host.
 */
export function isLocalhostUrl(rawUrl?: string | null): boolean {
  const parsed = parseValidSiteUrl(rawUrl);
  return parsed ? isLocalhostHost(parsed.hostname) : false;
}

/**
 * Return the local development origin, intentionally separate from canonical production SEO URLs.
 */
export function getLocalSiteUrl(): string {
  const explicitLocal = parseValidSiteUrl(process.env.NEXT_PUBLIC_LOCAL_SITE_URL);
  if (explicitLocal && isLocalhostHost(explicitLocal.hostname)) {
    return `${explicitLocal.protocol}//${explicitLocal.host}`.replace(/\/+$/, "");
  }

  const configuredPublic = parseValidSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredPublic && isLocalhostHost(configuredPublic.hostname)) {
    return `${configuredPublic.protocol}//${configuredPublic.host}`.replace(/\/+$/, "");
  }

  return DEFAULT_LOCAL_SITE_URL;
}

/**
 * Canonical production URL used for all SEO metadata, canonicals, JSON-LD,
 * XML sitemaps, robots.txt, RSS feeds, and external pings.
 * Never returns localhost or transient preview *.vercel.app URLs when a canonical
 * production domain is known.
 */
export function getProductionSiteUrl(): string {
  const explicitProd = parseValidSiteUrl(process.env.NEXT_PUBLIC_PRODUCTION_SITE_URL);
  if (explicitProd && !isLocalhostHost(explicitProd.hostname)) {
    return `${explicitProd.protocol}//${explicitProd.host}`.replace(/\/+$/, "");
  }

  const configuredSiteUrl = parseValidSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredSiteUrl && !isLocalhostHost(configuredSiteUrl.hostname)) {
    return `${configuredSiteUrl.protocol}//${configuredSiteUrl.host}`.replace(/\/+$/, "");
  }

  const vercelProdHost = normalizeHostname(
    typeof process !== "undefined" ? process.env?.VERCEL_PROJECT_PRODUCTION_URL : undefined
  );
  if (vercelProdHost && !isLocalhostHost(vercelProdHost)) {
    return `https://${vercelProdHost}`;
  }

  return DEFAULT_PRODUCTION_SITE_URL;
}

/**
 * Primary server-side & client-side canonical site origin.
 * Reads NEXT_PUBLIC_SITE_URL (when non-localhost) or falls back to the canonical production origin.
 */
export function getSiteUrl(): string {
  return getProductionSiteUrl();
}

/**
 * Extract canonical hostname (e.g. "kraviona.site") from target site URL.
 */
export function getSiteHostname(targetSiteUrl: string = getSiteUrl()): string {
  const parsed = parseValidSiteUrl(targetSiteUrl);
  return parsed ? parsed.hostname.toLowerCase() : normalizeHostname(DEFAULT_PRODUCTION_SITE_URL);
}

/**
 * Build deduplicated list of legacy hostnames (and their www./bare siblings)
 * excluding whichever host is currently active.
 */
export function getLegacyHosts(
  activeSiteUrl: string = getSiteUrl(),
  customLegacyDomainsRaw?: string
): string[] {
  const activeHost = getSiteHostname(activeSiteUrl);
  const envRaw =
    customLegacyDomainsRaw !== undefined
      ? customLegacyDomainsRaw
      : process.env.NEXT_PUBLIC_LEGACY_DOMAINS || "";

  const configured = envRaw
    .split(",")
    .map((h) => normalizeHostname(h))
    .filter(Boolean);

  const candidates = new Set<string>([
    ...HISTORICAL_MIGRATION_HOSTS,
    ...configured,
  ]);

  const expanded = new Set<string>();
  for (const host of candidates) {
    if (!host || isLocalhostHost(host)) continue;
    const bare = host.replace(/^www\./, "");
    const withWww = `www.${bare}`;

    // Skip the currently active canonical host and avoid marking root domains as legacy unless listed
    if (bare !== activeHost) {
      expanded.add(bare);
      expanded.add(withWww);
    }
  }

  // Never include the active host itself
  expanded.delete(activeHost);
  return Array.from(expanded);
}

/**
 * Determine whether a hostname belongs to a retired legacy domain relative to activeSiteUrl.
 */
export function isLegacyHost(
  hostname: string,
  activeSiteUrl: string = getSiteUrl(),
  customLegacyDomainsRaw?: string
): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return false;
  const legacySet = new Set(getLegacyHosts(activeSiteUrl, customLegacyDomainsRaw));
  return legacySet.has(normalized);
}

/**
 * Resolve effective site URL when reading from MongoDB settings documents.
 * Automatically overrides stale legacy domains or localhost values stored in DB
 * with the current configured canonical production URL.
 */
export function resolveEffectiveSiteUrl(
  dbSiteUrl?: string | null,
  activeSiteUrl: string = getSiteUrl()
): string {
  const fallbackCanonical = normalizeSiteUrl(activeSiteUrl);
  const parsedDb = parseValidSiteUrl(dbSiteUrl);
  if (!parsedDb) return fallbackCanonical;

  const dbHost = parsedDb.hostname.toLowerCase();
  if (isLocalhostHost(dbHost) || isLegacyHost(dbHost, fallbackCanonical)) {
    return fallbackCanonical;
  }

  return `${parsedDb.protocol}//${parsedDb.host}`.replace(/\/+$/, "");
}

/**
 * Rewrite an absolute URL whose host is a retired legacy domain or localhost
 * to targetSiteUrl, preserving pathname, query string, and hash.
 * Leaves external URLs (Cloudinary, Unsplash, third-party articles) untouched.
 */
export function rewriteLegacyOriginUrl(
  rawUrl: string,
  targetSiteUrl: string = getSiteUrl()
): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "";

  const target = normalizeSiteUrl(targetSiteUrl);

  // Preserve relative URLs unchanged unless explicitly needing full canonical form
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  const parsed = parseValidSiteUrl(trimmed);
  if (!parsed) return trimmed;

  const host = parsed.hostname.toLowerCase();
  if (isLegacyHost(host, target) || isLocalhostHost(host)) {
    const suffix =
      parsed.pathname === "/" && !parsed.search && !parsed.hash
        ? ""
        : `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return `${target}${suffix}`;
  }

  return trimmed;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Rewrite internal links pointing to retired legacy domains inside HTML content
 * (e.g. legacy internal hrefs stored in older MongoDB articles).
 */
export function rewriteLegacyHtmlUrls(
  html: string,
  targetSiteUrl: string = getSiteUrl()
): string {
  if (!html) return "";
  const target = normalizeSiteUrl(targetSiteUrl);
  const legacyHosts = getLegacyHosts(target);
  if (legacyHosts.length === 0) return html;

  const hostAlternation = legacyHosts.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `https?:\\/\\/(?:${hostAlternation})(?::\\d+)?(?=[\\/"'\\s?#)<]|$)`,
    "gi"
  );

  return html.replace(pattern, target);
}

/**
 * Replace retired legacy hostname occurrences inside plain display text
 * (e.g. copyright notices or UI labels cached in DB).
 */
export function replaceLegacyHostText(
  text: string,
  targetSiteUrl: string = getSiteUrl()
): string {
  if (!text) return "";
  const target = normalizeSiteUrl(targetSiteUrl);
  const targetHost = getSiteHostname(target);
  const legacyHosts = getLegacyHosts(target);
  if (legacyHosts.length === 0) return text;

  let output = rewriteLegacyHtmlUrls(text, target);
  const hostAlternation = legacyHosts.map(escapeRegExp).join("|");
  const barePattern = new RegExp(`\\b(?:${hostAlternation})\\b`, "gi");
  output = output.replace(barePattern, targetHost);
  return output;
}

/**
 * Normalize legacy origin URLs inside custom raw robots.txt content and remove duplicate Sitemap lines.
 */
export function rewriteLegacyRobotsTxt(
  robotsContent: string,
  targetSiteUrl: string = getSiteUrl()
): string {
  if (!robotsContent) return "";
  const target = normalizeSiteUrl(targetSiteUrl);
  const rewritten = rewriteLegacyHtmlUrls(robotsContent, target);
  const seenSitemaps = new Set<string>();
  const dedupedLines: string[] = [];

  for (const line of rewritten.split("\n")) {
    const trimmed = line.trim();
    if (/^sitemap:/i.test(trimmed)) {
      const normalizedKey = trimmed.toLowerCase();
      if (seenSitemaps.has(normalizedKey)) continue;
      seenSitemaps.add(normalizedKey);
    }
    dedupedLines.push(line);
  }

  return dedupedLines.join("\n").trim() + "\n";
}

/**
 * Resolve a relative path or URL into a clean canonical URL on targetSiteUrl,
 * stripping legacy origins while keeping trailing-slash semantics clean.
 */
export function buildCanonicalUrl(
  pathOrUrl: string,
  targetSiteUrl: string = getSiteUrl()
): string {
  const target = normalizeSiteUrl(targetSiteUrl);
  const trimmed = (pathOrUrl || "").trim();
  if (!trimmed || trimmed === "/") {
    return `${target}/`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const rewritten = rewriteLegacyOriginUrl(trimmed, target);
    const parsed = parseValidSiteUrl(rewritten);
    if (!parsed) return trimmed;
    return parsed.pathname === "/" && !parsed.search && !parsed.hash
      ? `${parsed.protocol}//${parsed.host}/`
      : parsed.toString();
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${target}${normalizedPath}`;
}

/**
 * Determine all hostnames that should issue a 1-hop permanent 301 redirect to targetSiteUrl
 * when domain redirects are enabled.
 */
export function getRedirectSourceHosts(
  targetSiteUrl: string = getSiteUrl(),
  customRedirectSourcesRaw?: string,
  customLegacyDomainsRaw?: string
): string[] {
  const target = normalizeSiteUrl(targetSiteUrl);
  const targetHost = getSiteHostname(target);
  const sourcesRaw =
    customRedirectSourcesRaw !== undefined
      ? customRedirectSourcesRaw
      : (typeof process !== "undefined" ? process.env?.REDIRECT_SOURCE_DOMAINS : undefined) || "";

  const explicitSources = sourcesRaw
    .split(",")
    .map((h) => normalizeHostname(h))
    .filter(Boolean);

  const combined = new Set<string>([
    ...getLegacyHosts(target, customLegacyDomainsRaw),
    ...explicitSources,
  ]);

  // Also include www.<targetHost> (or bare host if target uses www.) for 1-hop canonicalization
  if (targetHost.startsWith("www.")) {
    combined.add(targetHost.replace(/^www\./, ""));
  } else if (targetHost && !isLocalhostHost(targetHost)) {
    combined.add(`www.${targetHost}`);
  }

  // Never redirect the canonical target host to itself
  combined.delete(targetHost);
  return Array.from(combined).filter((h) => Boolean(h) && !isLocalhostHost(h));
}

/**
 * Evaluate whether an incoming HTTP request should return a permanent 301 redirect
 * to the canonical production origin.
 *
 * Security & SEO guarantees:
 * - Gated by ENABLE_DOMAIN_REDIRECTS === "true" (OFF by default until target domain is verified)
 * - Always single-hop directly to the final canonical URL
 * - Preserves pathname + query parameters
 * - Never redirects localhost, *.vercel.app previews, or the canonical host itself
 */
export function resolveDomainRedirect(
  input: ResolveDomainRedirectInput
): DomainRedirectDecision | null {
  const enabled =
    input.enabled !== undefined
      ? input.enabled
      : (typeof process !== "undefined" ? process.env?.ENABLE_DOMAIN_REDIRECTS : undefined) === "true";

  if (!enabled) return null;

  const targetOrigin = normalizeSiteUrl(input.targetSiteUrl || getSiteUrl());
  const targetParsed = parseValidSiteUrl(targetOrigin);
  if (!targetParsed) return null;

  let parsedReq: URL;
  try {
    parsedReq =
      input.requestUrl instanceof URL
        ? input.requestUrl
        : new URL(input.requestUrl);
  } catch {
    return null;
  }

  // Bypass Next.js internals, health checks, and auth callbacks
  if (
    parsedReq.pathname.startsWith("/_next") ||
    parsedReq.pathname === "/api/health" ||
    parsedReq.pathname.startsWith("/api/auth")
  ) {
    return null;
  }

  const incomingHost =
    normalizeHostname(input.hostHeader) || parsedReq.hostname.toLowerCase();

  if (
    !incomingHost ||
    isLocalhostHost(incomingHost) ||
    incomingHost.endsWith(".vercel.app")
  ) {
    return null;
  }

  const targetHost = targetParsed.hostname.toLowerCase();
  const forwardedProto = (input.forwardedProtoHeader || "")
    .split(",")[0]
    ?.trim()
    .toLowerCase();
  const incomingProto = forwardedProto
    ? `${forwardedProto.replace(/:$/, "")}:`
    : parsedReq.protocol.toLowerCase();

  const destination = `${targetOrigin}${parsedReq.pathname}${parsedReq.search}`;

  // 1. Check retired legacy domains and www/bare canonical mismatch
  const redirectSourceHosts = getRedirectSourceHosts(
    targetOrigin,
    input.sourceDomainsRaw,
    input.legacyDomainsRaw
  );

  if (redirectSourceHosts.includes(incomingHost)) {
    const isWwwPair =
      incomingHost === `www.${targetHost}` || targetHost === `www.${incomingHost}`;
    return {
      destination,
      status: 301,
      reason: isWwwPair ? "www-canonical" : "legacy-host",
    };
  }

  // 2. Enforce HTTPS on canonical target host if proxy indicates plain HTTP
  if (
    incomingHost === targetHost &&
    targetParsed.protocol === "https:" &&
    incomingProto === "http:"
  ) {
    return {
      destination,
      status: 301,
      reason: "https-upgrade",
    };
  }

  return null;
}

/**
 * Google Search Console meta verification token.
 */
export function getGoogleSiteVerification(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
    DEFAULT_GOOGLE_SITE_VERIFICATION
  ).trim();
}

/**
 * Google Tag Manager container ID (e.g. GTM-5Q53H625).
 */
export function getGtmId(): string {
  return (process.env.NEXT_PUBLIC_GTM_ID || DEFAULT_GTM_ID).trim();
}

/**
 * Google Analytics measurement ID (e.g. G-RC5GPJKKW2).
 */
export function getGaId(): string {
  const raw = process.env.NEXT_PUBLIC_GA_ID;
  if (raw !== undefined) {
    return raw.trim();
  }
  return DEFAULT_GA_ID;
}
