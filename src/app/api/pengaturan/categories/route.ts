import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.stockCategory.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name diperlukan" },
        { status: 400 }
      );
    }

    // Find or create a business profile to link to
    let profile = await prisma.businessProfile.findFirst();
    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          name: "Toko Serba Ada",
          type: "Retail",
          description: "",
        },
      });
    }

    const category = await prisma.stockCategory.create({
      data: {
        name,
        description: description || null,
        businessId: profile.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID diperlukan" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const category = await prisma.stockCategory.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID diperlukan" },
      { status: 400 }
    );
  }

  try {
    // Check if category has items
    const itemCount = await prisma.stockItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { error: "Kategori masih memiliki item stok" },
        { status: 400 }
      );
    }

    await prisma.stockCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
