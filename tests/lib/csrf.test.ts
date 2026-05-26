import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { validateCsrf } from '@/lib/csrf';

function createRequest(method: string, headers: Record<string, string> = {}, url = 'http://localhost:3000/api/test') {
  return new NextRequest(url, {
    method,
    headers,
  });
}

describe('validateCsrf', () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGIN;
  });

  it('GET requests always pass (return null)', () => {
    const req = createRequest('GET');
    expect(validateCsrf(req)).toBeNull();
  });

  it('HEAD requests always pass', () => {
    const req = createRequest('HEAD');
    expect(validateCsrf(req)).toBeNull();
  });

  it('OPTIONS requests always pass', () => {
    const req = createRequest('OPTIONS');
    expect(validateCsrf(req)).toBeNull();
  });

  it('POST with matching Origin header passes', () => {
    const req = createRequest('POST', {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
    });
    expect(validateCsrf(req)).toBeNull();
  });

  it('POST with mismatched Origin header returns 403', () => {
    const req = createRequest('POST', {
      host: 'localhost:3000',
      origin: 'http://evil.com',
    });
    const result = validateCsrf(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('POST with matching Referer header passes when Origin is absent', () => {
    const req = createRequest('POST', {
      host: 'localhost:3000',
      referer: 'http://localhost:3000/some/page',
    });
    expect(validateCsrf(req)).toBeNull();
  });

  it('POST with mismatched Referer returns 403', () => {
    const req = createRequest('POST', {
      host: 'localhost:3000',
      referer: 'http://evil.com/attack',
    });
    const result = validateCsrf(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('POST with no Origin or Referer returns null (allowed by default when no ALLOWED_ORIGIN set)', () => {
    const req = createRequest('POST', {
      host: 'localhost:3000',
    });
    expect(validateCsrf(req)).toBeNull();
  });

  describe('with ALLOWED_ORIGIN env var set', () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN = 'https://myapp.com';
    });

    it('validates Origin against ALLOWED_ORIGIN', () => {
      const req = createRequest('POST', {
        host: 'localhost:3000',
        origin: 'https://myapp.com',
      });
      expect(validateCsrf(req)).toBeNull();
    });

    it('rejects Origin that does not match ALLOWED_ORIGIN', () => {
      const req = createRequest('POST', {
        host: 'localhost:3000',
        origin: 'https://evil.com',
      });
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it('validates Referer against ALLOWED_ORIGIN when Origin is absent', () => {
      const req = createRequest('POST', {
        host: 'localhost:3000',
        referer: 'https://myapp.com/page',
      });
      expect(validateCsrf(req)).toBeNull();
    });

    it('rejects Referer that does not match ALLOWED_ORIGIN', () => {
      const req = createRequest('POST', {
        host: 'localhost:3000',
        referer: 'https://evil.com/page',
      });
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it('rejects POST with no Origin or Referer when ALLOWED_ORIGIN is set', () => {
      const req = createRequest('POST', {
        host: 'localhost:3000',
      });
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });
  });

  it('PUT requests are also checked', () => {
    const req = createRequest('PUT', {
      host: 'localhost:3000',
      origin: 'http://evil.com',
    });
    const result = validateCsrf(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('DELETE requests are also checked', () => {
    const req = createRequest('DELETE', {
      host: 'localhost:3000',
      origin: 'http://evil.com',
    });
    const result = validateCsrf(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});
