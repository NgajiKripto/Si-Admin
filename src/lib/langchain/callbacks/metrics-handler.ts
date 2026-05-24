import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { prisma } from "@/lib/prisma";

export class MetricsHandler extends BaseCallbackHandler {
  name = "MetricsHandler";

  private requestId: string;
  private sessionId: string;

  private llmStartTimes: Map<string, number> = new Map();
  private toolStartTimes: Map<string, number> = new Map();
  private toolNames: Map<string, string> = new Map();
  private chainStartTimes: Map<string, number> = new Map();

  private totalTokens = 0;
  private totalLatencyMs = 0;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;

  constructor(requestId: string, sessionId: string) {
    super();
    this.requestId = requestId;
    this.sessionId = sessionId;
  }

  getAccumulatedMetrics() {
    return {
      totalTokens: this.totalTokens,
      totalLatencyMs: this.totalLatencyMs,
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
    };
  }

  handleLLMStart(
    _serialized: Serialized,
    _prompts: string[],
    runId: string
  ): void {
    this.llmStartTimes.set(runId, Date.now());
  }

  handleLLMEnd(output: LLMResult, runId: string): void {
    const startTime = this.llmStartTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    this.llmStartTimes.delete(runId);

    // Extract token usage - check multiple possible locations
    const tokenUsage =
      output.llmOutput?.tokenUsage ||
      output.llmOutput?.usage ||
      {};

    const promptTokens = tokenUsage.promptTokens ?? tokenUsage.prompt_tokens ?? 0;
    const completionTokens = tokenUsage.completionTokens ?? tokenUsage.completion_tokens ?? 0;
    const tokensUsed = promptTokens + completionTokens;

    // Accumulate totals
    this.totalTokens += tokensUsed;
    this.totalLatencyMs += latencyMs;
    this.totalPromptTokens += promptTokens;
    this.totalCompletionTokens += completionTokens;

    // Fire-and-forget write to DB
    prisma.agentMetrics
      .create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "LLM_CALL",
          tokensUsed,
          promptTokens,
          completionTokens,
          latencyMs,
        },
      })
      .catch((err: unknown) =>
        console.error("[MetricsHandler] Error storing LLM metrics:", err)
      );
  }

  handleLLMError(err: Error, runId: string): void {
    const startTime = this.llmStartTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    this.llmStartTimes.delete(runId);

    this.totalLatencyMs += latencyMs;

    prisma.agentMetrics
      .create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "LLM_ERROR",
          latencyMs,
          errorMessage: err.message?.substring(0, 500) || "Unknown LLM error",
        },
      })
      .catch((dbErr: unknown) =>
        console.error("[MetricsHandler] Error storing LLM error:", dbErr)
      );
  }

  handleToolStart(
    _tool: Serialized,
    _input: string,
    runId: string
  ): void {
    this.toolStartTimes.set(runId, Date.now());
    const toolName = _tool.id?.[_tool.id.length - 1] || "unknown_tool";
    this.toolNames.set(runId, toolName);
  }

  handleToolEnd(_output: string, runId: string): void {
    const startTime = this.toolStartTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    const toolName = this.toolNames.get(runId) || "unknown_tool";
    this.toolStartTimes.delete(runId);
    this.toolNames.delete(runId);

    this.totalLatencyMs += latencyMs;

    prisma.agentMetrics
      .create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "TOOL_CALL",
          toolName,
          toolSuccess: true,
          latencyMs,
        },
      })
      .catch((err: unknown) =>
        console.error("[MetricsHandler] Error storing tool metrics:", err)
      );
  }

  handleToolError(err: Error, runId: string): void {
    const startTime = this.toolStartTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    const toolName = this.toolNames.get(runId) || "unknown_tool";
    this.toolStartTimes.delete(runId);
    this.toolNames.delete(runId);

    this.totalLatencyMs += latencyMs;

    prisma.agentMetrics
      .create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "TOOL_CALL",
          toolName,
          toolSuccess: false,
          latencyMs,
          errorMessage: err.message?.substring(0, 500) || "Unknown tool error",
        },
      })
      .catch((dbErr: unknown) =>
        console.error("[MetricsHandler] Error storing tool error:", dbErr)
      );
  }

  handleChainStart(
    _chain: Serialized,
    _inputs: Record<string, unknown>,
    runId: string
  ): void {
    this.chainStartTimes.set(runId, Date.now());
  }

  handleChainEnd(
    _outputs: Record<string, unknown>,
    runId: string
  ): void {
    const startTime = this.chainStartTimes.get(runId);
    const latencyMs = startTime ? Date.now() - startTime : 0;
    this.chainStartTimes.delete(runId);

    this.totalLatencyMs += latencyMs;

    prisma.agentMetrics
      .create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "CHAIN",
          latencyMs,
        },
      })
      .catch((err: unknown) =>
        console.error("[MetricsHandler] Error storing chain metrics:", err)
      );
  }
}
