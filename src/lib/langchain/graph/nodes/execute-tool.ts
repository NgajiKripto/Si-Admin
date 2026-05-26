import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getAgentTools, createGuardedTools } from "@/lib/langchain/tools";
import type { AgentStateType } from "../state";

const READ_ONLY_TOOLS = ["search_knowledge", "check_stock", "get_customer_history"];

/**
 * Defines which actions require human approval.
 * - UPDATE_STOCK with quantity > 50
 * - UPDATE_STOCK when cumulative stock changes would exceed 100
 * - CREATE_FOLLOWUP with priority HIGH
 */
function requiresApproval(
  toolName: string,
  args: Record<string, unknown>,
  cumulativeStock: number
): boolean {
  if (toolName === "update_stock") {
    const quantity = Math.abs(args.quantity as number);
    if (quantity > 50) {
      return true;
    }
    // Require approval if cumulative changes would exceed 100
    if (cumulativeStock + quantity > 100) {
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
    // Block write tools for unauthenticated users
    if (!state.isAuthenticated) {
      const writeToolCalls = lastMessage.tool_calls.filter(
        (tc) => !READ_ONLY_TOOLS.includes(tc.name)
      );
      if (writeToolCalls.length > 0) {
        return {
          finalResponse: "Maaf, aksi ini memerlukan autentikasi admin. Silakan hubungi admin untuk melakukan perubahan data.",
          currentStep: "execute_tool",
        };
      }
    }

    // Load cumulative stock changes from DB for persistence across requests
    let dbCumulativeStock = 0;
    if (state.sessionId) {
      const session = await prisma.agentSession.findUnique({
        where: { id: state.sessionId },
        select: { cumulativeStockChanges: true },
      });
      if (session) {
        dbCumulativeStock = session.cumulativeStockChanges;
      }
    }

    for (const toolCall of lastMessage.tool_calls) {
      const toolName = toolCall.name;
      const toolArgs = toolCall.args as Record<string, unknown>;

      if (
        requiresApproval(
          toolName,
          toolArgs,
          dbCumulativeStock
        )
      ) {
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
  const tools = guardConfig
    ? createGuardedTools(getAgentTools(), guardConfig)
    : getAgentTools();
  const toolNode = new ToolNode(tools);

  const result = await toolNode.invoke(state);

  // Calculate cumulative stock changes from this execution and persist to DB.
  let stockChangeSum = 0;
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    for (const toolCall of lastMessage.tool_calls) {
      if (toolCall.name === "update_stock") {
        const args = toolCall.args as Record<string, unknown>;
        stockChangeSum += Math.abs(args.quantity as number);
      }
    }
  }

  if (stockChangeSum > 0 && state.sessionId) {
    await prisma.agentSession.update({
      where: { id: state.sessionId },
      data: { cumulativeStockChanges: { increment: stockChangeSum } },
    });
  }

  return {
    messages: result.messages,
    currentStep: "execute_tool",
    cumulativeStockChanges: stockChangeSum,
  };
}
