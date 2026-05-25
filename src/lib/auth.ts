import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Fail-fast guard: in production, if ADMIN_SECRET is not configured the process
 * will crash at module load time (during import resolution) rather than silently
 * serving unauthenticated requests. This is intentional -- it prevents the
 * application from starting in an insecure state.
 */
if (isProduction && !process.env.ADMIN_SECRET) {
  throw new Error("ADMIN_SECRET environment variable is required in production");
}

if (!isProduction && !process.env.ADMIN_SECRET) {
  console.warn("[auth] ADMIN_SECRET not set, using fallback 'dev-admin-token' for development");
}

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-admin-token";

export function requireAuth(request: NextRequest): NextResponse | null {
  const token = request.headers.get("x-admin-token");
  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
