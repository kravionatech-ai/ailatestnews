/**
 * Rate limiter using Upstash Redis or In-Memory cache fallback.
 */

import { getCache } from "./cache";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const cache = getCache();
  const prefix = config.prefix ?? "rl";
  const windowSec = Math.ceil(config.windowMs / 1000);
  const key = `${prefix}:${identifier}`;

  try {
    const count = await cache.incr(key);

    if (count === 1) {
      await cache.expire(key, windowSec);
    }

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const resetAt = Date.now() + config.windowMs;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error("[RateLimit] Error:", error);
    // Fail open if cache is unavailable
    return { allowed: true, remaining: config.max, resetAt: Date.now() };
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toUTCString(),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}
