import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Memory by tier
    const [workingCount, episodicCount, semanticCount, proceduralCount] =
      await Promise.all([
        prisma.agentMemory.count({ where: { tier: "WORKING" } }),
        prisma.agentMemory.count({ where: { tier: "EPISODIC" } }),
        prisma.agentMemory.count({ where: { tier: "SEMANTIC" } }),
        prisma.agentMemory.count({ where: { tier: "PROCEDURAL" } }),
      ]);

    const memoryByTier = {
      working: workingCount,
      episodic: episodicCount,
      semantic: semanticCount,
      procedural: proceduralCount,
    };

    // Knowledge coverage
    const [chatHistory, faq, productInfo, sop, responseTemplate, toneGuideline] =
      await Promise.all([
        prisma.knowledgeEntry.count({ where: { category: "CHAT_HISTORY" } }),
        prisma.knowledgeEntry.count({ where: { category: "FAQ" } }),
        prisma.knowledgeEntry.count({ where: { category: "PRODUCT_INFO" } }),
        prisma.knowledgeEntry.count({ where: { category: "SOP" } }),
        prisma.knowledgeEntry.count({ where: { category: "RESPONSE_TEMPLATE" } }),
        prisma.knowledgeEntry.count({ where: { category: "TONE_GUIDELINE" } }),
      ]);

    const knowledgeCoverage = {
      CHAT_HISTORY: chatHistory,
      FAQ: faq,
      PRODUCT_INFO: productInfo,
      SOP: sop,
      RESPONSE_TEMPLATE: responseTemplate,
      TONE_GUIDELINE: toneGuideline,
    };

    // Learning stats
    const [totalInsights, appliedInsights, insights] = await Promise.all([
      prisma.learningInsight.count(),
      prisma.learningInsight.count({ where: { applied: true } }),
      prisma.learningInsight.findMany({ select: { confidence: true } }),
    ]);

    const avgConfidence =
      insights.length > 0
        ? Math.round(
            (insights.reduce((sum, i) => sum + i.confidence, 0) /
              insights.length) *
              100
          ) / 100
        : 0;

    const learningStats = {
      total: totalInsights,
      applied: appliedInsights,
      pending: totalInsights - appliedInsights,
      avgConfidence,
    };

    // Graph stats
    const [entityCount, relationCount] = await Promise.all([
      prisma.knowledgeGraphEntity.count(),
      prisma.knowledgeGraphRelation.count(),
    ]);

    const graphStats = {
      entities: entityCount,
      relations: relationCount,
    };

    // Recent activity
    const [lastMemory, lastInsight] = await Promise.all([
      prisma.agentMemory.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.learningInsight.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

    const recentActivity = {
      lastMemoryCreated: lastMemory?.createdAt || null,
      lastInsightCreated: lastInsight?.createdAt || null,
      lastConsolidation: null,
    };

    // Response quality from Feedback model
    const feedbacks = await prisma.feedback.findMany({
      select: { rating: true },
    });

    const averageRating =
      feedbacks.length > 0
        ? Math.round(
            (feedbacks.reduce((sum, f) => sum + f.rating, 0) /
              feedbacks.length) *
              100
          ) / 100
        : 0;

    const responseQuality = {
      averageRating,
      totalFeedbacks: feedbacks.length,
    };

    return NextResponse.json({
      memoryByTier,
      knowledgeCoverage,
      learningStats,
      graphStats,
      recentActivity,
      responseQuality,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil metrik kesehatan" },
      { status: 500 }
    );
  }
}
