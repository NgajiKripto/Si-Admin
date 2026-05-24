import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { prisma } from "@/lib/prisma";

interface TraceEvent {
  timestamp: string;
  type: string;
  name: string;
  input?: string;
  output?: string;
  duration?: number;
  error?: string;
}

export class TracingHandler extends BaseCallbackHandler {
  name = "TracingHandler";

  private requestId: string;
  private sessionId: string;
  private trace: TraceEvent[] = [];
  private startTimes: Map<string, number> = new Map();
  private toolNames: Map<string, string> = new Map();

  constructor(requestId: string, sessionId: string) {
    super();
    this.requestId = requestId;
    this.sessionId = sessionId;
  }

  getTrace(): TraceEvent[] {
    return this.trace;
  }

  async saveTrace(): Promise<void> {
    try {
      await prisma.agentMetrics.create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "TRACE",
          errorMessage: JSON.stringify(this.trace),
        },
      });
    } catch (err) {
      console.error("[TracingHandler] Error saving trace:", err);
    }
  }

  handleLLMStart(
    serialized: Serialized,
    prompts: string[],
    runId: string
  ): void {
    this.startTimes.set(runId, Date.now());
    const modelName = serialized.id?.[serialized.id.length - 1] || "unknown_model";
    const inputSummary = prompts[0]?.substring(0, 200) || "";

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "llm_start",
      name: modelName,
      input: inputSummary,
    });
  }

  handleLLMEnd(output: LLMResult, runId: string): void {
    const startTime = this.startTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : undefined;
    this.startTimes.delete(runId);

    const responseText =
      output.generations?.[0]?.[0]?.text?.substring(0, 200) || "";

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "llm_end",
      name: "llm",
      output: responseText,
      duration,
    });
  }

  handleLLMError(err: Error, runId: string): void {
    const startTime = this.startTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : undefined;
    this.startTimes.delete(runId);

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "llm_error",
      name: "llm",
      error: err.message?.substring(0, 200) || "Unknown error",
      duration,
    });
  }

  handleToolStart(
    tool: Serialized,
    input: string,
    runId: string
  ): void {
    this.startTimes.set(runId, Date.now());
    const toolName = tool.id?.[tool.id.length - 1] || "unknown_tool";
    this.toolNames.set(runId, toolName);

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "tool_start",
      name: toolName,
      input: input?.substring(0, 200),
    });
  }

  handleToolEnd(output: string, runId: string): void {
    const startTime = this.startTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : undefined;
    const toolName = this.toolNames.get(runId) || "unknown_tool";
    this.startTimes.delete(runId);
    this.toolNames.delete(runId);

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "tool_end",
      name: toolName,
      output: output?.substring(0, 200),
      duration,
    });
  }

  handleToolError(err: Error, runId: string): void {
    const startTime = this.startTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : undefined;
    const toolName = this.toolNames.get(runId) || "unknown_tool";
    this.startTimes.delete(runId);
    this.toolNames.delete(runId);

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "tool_error",
      name: toolName,
      error: err.message?.substring(0, 200) || "Unknown error",
      duration,
    });
  }

  handleChainStart(
    chain: Serialized,
    _inputs: Record<string, unknown>,
    runId: string
  ): void {
    this.startTimes.set(runId, Date.now());
    const chainName = chain.id?.[chain.id.length - 1] || "unknown_chain";

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "chain_start",
      name: chainName,
    });
  }

  handleChainEnd(
    _outputs: Record<string, unknown>,
    runId: string
  ): void {
    const startTime = this.startTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : undefined;
    this.startTimes.delete(runId);

    this.trace.push({
      timestamp: new Date().toISOString(),
      type: "chain_end",
      name: "chain",
      duration,
    });
  }
}
