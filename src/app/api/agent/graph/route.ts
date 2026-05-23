import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const entities = await prisma.knowledgeGraphEntity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        fromRelations: {
          include: { toEntity: true },
        },
        toRelations: {
          include: { fromEntity: true },
        },
      },
    });

    // Extract relations from entities to avoid redundant query
    const relationsMap = new Map<string, { id: string; fromEntityId: string; toEntityId: string; relationType: string; weight: number; metadata: string | null; createdAt: Date; fromEntity: { id: string; name: string; type: string }; toEntity: { id: string; name: string; type: string } }>();
    for (const entity of entities) {
      for (const rel of entity.fromRelations) {
        relationsMap.set(rel.id, {
          id: rel.id,
          fromEntityId: rel.fromEntityId,
          toEntityId: rel.toEntityId,
          relationType: rel.relationType,
          weight: rel.weight,
          metadata: rel.metadata,
          createdAt: rel.createdAt,
          fromEntity: { id: entity.id, name: entity.name, type: entity.type },
          toEntity: { id: rel.toEntity.id, name: rel.toEntity.name, type: rel.toEntity.type },
        });
      }
    }

    const relations = Array.from(relationsMap.values());

    return NextResponse.json({ entities, relations });
  } catch (error) {
    console.error("Error fetching knowledge graph:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data graf pengetahuan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, properties } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name dan type diperlukan" },
        { status: 400 }
      );
    }

    if (name.length > 500) {
      return NextResponse.json(
        { error: "name maksimal 500 karakter" },
        { status: 400 }
      );
    }

    if (properties && properties.length > 10000) {
      return NextResponse.json(
        { error: "properties maksimal 10000 karakter" },
        { status: 400 }
      );
    }

    if (properties) {
      try {
        JSON.parse(properties);
      } catch {
        return NextResponse.json(
          { error: "properties harus berupa JSON yang valid" },
          { status: 400 }
        );
      }
    }

    const validTypes = ["CUSTOMER", "PRODUCT", "ISSUE", "SOLUTION", "TOPIC"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipe entitas tidak valid" },
        { status: 400 }
      );
    }

    const entity = await prisma.knowledgeGraphEntity.create({
      data: {
        name,
        type,
        properties: properties || null,
      },
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error("Error creating entity:", error);
    return NextResponse.json(
      { error: "Gagal membuat entitas" },
      { status: 500 }
    );
  }
}
