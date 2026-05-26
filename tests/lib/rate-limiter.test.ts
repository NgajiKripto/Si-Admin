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
    const key = `test-ip-${Date.now()}-${Math.random()}`;
    // First request should not be limited
    expect(rateLimiter.isRateLimited(key)).toBe(false);
  });

  it('blocks after exceeding per-IP limit of 20', () => {
    const key = `test-ip-flood-${Date.now()}-${Math.random()}`;

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
    const key = `knowledge-test-${Date.now()}-${Math.random()}`;

    for (let i = 0; i < 10; i++) {
      knowledgeRateLimiter.isRateLimited(key);
    }
    expect(knowledgeRateLimiter.isRateLimited(key)).toBe(true);
  });

  it('allows requests under the limit', () => {
    const key = `knowledge-ok-${Date.now()}-${Math.random()}`;
    expect(knowledgeRateLimiter.isRateLimited(key)).toBe(false);
  });
});

describe('global rate limiting', () => {
  it('blocks all requests after 200 total from different IPs', async () => {
    // Use a fresh module instance to avoid shared state from other tests
    vi.resetModules();
    vi.doMock('next/server', () => ({
      NextResponse: {
        json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status }),
      },
    }));

    const { rateLimiter: freshLimiter } = await import('@/lib/rate-limiter');

    // Fill up to the global capacity (200 requests) using unique keys
    // so no per-key limit is hit (per-key limit is 20)
    let limitedCount = 0;
    for (let i = 0; i < 250; i++) {
      const key = `global-test-${Date.now()}-${i}`;
      if (freshLimiter.isRateLimited(key)) {
        limitedCount++;
      }
    }

    // After 200 unique requests, the global limit should kick in
    // So we expect at least 50 to be limited (250 - 200 = 50)
    expect(limitedCount).toBeGreaterThanOrEqual(50);
  });
});

describe('getRateLimitResponse', () => {
  it('returns a 429 response', () => {
    const response = getRateLimitResponse();
    expect((response as any).status).toBe(429);
  });
});
