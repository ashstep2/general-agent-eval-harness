/**
 * In-memory IP rate limiter for eval API endpoints.
 *
 * Why this exists: the /api/agent-eval routes spend real money (LLM API calls,
 * dual judges, agent loops). Without auth or rate limiting, anyone with the URL
 * can drain the project's API balance. This is a minimum-viable defense.
 *
 * Limitations:
 *   - In-memory: per-instance state. On Vercel Fluid Compute, multiple instances
 *     mean a determined attacker can still get more requests through. Accept
 *     this tradeoff vs adding a KV/Redis dependency for an MVP.
 *   - Best replaced by Vercel BotID + a distributed rate limiter (Upstash Redis)
 *     when usage warrants it.
 */

interface Bucket {
  count: number;
  windowStartMs: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  /** Max requests per window. Default: 5. */
  max: number;
  /** Window length in ms. Default: 60_000 (1 minute). */
  windowMs: number;
}

const DEFAULT: RateLimitOptions = { max: 5, windowMs: 60_000 };

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check whether a request from this key (typically client IP) is allowed.
 * Caller is responsible for choosing a stable key.
 */
export function checkRateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {},
): RateLimitResult {
  const { max, windowMs } = { ...DEFAULT, ...options };
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartMs >= windowMs) {
    // New window.
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: bucket.windowStartMs + windowMs - now,
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count, retryAfterMs: 0 };
}

/**
 * Best-effort client identifier: prefer the leftmost x-forwarded-for IP
 * (Vercel sets this to the originating client), fall back to a constant.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') || 'unknown';
}

/**
 * Periodically prune stale buckets to bound memory.
 * Called opportunistically from the rate limiter on every check is wasteful;
 * instead callers can invoke this from a cron or skip cleanup (memory bounded
 * by unique IPs seen in any 1-min window).
 */
export function pruneStaleBuckets(staleAfterMs = 5 * 60_000): void {
  const cutoff = Date.now() - staleAfterMs;
  buckets.forEach((bucket, key) => {
    if (bucket.windowStartMs < cutoff) {
      buckets.delete(key);
    }
  });
}
