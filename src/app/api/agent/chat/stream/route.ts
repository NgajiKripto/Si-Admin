import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getGraph } from "@/lib/langchain/graph";
import { createCallbacks } from "@/lib/langchain/callbacks";
import { getOpenAIConfig } from "@/lib/langchain/config";
import { rateLimiter } from "@/lib/rate-limiter";
import { getOrCreateSession } from "@/lib/session-helper";

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

    // Message length validation
    if (message.length > 5000) {
      return new Response(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", content: "Pesan terlalu panjang. Maksimal 5000 karakter." })}\n\n`
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

    // Rate limiting - use server-controlled identity, not client-supplied sessionId
    const rateLimitKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
    const rateLimitKeys = [rateLimitKey];
    if (sessionId) {
      rateLimitKeys.push(`session:${sessionId}`);
    }
    if (rateLimiter.isRateLimitedMulti(rateLimitKeys)) {
      return new Response(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", content: "Terlalu banyak permintaan. Silakan coba lagi nanti." })}\n\n`
        ),
        {
          status: 429,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    // Detect authentication status (do not block unauthenticated users)
    const adminToken = request.headers.get("x-admin-token");
    const isAuthenticated = adminToken === process.env.ADMIN_SECRET;

    // Create or reuse AgentSession
    const session = await getOrCreateSession(sessionId, customerId);

    const graph = getGraph("multi");

    // Create callbacks for observability
    const requestId = uuidv4();
    const { metricsHandler, tracingHandler, callbacks } = createCallbacks(
      requestId,
      session.id
    );

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream graph execution events and accumulate finalResponse
          let finalResponse = "";
          const eventStream = await graph.stream(
            {
              messages: [new HumanMessage(message)],
              sessionId: session.id,
              isAuthenticated,
            },
            { streamMode: "updates", callbacks, recursionLimit: getOpenAIConfig().maxIterations }
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

              // Accumulate finalResponse from stream events
              if (nodeOutput.finalResponse) {
                finalResponse = String(nodeOutput.finalResponse);
                const responseText = finalResponse;
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

          // Use accumulated finalResponse from stream (no second invocation needed)
          if (!finalResponse) {
            finalResponse = "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
          }

          // Save trace and update session
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

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", content: finalResponse, sessionId: session.id, requestId })}\n\n`
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
