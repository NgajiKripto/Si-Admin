import { NextResponse } from "next/server";

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  windowMs: 60000,
  maxRequests: 20,
};

/**
 * In-memory sliding-window rate limiter suitable for single-process deployments.
 *
 * Request timestamps are stored in a plain Map that resets on process restart.
 * For serverless or multi-instance production deployments, replace this with an
 * external store such as Redis or Upstash to ensure rate limit state is shared
 * across instances and persists across cold starts.
 *
 * NOTE: X-Forwarded-For is only trustworthy when the application sits behind a
 * reverse proxy (e.g., nginx, Cloudflare, AWS ALB) that overwrites the header.
 * If the app is directly internet-facing, clients can spoof X-Forwarded-For to
 * bypass per-IP rate limits. In production, the reverse proxy MUST set or
 * overwrite the X-Forwarded-For header so that it cannot be spoofed by clients.
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private options: RateLimiterOptions;
  private cleanupInterval: ReturnType<typeof setInterval>;

  // Global rate limit: 200 requests/minute across all keys
  private globalMaxRequests = 200;

  constructor(options?: Partial<RateLimiterOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.requests = new Map();

    // Auto-cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.options.maxRequests) {
      this.requests.set(key, validTimestamps);
      return true;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    // Check global rate limit after recording the per-key timestamp
    if (this.isGloballyRateLimited()) {
      return true;
    }

    return false;
  }

  /**
   * Check multiple keys simultaneously. If ANY key is already rate limited,
   * returns true without recording timestamps. Otherwise, records a timestamp
   * for ALL keys and returns false. This prevents bypassing rate limits by
   * rotating identifiers (e.g., spoofing IP while reusing a session).
   */
  isRateLimitedMulti(keys: string[]): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // First pass: check if any key is already at the limit
    for (const key of keys) {
      const timestamps = this.requests.get(key) || [];
      const validTimestamps = timestamps.filter((t) => t > windowStart);
      this.requests.set(key, validTimestamps);

      if (validTimestamps.length >= this.options.maxRequests) {
        return true;
      }
    }

    // Second pass: record timestamp for all keys
    for (const key of keys) {
      const timestamps = this.requests.get(key) || [];
      timestamps.push(now);
      this.requests.set(key, timestamps);
    }

    // Check global rate limit
    if (this.isGloballyRateLimited()) {
      return true;
    }

    return false;
  }

  /**
   * Check if the global rate limit (200 requests/minute across all IPs) has been exceeded.
   * This is a read-only check that counts all timestamps across all per-key buckets,
   * avoiding double-counting that would occur with a separate global counter.
   */
  isGloballyRateLimited(): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    let totalRequests = 0;

    for (const timestamps of this.requests.values()) {
      totalRequests += timestamps.filter((t) => t > windowStart).length;
    }

    return totalRequests >= this.globalMaxRequests;
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export const knowledgeRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 10,
});

export function getRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
    { status: 429 }
  );
}
