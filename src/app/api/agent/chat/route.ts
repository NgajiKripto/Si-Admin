import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getGraph } from "@/lib/langchain/graph";
import { getAgentTools } from "@/lib/langchain/tools";

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

    // Invoke the agent graph
    const result = await graph.invoke({
      messages: [new HumanMessage(message)],
      sessionId: session.id,
    });

    const finalResponse =
      result.finalResponse ||
      "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    return NextResponse.json({
      response: finalResponse,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error in agent chat:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pesan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
