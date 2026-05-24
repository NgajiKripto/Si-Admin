import type { AgentStateType } from "../state";

/**
 * Placeholder node for human approval check.
 * Will be fully implemented in FEAT-004.
 * Currently passes through without modification.
 */
export async function checkApprovalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  return {
    requiresApproval: false,
    currentStep: "check_approval",
  };
}

// Suppress unused parameter warning
void checkApprovalNode;
