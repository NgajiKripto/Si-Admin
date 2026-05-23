import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromEntityId, toEntityId, relationType, weight, metadata } = body;

    if (!fromEntityId || !toEntityId || !relationType) {
      return NextResponse.json(
        { error: "fromEntityId, toEntityId, dan relationType diperlukan" },
        { status: 400 }
      );
    }

    // Validate entities exist
    const [fromEntity, toEntity] = await Promise.all([
      prisma.knowledgeGraphEntity.findUnique({ where: { id: fromEntityId } }),
      prisma.knowledgeGraphEntity.findUnique({ where: { id: toEntityId } }),
    ]);

    if (!fromEntity || !toEntity) {
      return NextResponse.json(
        { error: "Entitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const relation = await prisma.knowledgeGraphRelation.create({
      data: {
        fromEntityId,
        toEntityId,
        relationType,
        weight: weight || 1.0,
        metadata: metadata || null,
      },
      include: {
        fromEntity: true,
        toEntity: true,
      },
    });

    return NextResponse.json(relation, { status: 201 });
  } catch (error) {
    console.error("Error creating relation:", error);
    return NextResponse.json(
      { error: "Gagal membuat relasi" },
      { status: 500 }
    );
  }
}
