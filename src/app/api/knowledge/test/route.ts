import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "question diperlukan" },
        { status: 400 }
      );
    }

    // Extract keywords from the question (simple tokenization)
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    // Fetch all active knowledge entries
    const entries = await prisma.knowledgeEntry.findMany({
      where: { isActive: true },
    });

    // Score entries by keyword match relevance
    const scoredEntries = entries
      .map((entry) => {
        const titleLower = entry.title.toLowerCase();
        const contentLower = entry.content.toLowerCase();
        const tagsLower = (entry.tags || "").toLowerCase();

        let score = 0;
        for (const keyword of keywords) {
          if (titleLower.includes(keyword)) score += 3;
          if (contentLower.includes(keyword)) score += 1;
          if (tagsLower.includes(keyword)) score += 2;
        }

        return {
          id: entry.id,
          title: entry.title,
          category: entry.category,
          content: entry.content,
          relevance: score,
        };
      })
      .filter((entry) => entry.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

    // Construct answer from top matches
    let answer = "";
    if (scoredEntries.length > 0) {
      const topEntries = scoredEntries.slice(0, 3);
      answer = topEntries
        .map((entry) => {
          const preview =
            entry.content.length > 200
              ? entry.content.substring(0, 200) + "..."
              : entry.content;
          return preview;
        })
        .join("\n\n");
    } else {
      answer =
        "Maaf, saya tidak menemukan informasi yang relevan untuk pertanyaan ini dalam basis pengetahuan.";
    }

    const matches = scoredEntries.map(({ id, title, category, relevance }) => ({
      id,
      title,
      category,
      relevance,
    }));

    return NextResponse.json({ answer, matches });
  } catch (error) {
    console.error("Error testing knowledge:", error);
    return NextResponse.json(
      { error: "Gagal menguji pengetahuan" },
      { status: 500 }
    );
  }
}
