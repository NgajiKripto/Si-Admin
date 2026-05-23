import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: "asc" },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        sender: "CUSTOMER",
        isRead: false,
      },
      data: { isRead: true },
    });

    // Reset unread count
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Gagal mengambil pesan" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui percakapan" },
      { status: 500 }
    );
  }
}
