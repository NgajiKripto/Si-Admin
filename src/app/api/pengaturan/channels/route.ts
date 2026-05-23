import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data channel" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, config } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name dan type diperlukan" },
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

    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        config: config || null,
        businessId: profile.id,
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Gagal membuat channel" },
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

    const channel = await prisma.channel.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui channel" },
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
    await prisma.channel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Gagal menghapus channel" },
      { status: 500 }
    );
  }
}
