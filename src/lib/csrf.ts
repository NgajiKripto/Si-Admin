import { NextRequest, NextResponse } from "next/server";

/**
 * Validates CSRF by checking Origin/Referer headers against the Host header.
 * Returns null if the request is safe, or a 403 Response if CSRF check fails.
 *
 * Only applies to mutating methods (POST, PUT, DELETE, PATCH).
 * GET, HEAD, OPTIONS are always allowed.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Safe methods don't need CSRF checks
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If ALLOWED_ORIGIN env var is set, check against it
  if (allowedOrigin) {
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const allowedUrl = new URL(allowedOrigin);
        if (originUrl.host === allowedUrl.host) {
          return null;
        }
      } catch {
        // Invalid URL
      }
      return NextResponse.json(
        { error: "CSRF validation failed: Origin mismatch" },
        { status: 403 }
      );
    }
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const allowedUrl = new URL(allowedOrigin);
        if (refererUrl.host === allowedUrl.host) {
          return null;
        }
      } catch {
        // Invalid URL
      }
      return NextResponse.json(
        { error: "CSRF validation failed: Referer mismatch" },
        { status: 403 }
      );
    }
    // No Origin or Referer header present - reject for safety
    return NextResponse.json(
      { error: "CSRF validation failed: Missing Origin or Referer header" },
      { status: 403 }
    );
  }

  // Fallback: Check Origin/Referer against Host header
  if (!host) {
    return null; // Can't validate without Host
  }

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid URL
    }
    return NextResponse.json(
      { error: "CSRF validation failed: Origin mismatch" },
      { status: 403 }
    );
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid URL
    }
    return NextResponse.json(
      { error: "CSRF validation failed: Referer mismatch" },
      { status: 403 }
    );
  }

  // No Origin or Referer header - allow (some same-origin requests omit these)
  return null;
}
