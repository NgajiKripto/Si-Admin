import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const rating = searchParams.get("rating");

  try {
    const feedbacks = await prisma.feedback.findMany({
      where: {
        ...(rating ? { rating: parseInt(rating) } : {}),
      },
      include: {
        customer: true,
        conversation: {
          include: {
            channelRef: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { customerId, content, rating, conversationId, templateUsed } = body;

    if (!customerId || !content || !rating) {
      return NextResponse.json(
        { error: "customerId, content, dan rating diperlukan" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        customerId,
        content,
        rating: parseInt(rating),
        conversationId: conversationId || null,
        templateUsed: templateUsed || null,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Gagal membuat feedback" },
      { status: 500 }
    );
  }
}
