import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchByVector } from "@/lib/langchain/embeddings-service";

interface SearchResult {
  id: string;
  type: "knowledge" | "memory";
  title: string;
  content_preview: string;
  score: number;
  category?: string;
  tier?: string;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateScore(text: string, keywords: string[], totalDocs: number, docFrequencies: Map<string, number>): number {
  const textLower = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const occurrences = (textLower.match(new RegExp(keyword, "g")) || []).length;
    if (occurrences > 0) {
      // BM25-like scoring: TF * IDF
      const tf = occurrences / (occurrences + 1.2); // saturating TF
      const df = docFrequencies.get(keyword) || 1;
      const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5) + 1);
      score += tf * idf;
    }
  }

  return score;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 20 } = body;

    if (!query) {
      return NextResponse.json(
        { error: "query diperlukan" },
        { status: 400 }
      );
    }

    const keywords = tokenize(query);
    if (keywords.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Pre-filter at DB level with keyword matching, limit to 100 each
    const knowledgeOrConditions = keywords.flatMap((keyword) => [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ]);

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
        take: 100,
      }),
      prisma.agentMemory.findMany({
        where: {
          OR: memoryOrConditions,
        },
        take: 100,
      }),
    ]);

    const totalDocs = knowledgeEntries.length + memories.length;

    // Calculate document frequencies for each keyword
    const docFrequencies = new Map<string, number>();
    for (const keyword of keywords) {
      let count = 0;
      for (const entry of knowledgeEntries) {
        if ((entry.title + " " + entry.content).toLowerCase().includes(keyword)) {
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

    // BM25 results
    const bm25Results: SearchResult[] = [];

    for (const entry of knowledgeEntries) {
      const text = entry.title + " " + entry.content;
      const score = calculateScore(text, keywords, totalDocs, docFrequencies);
      if (score > 0) {
        bm25Results.push({
          id: entry.id,
          type: "knowledge",
          title: entry.title,
          content_preview: entry.content.substring(0, 150),
          score,
          category: entry.category,
        });
      }
    }

    for (const mem of memories) {
      const score = calculateScore(mem.content, keywords, totalDocs, docFrequencies);
      if (score > 0) {
        bm25Results.push({
          id: mem.id,
          type: "memory",
          title: mem.tier,
          content_preview: mem.content.substring(0, 150),
          score,
          tier: mem.tier,
        });
      }
    }

    // Sort BM25 results by score desc
    bm25Results.sort((a, b) => b.score - a.score);

    // Attempt vector search for hybrid results
    let vectorResults: Array<{
      id: string;
      type: "knowledge" | "memory";
      title: string;
      content_preview: string;
      sourceId: string;
    }> = [];

    try {
      const vectorHits = await searchByVector(query, 20);
      vectorResults = vectorHits.map((hit) => ({
        id: hit.sourceId,
        type: hit.sourceType === "KNOWLEDGE" ? "knowledge" as const : "memory" as const,
        title: hit.content.substring(0, 50),
        content_preview: hit.content.substring(0, 150),
        sourceId: hit.sourceId,
      }));
    } catch {
      // Vector search failed (no API key, no embeddings, etc.) - continue with BM25 only
    }

    // If no vector results, return BM25-only (normalized)
    if (vectorResults.length === 0) {
      const maxScore = Math.max(...bm25Results.map((r) => r.score), 1);
      for (const result of bm25Results) {
        result.score = Math.round((result.score / maxScore) * 100) / 100;
      }
      const limitedResults = bm25Results.slice(0, limit);
      return NextResponse.json({ results: limitedResults });
    }

    // Reciprocal Rank Fusion (RRF) with k=60
    const k = 60;
    const rrfScores = new Map<string, { result: SearchResult; score: number }>();

    // Process BM25 ranked results
    for (let rank = 0; rank < bm25Results.length; rank++) {
      const result = bm25Results[rank];
      const key = `${result.type}:${result.id}`;
      const rrfScore = 1 / (k + rank + 1);
      const existing = rrfScores.get(key);
      if (existing) {
        existing.score += rrfScore;
      } else {
        rrfScores.set(key, { result: { ...result, score: 0 }, score: rrfScore });
      }
    }

    // Process vector ranked results
    for (let rank = 0; rank < vectorResults.length; rank++) {
      const vr = vectorResults[rank];
      const key = `${vr.type}:${vr.id}`;
      const rrfScore = 1 / (k + rank + 1);
      const existing = rrfScores.get(key);
      if (existing) {
        existing.score += rrfScore;
      } else {
        // Create a new result entry for vector-only results
        rrfScores.set(key, {
          result: {
            id: vr.id,
            type: vr.type,
            title: vr.title,
            content_preview: vr.content_preview,
            score: 0,
          },
          score: rrfScore,
        });
      }
    }

    // Build final results sorted by RRF score
    const combinedResults: SearchResult[] = [];
    for (const [, { result, score }] of rrfScores) {
      combinedResults.push({ ...result, score: Math.round(score * 10000) / 10000 });
    }

    combinedResults.sort((a, b) => b.score - a.score);

    // Normalize to 0-1 scale
    const maxRRF = Math.max(...combinedResults.map((r) => r.score), 0.0001);
    for (const result of combinedResults) {
      result.score = Math.round((result.score / maxRRF) * 100) / 100;
    }

    const limitedResults = combinedResults.slice(0, limit);
    return NextResponse.json({ results: limitedResults });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Gagal melakukan pencarian" },
      { status: 500 }
    );
  }
}
