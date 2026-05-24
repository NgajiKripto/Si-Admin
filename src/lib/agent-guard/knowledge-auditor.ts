import { ZERO_WIDTH_CHARS_PATTERN } from "./input-sanitizer";

export interface AuditResult {
  safe: boolean;
  issues: string[];
}

/**
 * Patterns that indicate prompt injection attempts in knowledge content.
 */
const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /ignore\s+(all\s+)?previous\s+instructions/i,
    label: "Prompt injection: ignore previous instructions",
  },
  {
    pattern: /ignore\s+all\s+instructions/i,
    label: "Prompt injection: ignore all instructions",
  },
  {
    pattern: /you\s+are\s+now/i,
    label: "Persona swap: 'you are now'",
  },
  {
    pattern: /(?:i\s+want\s+you\s+to\s+|please\s+|you\s+(?:must|should|will)\s+)act\s+as/i,
    label: "Persona swap: 'act as'",
  },
  {
    pattern: /^\s*system\s*:/im,
    label: "System prompt fragment: 'system:'",
  },
  {
    pattern: /\[SYSTEM\]/i,
    label: "System prompt fragment: '[SYSTEM]'",
  },
  {
    pattern: /<<SYS>>/i,
    label: "System prompt fragment: '<<SYS>>'",
  },
  {
    pattern: /<!--[\s\S]*?-->/,
    label: "Hidden instructions in HTML/markdown comments",
  },
];

/**
 * Scans knowledge content for prompt injection patterns and suspicious
 * characters. Returns an audit result indicating safety and any issues found.
 */
export function auditKnowledgeContent(content: string): AuditResult {
  const issues: string[] = [];

  // Check for zero-width characters
  if (ZERO_WIDTH_CHARS_PATTERN.test(content)) {
    issues.push(
      "Terdeteksi karakter zero-width yang mencurigakan (bisa menyembunyikan konten berbahaya)"
    );
  }

  // Check for prompt injection patterns
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(label);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}
