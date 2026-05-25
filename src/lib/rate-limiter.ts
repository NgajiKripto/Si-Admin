import { NextResponse } from "next/server";

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  windowMs: 60000,
  maxRequests: 20,
};

class RateLimiter {
  private requests: Map<string, number[]>;
  private options: RateLimiterOptions;
  private cleanupInterval: ReturnType<typeof setInterval>;

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
    return false;
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

export function getRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
    { status: 429 }
  );
}
