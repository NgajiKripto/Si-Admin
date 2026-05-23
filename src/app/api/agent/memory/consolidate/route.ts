import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Working -> Episodic: Find working memories older than 1 hour
    const oldWorkingMemories = await prisma.agentMemory.findMany({
      where: {
        tier: "WORKING",
        createdAt: { lt: oneHourAgo },
      },
    });

    let workingToEpisodic = 0;
    if (oldWorkingMemories.length > 0) {
      // Combine similar working memories into one episodic summary
      const summary = oldWorkingMemories
        .map((m) => m.content)
        .join(" | ");

      await prisma.agentMemory.create({
        data: {
          tier: "EPISODIC",
          content: `Ringkasan: ${summary.substring(0, 500)}`,
          context: `Konsolidasi dari ${oldWorkingMemories.length} memori kerja`,
          strength: 0.8,
          decayFactor: 0.9,
          metadata: JSON.stringify({
            sourceIds: oldWorkingMemories.map((m) => m.id),
            consolidatedAt: now.toISOString(),
          }),
        },
      });

      // Lower strength of originals
      await prisma.agentMemory.updateMany({
        where: {
          id: { in: oldWorkingMemories.map((m) => m.id) },
        },
        data: { strength: 0.3 },
      });

      workingToEpisodic = oldWorkingMemories.length;
    }

    // Episodic -> Semantic: Find episodic memories older than 24 hours
    const oldEpisodicMemories = await prisma.agentMemory.findMany({
      where: {
        tier: "EPISODIC",
        createdAt: { lt: oneDayAgo },
      },
    });

    let episodicToSemantic = 0;
    if (oldEpisodicMemories.length > 0) {
      // Extract key facts into semantic entries
      for (const mem of oldEpisodicMemories) {
        await prisma.agentMemory.create({
          data: {
            tier: "SEMANTIC",
            content: `Fakta: ${mem.content.substring(0, 300)}`,
            context: `Diekstrak dari memori episodik`,
            strength: 0.9,
            decayFactor: 0.95,
            metadata: JSON.stringify({
              sourceId: mem.id,
              consolidatedAt: now.toISOString(),
            }),
          },
        });
      }
      episodicToSemantic = oldEpisodicMemories.length;
    }

    // Semantic -> Procedural: Find semantic memories accessed 3+ times
    const frequentSemanticMemories = await prisma.agentMemory.findMany({
      where: {
        tier: "SEMANTIC",
        accessCount: { gte: 3 },
      },
    });

    let semanticToProcedural = 0;
    if (frequentSemanticMemories.length > 0) {
      for (const mem of frequentSemanticMemories) {
        // Check if procedural already exists for this source
        const existing = await prisma.agentMemory.findFirst({
          where: {
            tier: "PROCEDURAL",
            metadata: { contains: mem.id },
          },
        });

        if (!existing) {
          await prisma.agentMemory.create({
            data: {
              tier: "PROCEDURAL",
              content: `Pola: ${mem.content.substring(0, 300)}`,
              context: `Pola dari memori semantik yang sering diakses`,
              strength: 1.0,
              decayFactor: 0.99,
              metadata: JSON.stringify({
                sourceId: mem.id,
                accessCount: mem.accessCount,
                consolidatedAt: now.toISOString(),
              }),
            },
          });
          semanticToProcedural++;
        }
      }
    }

    return NextResponse.json({
      consolidated: {
        working_to_episodic: workingToEpisodic,
        episodic_to_semantic: episodicToSemantic,
        semantic_to_procedural: semanticToProcedural,
      },
    });
  } catch (error) {
    console.error("Error consolidating memory:", error);
    return NextResponse.json(
      { error: "Gagal mengkonsolidasi memori" },
      { status: 500 }
    );
  }
}
