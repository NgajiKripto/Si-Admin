import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Fetch all active knowledge entries and memories
    const [knowledgeEntries, memories] = await Promise.all([
      prisma.knowledgeEntry.findMany({ where: { isActive: true } }),
      prisma.agentMemory.findMany(),
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

    const results: SearchResult[] = [];

    // Score knowledge entries
    for (const entry of knowledgeEntries) {
      const text = entry.title + " " + entry.content;
      const score = calculateScore(text, keywords, totalDocs, docFrequencies);
      if (score > 0) {
        results.push({
          id: entry.id,
          type: "knowledge",
          title: entry.title,
          content_preview: entry.content.substring(0, 150),
          score,
          category: entry.category,
        });
      }
    }

    // Score memories
    for (const mem of memories) {
      const score = calculateScore(mem.content, keywords, totalDocs, docFrequencies);
      if (score > 0) {
        results.push({
          id: mem.id,
          type: "memory",
          title: mem.tier,
          content_preview: mem.content.substring(0, 150),
          score,
          tier: mem.tier,
        });
      }
    }

    // Normalize scores to 0-1
    const maxScore = Math.max(...results.map((r) => r.score), 1);
    for (const result of results) {
      result.score = Math.round((result.score / maxScore) * 100) / 100;
    }

    // Sort by score desc and limit
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({ results: limitedResults });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Gagal melakukan pencarian" },
      { status: 500 }
    );
  }
}
