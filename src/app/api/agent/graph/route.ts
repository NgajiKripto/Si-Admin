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

    const relations = await prisma.knowledgeGraphRelation.findMany({
      include: {
        fromEntity: true,
        toEntity: true,
      },
      orderBy: { createdAt: "desc" },
    });

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
