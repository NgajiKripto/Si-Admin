import { processOutput } from "@/lib/agent-guard";
import type { AgentStateType } from "../state";

export async function guardOutputNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // Get the final AI text response from the last message
  const lastMessage = state.messages[state.messages.length - 1];
  const responseText = String(lastMessage.content);

  // If no guard config, return as-is
  if (!state.guardConfig) {
    return {
      finalResponse: responseText,
      currentStep: "guard_output",
    };
  }

  // Process output through guard
  const result = processOutput(responseText, state.guardConfig);

  return {
    finalResponse: result.content,
    currentStep: "guard_output",
  };
}
