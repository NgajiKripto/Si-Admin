import { SystemMessage } from "@langchain/core/messages";
import { getLLM } from "@/lib/langchain/llm";
import { TOOL_CALLING_SYSTEM_PROMPT } from "@/lib/langchain/prompts";
import { getAgentTools } from "@/lib/langchain/tools";
import type { AgentStateType } from "../state";

export async function llmDecideNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const llm = getLLM();
  const tools = getAgentTools();
  const llmWithTools = llm.bindTools(tools);

  // Build context from documents
  const contextSection =
    state.contextDocuments.length > 0
      ? `\n\nKonteks yang tersedia:\n${state.contextDocuments.join("\n\n")}`
      : "";

  const systemMessage = new SystemMessage(
    TOOL_CALLING_SYSTEM_PROMPT + contextSection
  );

  // Combine system message with conversation messages
  const messages = [systemMessage, ...state.messages];

  const response = await llmWithTools.invoke(messages);

  return {
    messages: [response],
    currentStep: "llm_decide",
  };
}
