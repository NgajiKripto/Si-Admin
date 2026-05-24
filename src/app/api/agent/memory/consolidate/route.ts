import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  summarizeWorkingMemories,
  extractSemanticFacts,
  identifyProceduralPatterns,
} from "@/lib/langchain/consolidation";
import { storeEmbedding } from "@/lib/langchain/embeddings-service";

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
      // Use LLM to generate a meaningful episodic summary
      const summary = await summarizeWorkingMemories(
        oldWorkingMemories.map((m) => ({ content: m.content, context: m.context }))
      );

      const episodicMemory = await prisma.agentMemory.create({
        data: {
          tier: "EPISODIC",
          content: summary,
          context: `Konsolidasi dari ${oldWorkingMemories.length} memori kerja`,
          strength: 0.8,
          decayFactor: 0.9,
          metadata: JSON.stringify({
            sourceIds: oldWorkingMemories.map((m) => m.id),
            consolidatedAt: now.toISOString(),
          }),
        },
      });

      // Fire-and-forget: generate embedding for new episodic memory
      storeEmbedding("MEMORY", episodicMemory.id, episodicMemory.content).catch((err) =>
        console.error("Failed to generate embedding for episodic memory:", err)
      );

      // Delete consumed working memories after promotion
      await prisma.agentMemory.deleteMany({
        where: {
          id: { in: oldWorkingMemories.map((m) => m.id) },
        },
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
      for (const mem of oldEpisodicMemories) {
        // Use LLM to extract discrete facts
        const facts = await extractSemanticFacts(mem.content);

        for (const fact of facts) {
          const semanticMemory = await prisma.agentMemory.create({
            data: {
              tier: "SEMANTIC",
              content: fact,
              context: `Diekstrak dari memori episodik`,
              strength: 0.9,
              decayFactor: 0.95,
              metadata: JSON.stringify({
                sourceId: mem.id,
                consolidatedAt: now.toISOString(),
              }),
            },
          });

          // Fire-and-forget: generate embedding for new semantic memory
          storeEmbedding("MEMORY", semanticMemory.id, semanticMemory.content).catch((err) =>
            console.error("Failed to generate embedding for semantic memory:", err)
          );
        }
      }

      // Delete consumed episodic memories after promotion
      await prisma.agentMemory.deleteMany({
        where: {
          id: { in: oldEpisodicMemories.map((m) => m.id) },
        },
      });

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
    const promotedSemanticIds: string[] = [];
    if (frequentSemanticMemories.length > 0) {
      // Check which ones don't already have procedural entries
      const toPromote: typeof frequentSemanticMemories = [];
      for (const mem of frequentSemanticMemories) {
        const existing = await prisma.agentMemory.findFirst({
          where: {
            tier: "PROCEDURAL",
            metadata: { contains: mem.id },
          },
        });

        if (!existing) {
          toPromote.push(mem);
        }
      }

      if (toPromote.length > 0) {
        // Use LLM to identify procedural patterns from all semantic contents
        const patternContent = await identifyProceduralPatterns(
          toPromote.map((m) => m.content)
        );

        const proceduralMemory = await prisma.agentMemory.create({
          data: {
            tier: "PROCEDURAL",
            content: patternContent,
            context: `Pola dari ${toPromote.length} memori semantik yang sering diakses`,
            strength: 1.0,
            decayFactor: 0.99,
            metadata: JSON.stringify({
              sourceIds: toPromote.map((m) => m.id),
              accessCounts: toPromote.map((m) => m.accessCount),
              consolidatedAt: now.toISOString(),
            }),
          },
        });

        // Fire-and-forget: generate embedding for new procedural memory
        storeEmbedding("MEMORY", proceduralMemory.id, proceduralMemory.content).catch((err) =>
          console.error("Failed to generate embedding for procedural memory:", err)
        );

        for (const mem of toPromote) {
          promotedSemanticIds.push(mem.id);
        }
        semanticToProcedural = toPromote.length;
      }

      // Delete consumed semantic memories after promotion
      if (promotedSemanticIds.length > 0) {
        await prisma.agentMemory.deleteMany({
          where: {
            id: { in: promotedSemanticIds },
          },
        });
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
