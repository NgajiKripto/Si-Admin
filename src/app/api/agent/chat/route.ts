import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { agentGraph } from "@/lib/langchain/graph";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, customerId } = body;

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

    // Invoke the agent graph
    const result = await agentGraph.invoke({
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
