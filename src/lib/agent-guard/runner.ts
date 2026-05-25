import { spawn, execFile } from "child_process";
import { promisify } from "util";
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

const execFileAsync = promisify(execFile);

const SCAN_INPUT_SCRIPT = path.join(process.cwd(), "scripts/guard/scan-input.py");
const AUDIT_KNOWLEDGE_SCRIPT = path.join(process.cwd(), "scripts/guard/audit-knowledge.py");
const SCAN_SKILL_SCRIPT = path.join(process.cwd(), "scripts/guard/scan-skill.sh");
const VALIDATE_OUTPUT_SCRIPT = path.join(process.cwd(), "scripts/guard/validate-output.sh");

function execWithStdin(command: string, args: string[], input: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], timeout });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (err) => { reject(err); });

    child.stdin.write(input);
    child.stdin.end();
  });
}

export async function isPolyglotAvailable(): Promise<{ python: boolean; bash: boolean }> {
  let python = false;
  let bash = false;
  try {
    await execFileAsync("python3", ["--version"], { timeout: 5000 });
    python = true;
  } catch { /* not available */ }
  try {
    await execFileAsync("bash", ["--version"], { timeout: 5000 });
    bash = true;
  } catch { /* not available */ }
  return { python, bash };
}

export async function runGuardInput(input: string, blockedPatterns: string[]): Promise<SanitizeResult> {
  try {
    const payload = JSON.stringify({ input, blocked_patterns: blockedPatterns });
    const result = await execWithStdin("python3", [SCAN_INPUT_SCRIPT], payload, 5000);
    const parsed = JSON.parse(result);
    return {
      safe: parsed.safe,
      reason: parsed.reason || undefined,
      sanitizedInput: parsed.sanitized_input,
      matchedPatterns: parsed.matched_patterns || [],
    };
  } catch (error) {
    console.warn("[agent-guard] Python scan-input.py unavailable, falling back to TypeScript:", error instanceof Error ? error.message : String(error));
    return sanitizeInput(input, blockedPatterns);
  }
}

export async function runGuardOutput(output: string, blockedOutputPatterns: string[], systemPromptHash?: string | null): Promise<ValidationResult> {
  try {
    const payload = JSON.stringify({ output, blocked_output_patterns: blockedOutputPatterns, system_prompt_hash: systemPromptHash });
    const result = await execWithStdin("bash", [VALIDATE_OUTPUT_SCRIPT], payload, 5000);
    const parsed = JSON.parse(result);
    return {
      valid: parsed.valid,
      issues: parsed.issues || [],
      sanitizedOutput: parsed.sanitized_output || output,
    };
  } catch (error) {
    console.warn("[agent-guard] Shell validate-output.sh unavailable, falling back to TypeScript:", error instanceof Error ? error.message : String(error));
    return validateOutput(output, blockedOutputPatterns, systemPromptHash);
  }
}

export async function runKnowledgeAudit(content: string): Promise<AuditResult> {
  try {
    const payload = JSON.stringify({ content });
    const result = await execWithStdin("python3", [AUDIT_KNOWLEDGE_SCRIPT], payload, 5000);
    const parsed = JSON.parse(result);
    return { safe: parsed.safe, issues: parsed.issues || [] };
  } catch (error) {
    console.warn("[agent-guard] Python audit-knowledge.py unavailable, falling back to TypeScript:", error instanceof Error ? error.message : String(error));
    return auditKnowledgeContent(content);
  }
}

export async function runSkillScan(filePath: string): Promise<SkillScanResult | null> {
  try {
    const { stdout } = await execFileAsync("bash", [SCAN_SKILL_SCRIPT], {
      timeout: 5000,
      env: { ...process.env, SCAN_TARGET: filePath },
    });
    const parsed = JSON.parse(stdout);
    return { file: parsed.file || filePath, findings: parsed.findings || [], safe: parsed.safe };
  } catch (error) {
    console.warn("[agent-guard] Shell scan-skill.sh failed:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
