import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getGraph } from "@/lib/langchain/graph";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const { message, sessionId, customerId } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", content: "Field 'message' diperlukan" })}\n\n`
        ),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
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

    const graph = getGraph("multi");

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream graph execution events
          const eventStream = await graph.stream(
            {
              messages: [new HumanMessage(message)],
              sessionId: session.id,
            },
            { streamMode: "updates" }
          );

          for await (const event of eventStream) {
            // Each event is a dict of { nodeName: nodeOutput }
            for (const [nodeName, output] of Object.entries(event)) {
              const nodeOutput = output as Record<string, unknown>;

              // Emit tool-related events
              if (nodeName === "cs_agent" || nodeName === "stock_agent" || nodeName === "followup_agent") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_call", content: `Agent: ${nodeName}` })}\n\n`
                  )
                );
              }

              // Emit final response tokens
              if (nodeOutput.finalResponse) {
                const responseText = String(nodeOutput.finalResponse);
                // Stream the response token by token (word by word)
                const words = responseText.split(" ");
                for (const word of words) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "token", content: word + " " })}\n\n`
                    )
                  );
                }
              }
            }
          }

          // Send done event
          const result = await graph.invoke({
            messages: [new HumanMessage(message)],
            sessionId: session.id,
          });

          const finalResponse =
            result.finalResponse ||
            "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", content: finalResponse, sessionId: session.id })}\n\n`
            )
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", content: `Terjadi kesalahan: ${errorMessage}` })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      encoder.encode(
        `data: ${JSON.stringify({ type: "error", content: `Terjadi kesalahan: ${errorMessage}` })}\n\n`
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
