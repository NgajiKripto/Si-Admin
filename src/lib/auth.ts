import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

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
