import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentState, type AgentStateType } from "@/lib/langchain/graph/state";
import { guardInputNode } from "@/lib/langchain/graph/nodes/guard-input";
import { guardOutputNode } from "@/lib/langchain/graph/nodes/guard-output";
import { routeQuery, type AgentRoute } from "./router";
import { createCSAgent } from "./cs-agent";
import { createStockAgent } from "./stock-agent";
import { createFollowUpAgent } from "./followup-agent";
import { getOpenAIConfig } from "@/lib/langchain/config";

async function routerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const messageContent =
    lastMessage instanceof HumanMessage
      ? String(lastMessage.content)
      : String(lastMessage.content);

  const route = await routeQuery(messageContent);

  return {
    currentStep: route,
  };
}

function routeAfterRouter(
  state: AgentStateType
): "cs_agent" | "stock_agent" | "followup_agent" {
  switch (state.currentStep as AgentRoute) {
    case "stock":
      return "stock_agent";
    case "followup":
      return "followup_agent";
    default:
      return "cs_agent";
  }
}

async function csAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { maxIterations } = getOpenAIConfig();
  const csAgent = createCSAgent(state.guardConfig);
  const result = await csAgent.invoke(
    { messages: state.messages },
    { recursionLimit: maxIterations }
  );

  const lastMessage = result.messages[result.messages.length - 1];

  return {
    messages: [lastMessage instanceof AIMessage ? lastMessage : new AIMessage(String(lastMessage.content))],
    currentStep: "cs_agent",
  };
}

async function stockAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { maxIterations } = getOpenAIConfig();
  const stockAgent = createStockAgent(state.guardConfig);
  const result = await stockAgent.invoke(
    { messages: state.messages },
    { recursionLimit: maxIterations }
  );

  const lastMessage = result.messages[result.messages.length - 1];

  return {
    messages: [lastMessage instanceof AIMessage ? lastMessage : new AIMessage(String(lastMessage.content))],
    currentStep: "stock_agent",
  };
}

async function followupAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { maxIterations } = getOpenAIConfig();
  const followUpAgent = createFollowUpAgent(state.guardConfig);
  const result = await followUpAgent.invoke(
    { messages: state.messages },
    { recursionLimit: maxIterations }
  );

  const lastMessage = result.messages[result.messages.length - 1];

  return {
    messages: [lastMessage instanceof AIMessage ? lastMessage : new AIMessage(String(lastMessage.content))],
    currentStep: "followup_agent",
  };
}

function routeAfterGuardInput(
  state: AgentStateType
): typeof END | "router" {
  if (!state.inputAllowed) {
    return END;
  }
  return "router";
}

const multiAgentWorkflow = new StateGraph(AgentState)
  .addNode("guard_input", guardInputNode)
  .addNode("router", routerNode)
  .addNode("cs_agent", csAgentNode)
  .addNode("stock_agent", stockAgentNode)
  .addNode("followup_agent", followupAgentNode)
  .addNode("guard_output", guardOutputNode)
  .addEdge(START, "guard_input")
  .addConditionalEdges("guard_input", routeAfterGuardInput, [END, "router"])
  .addConditionalEdges("router", routeAfterRouter, [
    "cs_agent",
    "stock_agent",
    "followup_agent",
  ])
  .addEdge("cs_agent", "guard_output")
  .addEdge("stock_agent", "guard_output")
  .addEdge("followup_agent", "guard_output")
  .addEdge("guard_output", END);

export const multiAgentGraph = multiAgentWorkflow.compile();
