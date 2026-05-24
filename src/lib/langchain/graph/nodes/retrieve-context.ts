import { prisma } from "@/lib/prisma";
import { HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateScore(
  text: string,
  keywords: string[],
  totalDocs: number,
  docFrequencies: Map<string, number>
): number {
  const textLower = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const occurrences = (textLower.match(new RegExp(keyword, "g")) || [])
      .length;
    if (occurrences > 0) {
      const tf = occurrences / (occurrences + 1.2);
      const df = docFrequencies.get(keyword) || 1;
      const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5) + 1);
      score += tf * idf;
    }
  }

  return score;
}

export async function retrieveContextNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // Get the user query from the last HumanMessage
  const lastHumanMessage = [...state.messages]
    .reverse()
    .find((msg) => msg instanceof HumanMessage);

  if (!lastHumanMessage) {
    return { contextDocuments: [], currentStep: "retrieve_context" };
  }

  const query = String(lastHumanMessage.content);
  const keywords = tokenize(query);

  if (keywords.length === 0) {
    return { contextDocuments: [], currentStep: "retrieve_context" };
  }

  // Search KnowledgeEntry
  const knowledgeOrConditions = keywords.flatMap((keyword) => [
    { title: { contains: keyword } },
    { content: { contains: keyword } },
  ]);

  // Search AgentMemory (SEMANTIC and PROCEDURAL tiers)
  const memoryOrConditions = keywords.flatMap((keyword) => [
    { content: { contains: keyword } },
    { context: { contains: keyword } },
  ]);

  const [knowledgeEntries, memories] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      where: {
        isActive: true,
        OR: knowledgeOrConditions,
      },
      take: 50,
    }),
    prisma.agentMemory.findMany({
      where: {
        tier: { in: ["SEMANTIC", "PROCEDURAL"] },
        OR: memoryOrConditions,
      },
      take: 30,
    }),
  ]);

  const totalDocs = knowledgeEntries.length + memories.length;
  if (totalDocs === 0) {
    return { contextDocuments: [], currentStep: "retrieve_context" };
  }

  // Calculate document frequencies
  const docFrequencies = new Map<string, number>();
  for (const keyword of keywords) {
    let count = 0;
    for (const entry of knowledgeEntries) {
      if (
        (entry.title + " " + entry.content).toLowerCase().includes(keyword)
      ) {
        count++;
      }
    }
    for (const mem of memories) {
      if (mem.content.toLowerCase().includes(keyword)) {
        count++;
      }
    }
    docFrequencies.set(keyword, count);
  }

  // Score and rank knowledge entries
  const knowledgeResults: { title: string; content: string; score: number }[] =
    [];
  for (const entry of knowledgeEntries) {
    const text = entry.title + " " + entry.content;
    const score = calculateScore(text, keywords, totalDocs, docFrequencies);
    if (score > 0) {
      knowledgeResults.push({
        title: entry.title,
        content: entry.content,
        score,
      });
    }
  }
  knowledgeResults.sort((a, b) => b.score - a.score);

  // Score and rank memories
  const memoryResults: { content: string; tier: string; score: number }[] = [];
  for (const mem of memories) {
    const score = calculateScore(
      mem.content,
      keywords,
      totalDocs,
      docFrequencies
    );
    if (score > 0) {
      memoryResults.push({ content: mem.content, tier: mem.tier, score });
    }
  }
  memoryResults.sort((a, b) => b.score - a.score);

  // Format context documents
  const contextDocuments: string[] = [];

  // Top 5 knowledge entries
  for (const result of knowledgeResults.slice(0, 5)) {
    contextDocuments.push(`[Knowledge] ${result.title}: ${result.content}`);
  }

  // Top 3 memories
  for (const result of memoryResults.slice(0, 3)) {
    contextDocuments.push(`[Memory-${result.tier}] ${result.content}`);
  }

  return { contextDocuments, currentStep: "retrieve_context" };
}
