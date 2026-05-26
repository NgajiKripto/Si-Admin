import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { GuardConfig } from "@/lib/agent-guard";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  guardConfig: Annotation<GuardConfig | null>({
    reducer: (_, val) => val,
    default: () => null,
  }),
  sessionId: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  inputAllowed: Annotation<boolean>({
    reducer: (_, val) => val,
    default: () => true,
  }),
  contextDocuments: Annotation<string[]>({
    reducer: (_, val) => val,
    default: () => [],
  }),
  finalResponse: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  currentStep: Annotation<string>({
    reducer: (_, val) => val,
    default: () => "",
  }),
  requiresApproval: Annotation<boolean>({
    reducer: (_, val) => val,
    default: () => false,
  }),
  approvalAction: Annotation<Record<string, unknown> | null>({
    reducer: (_, val) => val,
    default: () => null,
  }),
  cumulativeStockChanges: Annotation<number>({
    reducer: (prev, val) => prev + val,
    default: () => 0,
  }),
  isAuthenticated: Annotation<boolean>({
    reducer: (_, val) => val,
    default: () => false,
  }),
});

export type AgentStateType = typeof AgentState.State;
