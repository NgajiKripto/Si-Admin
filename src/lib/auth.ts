import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

if (!process.env.ADMIN_SECRET) {
  throw new Error("ADMIN_SECRET environment variable is required");
}

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function requireAuth(request: NextRequest): NextResponse | null {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(ADMIN_SECRET);

  if (
    tokenBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(tokenBuffer, secretBuffer)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
