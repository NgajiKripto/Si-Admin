import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getGraph } from "@/lib/langchain/graph";
import { createCallbacks } from "@/lib/langchain/callbacks";
import { getOpenAIConfig } from "@/lib/langchain/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, customerId, approvalId } = body;

    // Approval execution must go through the authenticated /api/agent/approval endpoint
    if (approvalId) {
      return NextResponse.json(
        { error: "Untuk menjalankan aksi yang telah disetujui, gunakan endpoint /api/agent/approval" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Field 'message' diperlukan" },
        { status: 400 }
      );
    }

    // Create or reuse AgentSession
    let session;
    if (sessionId) {
      session = await prisma.agentSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        session = await prisma.agentSession.create({
          data: {
            customerId: customerId || null,
            status: "ACTIVE",
          },
        });
      }
    } else {
      session = await prisma.agentSession.create({
        data: {
          customerId: customerId || null,
          status: "ACTIVE",
        },
      });
    }

    // Use multi-agent graph by default
    const graph = getGraph("multi");

    // Create callbacks for observability
    const requestId = uuidv4();
    const { metricsHandler, tracingHandler, callbacks } = createCallbacks(
      requestId,
      session.id
    );

    // Invoke the agent graph with callbacks
    const result = await graph.invoke(
      {
        messages: [new HumanMessage(message)],
        sessionId: session.id,
      },
      { callbacks, recursionLimit: getOpenAIConfig().maxIterations }
    );

    const finalResponse =
      result.finalResponse ||
      "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    // Save trace and update session with accumulated metrics
    const metrics = metricsHandler.getAccumulatedMetrics();
    await tracingHandler.saveTrace();
    await prisma.agentSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        totalTokens: metrics.totalTokens,
        totalLatencyMs: metrics.totalLatencyMs,
      },
    });

    return NextResponse.json({
      response: finalResponse,
      sessionId: session.id,
      requestId,
    });
  } catch (error) {
    console.error("Error in agent chat:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pesan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
