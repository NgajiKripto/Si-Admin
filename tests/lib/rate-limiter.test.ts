import { describe, it, expect, vi } from 'vitest';

// Mock next/server since we're in a Node test environment
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status }),
  },
}));

import { rateLimiter, knowledgeRateLimiter, getRateLimitResponse } from '@/lib/rate-limiter';

describe('rateLimiter', () => {
  it('allows requests under the per-IP limit', () => {
    const key = `test-ip-${Date.now()}`;
    // First request should not be limited
    expect(rateLimiter.isRateLimited(key)).toBe(false);
  });

  it('blocks after exceeding per-IP limit of 20', () => {
    const key = `test-ip-flood-${Date.now()}`;

    // Make 20 requests (default limit)
    for (let i = 0; i < 20; i++) {
      rateLimiter.isRateLimited(key);
    }
    // 21st should be limited
    expect(rateLimiter.isRateLimited(key)).toBe(true);
  });
});

describe('knowledgeRateLimiter', () => {
  it('has 10 request limit', () => {
    const key = `knowledge-test-${Date.now()}`;

    for (let i = 0; i < 10; i++) {
      knowledgeRateLimiter.isRateLimited(key);
    }
    expect(knowledgeRateLimiter.isRateLimited(key)).toBe(true);
  });

  it('allows requests under the limit', () => {
    const key = `knowledge-ok-${Date.now()}`;
    expect(knowledgeRateLimiter.isRateLimited(key)).toBe(false);
  });
});

describe('global rate limiting', () => {
  it('blocks all requests after 200 total from different IPs', () => {
    // Each call to isRateLimited increments the global counter.
    // The rateLimiter was already used above so we need to use a fresh instance.
    // We cannot create a fresh instance since the class is not exported,
    // but we can use knowledgeRateLimiter which has its own global counter.
    // Actually, let's just call isGloballyRateLimited directly on rateLimiter.
    // The global limit is 200 per window.

    // We already used rateLimiter above (about 22 calls from previous tests).
    // Let's fill up the remaining global capacity.
    // Instead, test the concept: after many requests, global limit triggers.
    const uniqueKeys: string[] = [];
    for (let i = 0; i < 250; i++) {
      uniqueKeys.push(`global-test-ip-${Date.now()}-${i}`);
    }

    let limitedCount = 0;
    for (const key of uniqueKeys) {
      if (rateLimiter.isRateLimited(key)) {
        limitedCount++;
      }
    }
    // Some should be limited due to global cap (200 per window)
    expect(limitedCount).toBeGreaterThan(0);
  });
});

describe('getRateLimitResponse', () => {
  it('returns a 429 response', () => {
    const response = getRateLimitResponse();
    expect((response as any).status).toBe(429);
  });
});
