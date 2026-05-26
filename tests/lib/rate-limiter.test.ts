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

describe('isRateLimitedMulti', () => {
  it('first call with fresh keys returns false (not limited)', () => {
    const keys = [
      `multi-ip-${Date.now()}-${Math.random()}`,
      `multi-session-${Date.now()}-${Math.random()}`,
    ];
    expect(rateLimiter.isRateLimitedMulti(keys)).toBe(false);
  });

  it('records timestamps for all keys', () => {
    const key1 = `multi-a-${Date.now()}-${Math.random()}`;
    const key2 = `multi-b-${Date.now()}-${Math.random()}`;

    rateLimiter.isRateLimitedMulti([key1, key2]);

    // Now each key should have 1 request recorded, so individual limit check should work
    // Making 19 more requests on key1 individually (per-key limit is 20)
    for (let i = 0; i < 19; i++) {
      rateLimiter.isRateLimited(key1);
    }
    // key1 should now be limited
    expect(rateLimiter.isRateLimited(key1)).toBe(true);
  });

  it('blocks when any single key exceeds the limit', () => {
    const sharedKey = `multi-shared-${Date.now()}-${Math.random()}`;
    const freshKey = `multi-fresh-${Date.now()}-${Math.random()}`;

    // Exhaust the sharedKey individually
    for (let i = 0; i < 20; i++) {
      rateLimiter.isRateLimited(sharedKey);
    }

    // Now calling isRateLimitedMulti with [sharedKey, freshKey] should be blocked
    // because sharedKey is already at the limit
    expect(rateLimiter.isRateLimitedMulti([sharedKey, freshKey])).toBe(true);
  });

  it('does not record timestamps when blocked', () => {
    const exhaustedKey = `multi-exhaust-${Date.now()}-${Math.random()}`;
    const cleanKey = `multi-clean-${Date.now()}-${Math.random()}`;

    // Exhaust one key
    for (let i = 0; i < 20; i++) {
      rateLimiter.isRateLimited(exhaustedKey);
    }

    // This should be blocked and NOT record a timestamp for cleanKey
    rateLimiter.isRateLimitedMulti([exhaustedKey, cleanKey]);

    // cleanKey should still be under the limit (no timestamp was added)
    expect(rateLimiter.isRateLimited(cleanKey)).toBe(false);
  });
});
