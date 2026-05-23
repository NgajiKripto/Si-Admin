import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Entri tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching knowledge entry:", error);
    return NextResponse.json(
      { error: "Gagal mengambil entri pengetahuan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, category, tags, source, isActive } = body;

    const validCategories = [
      "CHAT_HISTORY",
      "FAQ",
      "PRODUCT_INFO",
      "SOP",
      "RESPONSE_TEMPLATE",
      "TONE_GUIDELINE",
    ];

    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Entri tidak ditemukan" },
        { status: 404 }
      );
    }

    const entry = await prisma.knowledgeEntry.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating knowledge entry:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui entri pengetahuan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Entri tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.knowledgeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Entri berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting knowledge entry:", error);
    return NextResponse.json(
      { error: "Gagal menghapus entri pengetahuan" },
      { status: 500 }
    );
  }
}
