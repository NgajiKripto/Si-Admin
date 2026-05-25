import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";

  try {
    const items = await prisma.stockItem.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching stock items:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data stok" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, sku, categoryId, quantity, unit, price, minThreshold } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json(
        { error: "name, sku, dan categoryId diperlukan" },
        { status: 400 }
      );
    }

    const item = await prisma.stockItem.create({
      data: {
        name,
        sku,
        categoryId,
        quantity: quantity || 0,
        unit: unit || "pcs",
        price: price || 0,
        minThreshold: minThreshold || 5,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating stock item:", error);
    return NextResponse.json(
      { error: "Gagal membuat item stok" },
      { status: 500 }
    );
  }
}
