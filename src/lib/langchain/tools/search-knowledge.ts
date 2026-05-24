import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export const searchKnowledgeTool = new DynamicStructuredTool({
  name: "search_knowledge",
  description:
    "Mencari informasi dari knowledge base menggunakan kata kunci. Gunakan untuk menjawab pertanyaan pelanggan tentang produk, layanan, atau kebijakan.",
  schema: z.object({
    query: z.string().describe("Kata kunci pencarian"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Jumlah maksimal hasil pencarian"),
  }),
  func: async ({ query, limit }) => {
    const keywords = tokenize(query);
    if (keywords.length === 0) {
      return "Tidak ada hasil pencarian ditemukan.";
    }

    const orConditions = keywords.flatMap((keyword) => [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ]);

    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      where: {
        isActive: true,
        OR: orConditions,
      },
      take: 100,
    });

    if (knowledgeEntries.length === 0) {
      return "Tidak ada hasil pencarian ditemukan.";
    }

    const totalDocs = knowledgeEntries.length;
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
      docFrequencies.set(keyword, count);
    }

    const results: { title: string; content: string; category: string; score: number }[] = [];
    for (const entry of knowledgeEntries) {
      const text = entry.title + " " + entry.content;
      const score = calculateScore(text, keywords, totalDocs, docFrequencies);
      if (score > 0) {
        results.push({
          title: entry.title,
          content: entry.content.substring(0, 300),
          category: entry.category,
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);

    if (limitedResults.length === 0) {
      return "Tidak ada hasil pencarian ditemukan.";
    }

    return limitedResults
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title} (${r.category})\n${r.content}`
      )
      .join("\n\n");
  },
});
