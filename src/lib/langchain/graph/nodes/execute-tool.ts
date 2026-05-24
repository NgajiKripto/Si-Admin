import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getAgentTools, createGuardedTools } from "@/lib/langchain/tools";
import type { AgentStateType } from "../state";

/**
 * Defines which actions require human approval.
 * - UPDATE_STOCK with quantity > 50
 * - CREATE_FOLLOWUP with priority HIGH
 */
function requiresApproval(
  toolName: string,
  args: Record<string, unknown>
): boolean {
  if (toolName === "update_stock") {
    const quantity = args.quantity as number;
    if (quantity > 50) {
      return true;
    }
  }

  if (toolName === "create_follow_up") {
    const priority = (args.priority as string)?.toUpperCase();
    if (priority === "HIGH") {
      return true;
    }
  }

  return false;
}

export async function executeToolNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if any tool call requires approval before executing
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    for (const toolCall of lastMessage.tool_calls) {
      const toolName = toolCall.name;
      const toolArgs = toolCall.args as Record<string, unknown>;

      if (requiresApproval(toolName, toolArgs)) {
        // Create an entry in HumanApprovalQueue instead of executing
        const queueEntry = await prisma.humanApprovalQueue.create({
          data: {
            sessionId: state.sessionId || "unknown",
            actionType: toolName,
            actionPayload: JSON.stringify({
              toolName,
              args: toolArgs,
            }),
            status: "PENDING",
          },
        });

        return {
          requiresApproval: true,
          approvalAction: {
            toolName,
            args: toolArgs,
            approvalId: queueEntry.id,
          },
          finalResponse: `Aksi ini memerlukan persetujuan admin. ID Persetujuan: ${queueEntry.id}`,
          currentStep: "execute_tool",
        };
      }
    }
  }

  // Create ToolNode dynamically with guard enforcement from state
  const guardConfig = state.guardConfig;
  const tools = guardConfig ? createGuardedTools(getAgentTools(), guardConfig) : getAgentTools();
  const toolNode = new ToolNode(tools);

  const result = await toolNode.invoke(state);

  return {
    messages: result.messages,
    currentStep: "execute_tool",
  };
}
