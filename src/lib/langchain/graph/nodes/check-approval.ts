import { prisma } from "@/lib/prisma";
import { AIMessage } from "@langchain/core/messages";
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

/**
 * Check-approval node that inspects pending tool calls.
 * If a tool call requires approval, it intercepts execution and queues it.
 * Otherwise, passes through without modification.
 */
export async function checkApprovalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];

  // Only check AIMessages with tool_calls
  if (
    !(lastMessage instanceof AIMessage) ||
    !lastMessage.tool_calls ||
    lastMessage.tool_calls.length === 0
  ) {
    return {
      requiresApproval: false,
      currentStep: "check_approval",
    };
  }

  // Check each tool call for approval requirements
  for (const toolCall of lastMessage.tool_calls) {
    const toolName = toolCall.name;
    const toolArgs = toolCall.args as Record<string, unknown>;

    if (requiresApproval(toolName, toolArgs)) {
      // Create an entry in HumanApprovalQueue
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
        currentStep: "check_approval",
      };
    }
  }

  return {
    requiresApproval: false,
    currentStep: "check_approval",
  };
}
