import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        stockItem: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pergerakan stok" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockItemId, type, quantity, notes } = body;

    if (!stockItemId || !type || !quantity) {
      return NextResponse.json(
        { error: "stockItemId, type, dan quantity diperlukan" },
        { status: 400 }
      );
    }

    const movement = await prisma.stockMovement.create({
      data: {
        stockItemId,
        type,
        quantity: parseInt(quantity),
        notes: notes || null,
      },
    });

    // Update stock item quantity
    const quantityChange = type === "IN" ? parseInt(quantity) : -parseInt(quantity);
    await prisma.stockItem.update({
      where: { id: stockItemId },
      data: {
        quantity: { increment: quantityChange },
        ...(type === "IN" ? { lastRestocked: new Date() } : {}),
      },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return NextResponse.json(
      { error: "Gagal mencatat pergerakan stok" },
      { status: 500 }
    );
  }
}
