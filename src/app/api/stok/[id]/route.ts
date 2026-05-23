import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, sku, categoryId, quantity, minThreshold, unit, price } = body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (sku !== undefined) data.sku = sku;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (quantity !== undefined) data.quantity = quantity;
    if (minThreshold !== undefined) data.minThreshold = minThreshold;
    if (unit !== undefined) data.unit = unit;
    if (price !== undefined) data.price = price;

    const item = await prisma.stockItem.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating stock item:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui item stok" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.stockMovement.deleteMany({
      where: { stockItemId: id },
    });

    await prisma.stockItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock item:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item stok" },
      { status: 500 }
    );
  }
}
