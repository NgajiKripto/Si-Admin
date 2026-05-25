import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

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
  const authError = requireAuth(request);
  if (authError) return authError;

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
  const authError = requireAuth(request);
  if (authError) return authError;

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
    const { name, type, isActive, config } = body;
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (isActive !== undefined) data.isActive = isActive;
    if (config !== undefined) data.config = config;

    const channel = await prisma.channel.update({
      where: { id },
      data,
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
  const authError = requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID diperlukan" },
      { status: 400 }
    );
  }

  try {
    // Check if channel has related conversations
    const conversationCount = await prisma.conversation.count({
      where: { channelId: id },
    });

    if (conversationCount > 0) {
      return NextResponse.json(
        { error: "Channel tidak dapat dihapus karena masih memiliki percakapan terkait" },
        { status: 400 }
      );
    }

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
