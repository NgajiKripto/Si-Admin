import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "";
  const applied = searchParams.get("applied");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const where = {
      ...(type ? { type } : {}),
      ...(applied !== null && applied !== ""
        ? { applied: applied === "true" }
        : {}),
    };

    const insights = await prisma.learningInsight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching learning insights:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pembelajaran" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, source, confidence } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "type dan content diperlukan" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "content maksimal 50000 karakter" },
        { status: 400 }
      );
    }

    const validTypes = ["PATTERN", "IMPROVEMENT", "SUGGESTION", "CORRECTION"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipe tidak valid" },
        { status: 400 }
      );
    }

    const insight = await prisma.learningInsight.create({
      data: {
        type,
        content,
        source: source || null,
        confidence: confidence || 0.5,
      },
    });

    return NextResponse.json(insight, { status: 201 });
  } catch (error) {
    console.error("Error creating learning insight:", error);
    return NextResponse.json(
      { error: "Gagal membuat insight pembelajaran" },
      { status: 500 }
    );
  }
}
