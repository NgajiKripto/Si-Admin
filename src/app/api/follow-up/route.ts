import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";

  try {
    // Auto-mark overdue items
    await prisma.followUp.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    const followUps = await prisma.followUp.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        customer: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data follow up" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, title, description, dueDate, priority } = body;

    if (!customerId || !title || !dueDate) {
      return NextResponse.json(
        { error: "customerId, title, dan dueDate diperlukan" },
        { status: 400 }
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        customerId,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        status: "PENDING",
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json(
      { error: "Gagal membuat follow up" },
      { status: 500 }
    );
  }
}
