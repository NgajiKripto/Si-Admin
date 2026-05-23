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

    const parsedQuantity = parseInt(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json(
        { error: "Quantity harus berupa bilangan bulat positif" },
        { status: 400 }
      );
    }

    // For OUT movements, check sufficient stock before proceeding
    if (type === "OUT") {
      const currentItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
        select: { quantity: true },
      });

      if (!currentItem) {
        return NextResponse.json(
          { error: "Item stok tidak ditemukan" },
          { status: 404 }
        );
      }

      if (currentItem.quantity < parsedQuantity) {
        return NextResponse.json(
          { error: "Stok tidak mencukupi" },
          { status: 400 }
        );
      }
    }

    // Wrap movement creation and quantity update in a transaction
    const quantityChange = type === "IN" ? parsedQuantity : -parsedQuantity;
    const movement = await prisma.$transaction(async (tx) => {
      const newMovement = await tx.stockMovement.create({
        data: {
          stockItemId,
          type,
          quantity: parsedQuantity,
          notes: notes || null,
        },
      });

      await tx.stockItem.update({
        where: { id: stockItemId },
        data: {
          quantity: { increment: quantityChange },
          ...(type === "IN" ? { lastRestocked: new Date() } : {}),
        },
      });

      return newMovement;
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
