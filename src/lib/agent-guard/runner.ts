import { execSync } from "child_process";
import path from "path";

import { sanitizeInput } from "./input-sanitizer";
import { validateOutput } from "./output-validator";
import { auditKnowledgeContent } from "./knowledge-auditor";

import type { SanitizeResult } from "./input-sanitizer";
import type { ValidationResult } from "./output-validator";
import type { AuditResult } from "./knowledge-auditor";

export type { SanitizeResult, ValidationResult, AuditResult };

export interface SkillScanResult {
  file: string;
  findings: Array<{
    type: string;
    severity: string;
    detail: string;
    line: number;
  }>;
  safe: boolean;
}

// Script paths resolved from project root (process.cwd())
const SCAN_INPUT_SCRIPT = path.join(
  process.cwd(),
  "scripts/guard/scan-input.py"
);
const AUDIT_KNOWLEDGE_SCRIPT = path.join(
  process.cwd(),
  "scripts/guard/audit-knowledge.py"
);
const SCAN_SKILL_SCRIPT = path.join(
  process.cwd(),
  "scripts/guard/scan-skill.sh"
);
const VALIDATE_OUTPUT_SCRIPT = path.join(
  process.cwd(),
  "scripts/guard/validate-output.sh"
);

/**
 * Check if python3 and bash are accessible on this system.
 */
export function isPolyglotAvailable(): { python: boolean; bash: boolean } {
  let python = false;
  let bash = false;

  try {
    execSync("python3 --version", { stdio: "pipe" });
    python = true;
  } catch {
    // python3 not available
  }

  try {
    execSync("bash --version", { stdio: "pipe" });
    bash = true;
  } catch {
    // bash not available
  }

  return { python, bash };
}

/**
 * Run input guard using Python scan-input.py script.
 * Falls back to TypeScript sanitizeInput on error.
 */
export function runGuardInput(
  input: string,
  blockedPatterns: string[]
): SanitizeResult {
  try {
    const payload = JSON.stringify({ input, blocked_patterns: blockedPatterns });
    const result = execSync(`python3 "${SCAN_INPUT_SCRIPT}"`, {
      input: payload,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const parsed = JSON.parse(result);
    return {
      safe: parsed.safe,
      reason: parsed.reason || undefined,
      sanitizedInput: parsed.sanitized_input,
      matchedPatterns: parsed.matched_patterns || [],
    };
  } catch (error) {
    console.warn(
      "[agent-guard] Python scan-input.py unavailable, falling back to TypeScript:",
      error instanceof Error ? error.message : String(error)
    );
    return sanitizeInput(input, blockedPatterns);
  }
}

/**
 * Run output guard using Shell validate-output.sh script.
 * Falls back to TypeScript validateOutput on error.
 */
export function runGuardOutput(
  output: string,
  blockedOutputPatterns: string[],
  systemPromptHash?: string | null
): ValidationResult {
  try {
    const result = execSync(`bash "${VALIDATE_OUTPUT_SCRIPT}"`, {
      input: output,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const parsed = JSON.parse(result);
    return {
      valid: parsed.valid,
      issues: parsed.issues || [],
      sanitizedOutput: parsed.sanitized_output || output,
    };
  } catch (error) {
    console.warn(
      "[agent-guard] Shell validate-output.sh unavailable, falling back to TypeScript:",
      error instanceof Error ? error.message : String(error)
    );
    return validateOutput(output, blockedOutputPatterns, systemPromptHash);
  }
}

/**
 * Run knowledge audit using Python audit-knowledge.py script.
 * Falls back to TypeScript auditKnowledgeContent on error.
 */
export function runKnowledgeAudit(content: string): AuditResult {
  try {
    const payload = JSON.stringify({ content });
    const result = execSync(`python3 "${AUDIT_KNOWLEDGE_SCRIPT}"`, {
      input: payload,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const parsed = JSON.parse(result);
    return {
      safe: parsed.safe,
      issues: parsed.issues || [],
    };
  } catch (error) {
    console.warn(
      "[agent-guard] Python audit-knowledge.py unavailable, falling back to TypeScript:",
      error instanceof Error ? error.message : String(error)
    );
    return auditKnowledgeContent(content);
  }
}

/**
 * Run skill/file security scan using Shell scan-skill.sh script.
 * Returns null on error (no TypeScript fallback for this functionality).
 */
export function runSkillScan(filePath: string): SkillScanResult | null {
  try {
    const result = execSync(`bash "${SCAN_SKILL_SCRIPT}" "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const parsed = JSON.parse(result);
    return {
      file: parsed.file || filePath,
      findings: parsed.findings || [],
      safe: parsed.safe,
    };
  } catch (error) {
    console.warn(
      "[agent-guard] Shell scan-skill.sh failed:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
