import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  batchStoreEmbeddings,
  getEmbeddingCoverage,
} from "@/lib/langchain/embeddings-service";

export async function GET() {
  try {
    const coverage = await getEmbeddingCoverage();
    return NextResponse.json(coverage);
  } catch (error) {
    console.error("Error getting embedding coverage:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik embedding" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Find knowledge entries without embeddings
    const allKnowledge = await prisma.knowledgeEntry.findMany({
      where: { isActive: true },
      select: { id: true, title: true, content: true },
    });

    const existingKnowledgeEmbeddings = await prisma.vectorEmbedding.findMany({
      where: { sourceType: "KNOWLEDGE" },
      select: { sourceId: true },
    });
    const knowledgeWithEmbeddings = new Set(
      existingKnowledgeEmbeddings.map((e) => e.sourceId)
    );

    const knowledgeWithout = allKnowledge.filter(
      (k) => !knowledgeWithEmbeddings.has(k.id)
    );

    // Find memories without embeddings
    const allMemories = await prisma.agentMemory.findMany({
      select: { id: true, content: true },
    });

    const existingMemoryEmbeddings = await prisma.vectorEmbedding.findMany({
      where: { sourceType: "MEMORY" },
      select: { sourceId: true },
    });
    const memoriesWithEmbeddings = new Set(
      existingMemoryEmbeddings.map((e) => e.sourceId)
    );

    const memoriesWithout = allMemories.filter(
      (m) => !memoriesWithEmbeddings.has(m.id)
    );

    // Build batch items
    const items: Array<{
      sourceType: "KNOWLEDGE" | "MEMORY";
      sourceId: string;
      content: string;
    }> = [];

    for (const entry of knowledgeWithout) {
      items.push({
        sourceType: "KNOWLEDGE",
        sourceId: entry.id,
        content: `${entry.title} ${entry.content}`,
      });
    }

    for (const mem of memoriesWithout) {
      items.push({
        sourceType: "MEMORY",
        sourceId: mem.id,
        content: mem.content,
      });
    }

    if (items.length === 0) {
      return NextResponse.json({
        status: "complete",
        message: "Semua entri sudah memiliki embedding",
        processed: 0,
      });
    }

    // Start batch processing asynchronously (fire-and-forget)
    const totalItems = items.length;
    batchStoreEmbeddings(items).catch((err) =>
      console.error("Batch embedding generation failed:", err)
    );

    return NextResponse.json({
      status: "processing",
      message: `Memulai generasi embedding untuk ${totalItems} entri`,
      totalItems,
      breakdown: {
        knowledge: knowledgeWithout.length,
        memories: memoriesWithout.length,
      },
    });
  } catch (error) {
    console.error("Error triggering embedding generation:", error);
    return NextResponse.json(
      { error: "Gagal memulai generasi embedding" },
      { status: 500 }
    );
  }
}
