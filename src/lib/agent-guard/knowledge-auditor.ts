export interface AuditResult {
  safe: boolean;
  issues: string[];
}

/**
 * Zero-width and bidirectional control characters that could be used
 * to hide malicious content in knowledge entries.
 */
const ZERO_WIDTH_REGEX =
  /[\u200B\u200C\u200D\uFEFF\u202A-\u202E\u2060\u2066-\u2069]/g;

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
    pattern: /act\s+as/i,
    label: "Persona swap: 'act as'",
  },
  {
    pattern: /system\s*:/i,
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
  if (ZERO_WIDTH_REGEX.test(content)) {
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
