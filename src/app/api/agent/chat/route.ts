import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getGraph } from "@/lib/langchain/graph";
import { getAgentTools } from "@/lib/langchain/tools";
import { createCallbacks } from "@/lib/langchain/callbacks";
import { getOpenAIConfig } from "@/lib/langchain/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, customerId, approvalId } = body;

    // Handle approval resume flow
    if (approvalId) {
      const queueItem = await prisma.humanApprovalQueue.findUnique({
        where: { id: approvalId },
      });

      if (!queueItem) {
        return NextResponse.json(
          { error: "Item persetujuan tidak ditemukan." },
          { status: 404 }
        );
      }

      if (queueItem.status === "APPROVED") {
        // Execute the stored action
        try {
          const payload = JSON.parse(queueItem.actionPayload) as {
            toolName: string;
            args: Record<string, unknown>;
          };

          const tools = getAgentTools();
          const tool = tools.find((t) => t.name === payload.toolName);

          if (!tool) {
            return NextResponse.json({
              response: `Tool '${payload.toolName}' tidak ditemukan.`,
              sessionId: queueItem.sessionId,
            });
          }

          const result = await (tool as unknown as { invoke: (args: Record<string, unknown>) => Promise<string> }).invoke(payload.args);
          return NextResponse.json({
            response: `Aksi telah disetujui dan dieksekusi. Hasil: ${result}`,
            sessionId: queueItem.sessionId,
          });
        } catch (execError) {
          return NextResponse.json({
            response: `Gagal mengeksekusi aksi: ${execError instanceof Error ? execError.message : "Unknown error"}`,
            sessionId: queueItem.sessionId,
          });
        }
      }

      if (queueItem.status === "REJECTED") {
        return NextResponse.json({
          response: "Aksi telah ditolak oleh admin.",
          sessionId: queueItem.sessionId,
        });
      }

      // Still pending
      return NextResponse.json({
        response: "Menunggu persetujuan admin.",
        sessionId: queueItem.sessionId,
      });
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
