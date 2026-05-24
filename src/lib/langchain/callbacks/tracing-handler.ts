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
      // Pragmatic choice: We store the trace JSON in the `errorMessage` column
      // because adding a dedicated column requires a schema migration. The field
      // is identified as a trace by stepName='TRACE'. This is acceptable for SQLite
      // where column types are flexible. Truncate to 100KB to stay within safe limits.
      const MAX_TRACE_SIZE = 100 * 1024; // 100KB
      let traceData = [...this.trace];
      let traceJson = JSON.stringify(traceData);
      // Iteratively remove oldest events until the JSON fits within the size limit
      while (traceJson.length > MAX_TRACE_SIZE && traceData.length > 1) {
        traceData = traceData.slice(Math.ceil(traceData.length / 4));
        traceJson = JSON.stringify(traceData);
      }
      if (traceJson.length > MAX_TRACE_SIZE) {
        // Last resort: store a summary marker
        traceJson = JSON.stringify([{ type: "truncated", message: "Trace terlalu besar untuk disimpan", originalLength: this.trace.length }]);
      }

      await prisma.agentMetrics.create({
        data: {
          requestId: this.requestId,
          sessionId: this.sessionId,
          stepName: "TRACE",
          errorMessage: traceJson,
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
