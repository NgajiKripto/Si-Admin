import { sanitizeInput } from "./input-sanitizer";
import { classifyScope } from "./scope-classifier";
import { limitResponse } from "./response-limiter";
import { validateOutput } from "./output-validator";

import type { SanitizeResult } from "./input-sanitizer";
import type { ScopeResult } from "./scope-classifier";
import type { LimitResult } from "./response-limiter";
import type { ValidationResult } from "./output-validator";

export type { SanitizeResult } from "./input-sanitizer";
/**
 * WARNING: When using sanitizeInput standalone (outside of processInput),
 * callers MUST check the `.safe` property before using `.sanitizedInput`.
 * A result with `safe: false` means injection patterns were detected and
 * stripped, but the sanitized text may still contain partial attack payloads.
 * Do NOT forward sanitizedInput to an LLM without verifying safe === true.
 */
export { sanitizeInput } from "./input-sanitizer";

export type { ScopeResult } from "./scope-classifier";
export { classifyScope } from "./scope-classifier";

export type { LimitResult } from "./response-limiter";
export { limitResponse } from "./response-limiter";

export type { ValidationResult } from "./output-validator";
export { validateOutput } from "./output-validator";

export type { ActionType, ActionPermissionConfig } from "./action-permissions";
export { ACTION_TYPES, isActionAllowed } from "./action-permissions";

export type { AuditResult } from "./knowledge-auditor";
export { auditKnowledgeContent } from "./knowledge-auditor";

export interface GuardConfig {
  id: string;
  isEnabled: boolean;
  maxResponseLength: number;
  maxResponseTokens: number;
  allowedTopics: string[];
  blockedPatterns: string[];
  blockedOutputPatterns: string[];
  responseFormat: string;
  systemPromptHash: string | null;
  readOnlyMode: boolean;
  allowedActions: string[];
}

export interface GuardResult {
  allowed: boolean;
  input: SanitizeResult;
  scope: ScopeResult;
  output?: LimitResult;
  validation?: ValidationResult;
  blockedReason?: string;
}

/**
 * Process user input through the guard layers (sanitization + scope check).
 * Returns whether the input is allowed to proceed to the LLM.
 */
export function processInput(
  input: string,
  config: GuardConfig
): {
  allowed: boolean;
  sanitizeResult: SanitizeResult;
  scopeResult: ScopeResult;
  blockedReason?: string;
} {
  // Layer 1: Input sanitization
  const sanitizeResult = sanitizeInput(input, config.blockedPatterns);

  if (!sanitizeResult.safe) {
    return {
      allowed: false,
      sanitizeResult,
      scopeResult: { inScope: false, confidence: 0 },
      blockedReason: sanitizeResult.reason,
    };
  }

  // Layer 2: Scope classification
  const scopeResult = classifyScope(
    sanitizeResult.sanitizedInput,
    config.allowedTopics
  );

  if (!scopeResult.inScope) {
    return {
      allowed: false,
      sanitizeResult,
      scopeResult,
      blockedReason: scopeResult.reason,
    };
  }

  return {
    allowed: true,
    sanitizeResult,
    scopeResult,
  };
}

/**
 * Process LLM output through limiting and validation layers.
 * Returns the sanitized and limited content ready to send to the user.
 */
export function processOutput(
  output: string,
  config: GuardConfig
): {
  content: string;
  limitResult: LimitResult;
  validationResult: ValidationResult;
} {
  // Layer 1: Response limiting
  const limitResult = limitResponse(
    output,
    config.maxResponseLength,
    config.maxResponseTokens,
    config.responseFormat
  );

  // Layer 2: Output validation
  const validationResult = validateOutput(
    limitResult.content,
    config.blockedOutputPatterns,
    config.systemPromptHash
  );

  return {
    content: validationResult.sanitizedOutput,
    limitResult,
    validationResult,
  };
}

/**
 * Returns a default GuardConfig with sensible defaults for an Indonesian CS agent.
 */
export function getDefaultConfig(): GuardConfig {
  return {
    id: "",
    isEnabled: true,
    maxResponseLength: 500,
    maxResponseTokens: 200,
    allowedTopics: [
      "produk",
      "harga",
      "pengiriman",
      "pembayaran",
      "keluhan",
      "retur",
      "promo",
      "jam_operasional",
      "stok",
      "garansi",
    ],
    blockedPatterns: [
      "ignore previous",
      "abaikan instruksi",
      "you are now",
      "kamu sekarang adalah",
      "forget everything",
      "lupakan semua",
      "system:",
      "\\[SYSTEM\\]",
      "jailbreak",
      "DAN mode",
    ],
    blockedOutputPatterns: [
      "system prompt",
      "instruksi sistem",
      "you are an AI",
      "saya adalah AI",
    ],
    responseFormat: "text",
    systemPromptHash: null,
    readOnlyMode: false,
    allowedActions: [
      "SEND_MESSAGE",
      "CREATE_FOLLOWUP",
      "UPDATE_STOCK",
      "RECORD_FEEDBACK",
      "SEND_FEEDBACK_TEMPLATE",
    ],
  };
}
