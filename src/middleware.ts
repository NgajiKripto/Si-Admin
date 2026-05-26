import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateCsrf } from "@/lib/csrf";

export function middleware(request: NextRequest) {
  // Block .db file access (case-insensitive, URL-decoded)
  const decodedPath = decodeURIComponent(request.nextUrl.pathname);
  if (/\.db/i.test(decodedPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CSRF protection for API mutating requests
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  // NOTE: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration and
  // inline scripts. This is a known trade-off that reduces CSP's XSS protection.
  // For a stricter CSP in the future, implement nonce-based script loading via
  // a custom Document component and pass the nonce to Next.js Script components.
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
