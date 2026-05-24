import { DynamicStructuredTool } from "@langchain/core/tools";
import { isActionAllowed, type ActionType, type GuardConfig } from "@/lib/agent-guard";

/**
 * Maps tool names to their corresponding action types for permission checks.
 */
const TOOL_ACTION_MAP: Record<string, ActionType> = {
  create_follow_up: "CREATE_FOLLOWUP",
  update_stock: "UPDATE_STOCK",
  send_feedback_template: "SEND_FEEDBACK_TEMPLATE",
};

/**
 * Creates guarded versions of tools that check allowedActions before execution.
 * Tools without a mapping in TOOL_ACTION_MAP (e.g., read-only tools like
 * search_knowledge, check_stock, get_customer_history) pass through unchanged.
 */
export function createGuardedTools(
  tools: DynamicStructuredTool[],
  guardConfig: GuardConfig | null
): DynamicStructuredTool[] {
  if (!guardConfig) {
    return tools;
  }

  return tools.map((tool) => {
    const actionType = TOOL_ACTION_MAP[tool.name];

    // If no action mapping exists, it is a read-only tool - allow unconditionally
    if (!actionType) {
      return tool;
    }

    const permissionConfig = {
      readOnlyMode: guardConfig.readOnlyMode,
      allowedActions: guardConfig.allowedActions as ActionType[],
    };

    // Create a wrapped version that checks permissions before invoking
    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      func: async (input) => {
        if (!isActionAllowed(actionType, permissionConfig)) {
          return `Aksi '${actionType}' tidak diizinkan oleh konfigurasi keamanan saat ini.`;
        }
        return (tool as unknown as { func: (input: unknown) => Promise<string> }).func(input);
      },
    });
  });
}
