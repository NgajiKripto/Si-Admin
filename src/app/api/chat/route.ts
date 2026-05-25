import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const channel = searchParams.get("channel") || "";
  const status = searchParams.get("status") || "";

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        ...(search
          ? {
              customer: {
                name: { contains: search },
              },
            }
          : {}),
        ...(channel ? { channelId: channel } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        channelRef: true,
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data percakapan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId dan content diperlukan" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Content tidak boleh melebihi 5000 karakter" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        sender: "ADMIN",
        isRead: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pesan" },
      { status: 500 }
    );
  }
}
