import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const item = await prisma.stockItem.update({
      where: { id },
      data: body,
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
