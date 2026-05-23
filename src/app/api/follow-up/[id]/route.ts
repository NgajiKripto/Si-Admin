import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, title, description, dueDate, priority } = body;

    const followUp = await prisma.followUp.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui follow up" },
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
    await prisma.followUp.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Follow up berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting follow-up:", error);
    return NextResponse.json(
      { error: "Gagal menghapus follow up" },
      { status: 500 }
    );
  }
}
