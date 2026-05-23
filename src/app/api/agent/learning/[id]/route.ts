import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { applied, impact } = body;

    const existing = await prisma.learningInsight.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Insight tidak ditemukan" },
        { status: 404 }
      );
    }

    const insight = await prisma.learningInsight.update({
      where: { id },
      data: {
        ...(applied !== undefined ? { applied } : {}),
        ...(applied === true ? { appliedAt: new Date() } : {}),
        ...(applied === false ? { appliedAt: null } : {}),
        ...(impact !== undefined ? { impact } : {}),
      },
    });

    return NextResponse.json(insight);
  } catch (error) {
    console.error("Error updating learning insight:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui insight" },
      { status: 500 }
    );
  }
}
