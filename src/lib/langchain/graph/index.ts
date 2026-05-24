import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";
import { guardInputNode } from "./nodes/guard-input";
import { retrieveContextNode } from "./nodes/retrieve-context";
import { llmDecideNode } from "./nodes/llm-decide";
import { executeToolNode } from "./nodes/execute-tool";
import { guardOutputNode } from "./nodes/guard-output";
import { AIMessage } from "@langchain/core/messages";
import { multiAgentGraph } from "@/lib/langchain/agents";

function routeAfterGuardInput(
  state: AgentStateType
): typeof END | "retrieve_context" {
  if (!state.inputAllowed) {
    return END;
  }
  return "retrieve_context";
}

function routeAfterLlmDecide(
  state: AgentStateType
): "execute_tool" | "guard_output" {
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    return "execute_tool";
  }
  return "guard_output";
}

function routeAfterExecuteTool(
  state: AgentStateType
): "llm_decide" | typeof END {
  if (state.requiresApproval) {
    return END;
  }
  return "llm_decide";
}

const workflow = new StateGraph(AgentState)
  .addNode("guard_input", guardInputNode)
  .addNode("retrieve_context", retrieveContextNode)
  .addNode("llm_decide", llmDecideNode)
  .addNode("execute_tool", executeToolNode)
  .addNode("guard_output", guardOutputNode)
  .addEdge(START, "guard_input")
  .addConditionalEdges("guard_input", routeAfterGuardInput, [
    END,
    "retrieve_context",
  ])
  .addEdge("retrieve_context", "llm_decide")
  .addConditionalEdges("llm_decide", routeAfterLlmDecide, [
    "execute_tool",
    "guard_output",
  ])
  .addConditionalEdges("execute_tool", routeAfterExecuteTool, [
    "llm_decide",
    END,
  ])
  .addEdge("guard_output", END);

export const agentGraph = workflow.compile();

export { multiAgentGraph };

/**
 * Mengembalikan graph yang sesuai berdasarkan mode.
 * Default: 'multi' (multi-agent system).
 */
export function getGraph(mode: "single" | "multi" = "multi") {
  if (mode === "single") {
    return agentGraph;
  }
  return multiAgentGraph;
}
