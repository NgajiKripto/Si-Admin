import { describe, it, expect, vi } from 'vitest';

// Mock next/server
vi.mock('next/server', () => {
  class MockHeaders {
    private headers: Map<string, string>;
    constructor(init?: Record<string, string>) {
      this.headers = new Map(Object.entries(init || {}));
    }
    get(name: string) { return this.headers.get(name) || null; }
    set(name: string, value: string) { this.headers.set(name, value); }
  }

  return {
    NextRequest: class {
      headers: MockHeaders;
      url: string;
      constructor(url: string, init?: { headers?: Record<string, string> }) {
        this.url = url;
        this.headers = new MockHeaders(init?.headers);
      }
    },
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status || 200,
      }),
    },
  };
});

import { requireAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('requireAuth', () => {
  it('returns null (allows) when correct token provided', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { 'x-admin-token': process.env.ADMIN_SECRET! },
    });
    const result = requireAuth(request);
    expect(result).toBeNull();
  });

  it('returns 401 when no token provided', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: {},
    });
    const result = requireAuth(request);
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(401);
  });

  it('returns 401 when wrong token provided', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { 'x-admin-token': 'wrong-token-value' },
    });
    const result = requireAuth(request);
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(401);
  });

  it('returns 401 when token has different length', () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { 'x-admin-token': 'x' },
    });
    const result = requireAuth(request);
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(401);
  });
});
