import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const stepName = searchParams.get("stepName");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;
    if (stepName) where.stepName = stepName;
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    // Fetch all matching metrics (excluding TRACE entries for aggregation)
    const aggregationWhere = { ...where, stepName: stepName || { not: "TRACE" } };

    const allMetrics = await prisma.agentMetrics.findMany({
      where: aggregationWhere,
    });

    // Calculate aggregated stats
    const requestIds = new Set(allMetrics.map((m) => m.requestId));
    const totalRequests = requestIds.size;

    const llmCalls = allMetrics.filter((m) => m.stepName === "LLM_CALL");
    const avgLatencyMs =
      llmCalls.length > 0
        ? Math.round(
            llmCalls.reduce((sum, m) => sum + m.latencyMs, 0) / llmCalls.length
          )
        : 0;

    const totalTokensUsed = allMetrics.reduce(
      (sum, m) => sum + m.tokensUsed,
      0
    );
    const totalPromptTokens = allMetrics.reduce(
      (sum, m) => sum + m.promptTokens,
      0
    );
    const totalCompletionTokens = allMetrics.reduce(
      (sum, m) => sum + m.completionTokens,
      0
    );

    // Tool usage breakdown
    const toolCalls = allMetrics.filter(
      (m) => m.stepName === "TOOL_CALL" && m.toolName
    );
    const toolUsageMap = new Map<
      string,
      { total: number; success: number; failure: number }
    >();
    for (const tc of toolCalls) {
      const name = tc.toolName!;
      const existing = toolUsageMap.get(name) || {
        total: 0,
        success: 0,
        failure: 0,
      };
      existing.total++;
      if (tc.toolSuccess === true) existing.success++;
      if (tc.toolSuccess === false) existing.failure++;
      toolUsageMap.set(name, existing);
    }
    const toolUsage = Array.from(toolUsageMap.entries()).map(
      ([name, stats]) => ({
        toolName: name,
        ...stats,
      })
    );

    // Error rate
    const errorCount = allMetrics.filter((m) => m.errorMessage !== null).length;
    const errorRate =
      allMetrics.length > 0
        ? Math.round((errorCount / allMetrics.length) * 10000) / 100
        : 0;

    // Recent metrics (last 20)
    const recentMetrics = await prisma.agentMetrics.findMany({
      where: { ...where, stepName: { not: "TRACE" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      totalRequests,
      avgLatencyMs,
      totalTokensUsed,
      totalPromptTokens,
      totalCompletionTokens,
      toolUsage,
      errorRate,
      recentMetrics,
    });
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil metrik agent" },
      { status: 500 }
    );
  }
}
