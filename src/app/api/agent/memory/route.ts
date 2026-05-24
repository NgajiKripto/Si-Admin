import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TIERS = ["WORKING", "EPISODIC", "SEMANTIC", "PROCEDURAL"] as const;
const ARCHIVED_TIERS = ["WORKING_ARCHIVED", "EPISODIC_ARCHIVED", "SEMANTIC_ARCHIVED", "PROCEDURAL_ARCHIVED"] as const;
const ALL_VALID_TIERS = [...VALID_TIERS, ...ARCHIVED_TIERS] as const;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tier = searchParams.get("tier") || "";
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // Validate tier parameter if provided
    if (tier && !ALL_VALID_TIERS.includes(tier as typeof ALL_VALID_TIERS[number])) {
      return NextResponse.json(
        { error: "Tier tidak valid" },
        { status: 400 }
      );
    }

    const where = {
      // Exclude archived tiers from normal queries
      tier: tier ? { equals: tier } : { not: { contains: "_ARCHIVED" } },
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

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "content maksimal 50000 karakter" },
        { status: 400 }
      );
    }

    if (metadata && metadata.length > 10000) {
      return NextResponse.json(
        { error: "metadata maksimal 10000 karakter" },
        { status: 400 }
      );
    }

    const validTiers: readonly string[] = VALID_TIERS;
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
