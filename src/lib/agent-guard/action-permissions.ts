export const ACTION_TYPES = [
  "SEND_MESSAGE",
  "CREATE_FOLLOWUP",
  "UPDATE_STOCK",
  "RECORD_FEEDBACK",
  "SEND_FEEDBACK_TEMPLATE",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export interface ActionPermissionConfig {
  readOnlyMode: boolean;
  allowedActions: ActionType[];
}

/**
 * Read-only actions that are still allowed even when readOnlyMode is true.
 * Currently none - all listed actions are considered write actions.
 */
const READ_ONLY_ALLOWED: ActionType[] = [];

/**
 * Checks whether a given action is allowed based on the permission config.
 * - If readOnlyMode is true, only read-only actions are permitted.
 * - Otherwise, the action must be in the allowedActions list.
 */
export function isActionAllowed(
  actionType: ActionType,
  config: ActionPermissionConfig
): boolean {
  if (config.readOnlyMode) {
    return READ_ONLY_ALLOWED.includes(actionType);
  }

  return config.allowedActions.includes(actionType);
}
