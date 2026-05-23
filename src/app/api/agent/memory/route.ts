import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tier = searchParams.get("tier") || "";
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const where = {
      ...(tier ? { tier } : {}),
      ...(search
        ? {
            OR: [
              { content: { contains: search } },
              { context: { contains: search } },
            ],
          }
        : {}),
    };

    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data memori" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, content, context, strength, decayFactor, metadata } = body;

    if (!tier || !content) {
      return NextResponse.json(
        { error: "tier dan content diperlukan" },
        { status: 400 }
      );
    }

    const validTiers = ["WORKING", "EPISODIC", "SEMANTIC", "PROCEDURAL"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Tier tidak valid" },
        { status: 400 }
      );
    }

    const memory = await prisma.agentMemory.create({
      data: {
        tier,
        content,
        context: context || null,
        strength: strength || 1.0,
        decayFactor: decayFactor || 1.0,
        metadata: metadata || null,
      },
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    console.error("Error creating memory:", error);
    return NextResponse.json(
      { error: "Gagal membuat memori" },
      { status: 500 }
    );
  }
}
