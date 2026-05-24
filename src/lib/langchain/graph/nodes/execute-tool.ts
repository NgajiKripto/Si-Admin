import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getAgentTools } from "@/lib/langchain/tools";
import type { AgentStateType } from "../state";

const toolNode = new ToolNode(getAgentTools());

export async function executeToolNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
    currentStep: "execute_tool",
  };
}
