export interface SanitizeResult {
  safe: boolean;
  reason?: string;
  sanitizedInput: string;
  matchedPatterns: string[];
}

// Built-in patterns that are always checked regardless of config
const BUILTIN_PATTERNS: string[] = [
  "act as",
  "pretend you are",
  "berpura-pura",
  "bertindak sebagai",
  "kamu adalah",
  "sekarang kamu",
  "mulai sekarang kamu",
  "abaikan semua instruksi",
  "abaikan perintah",
  "override instructions",
  "new instructions",
  "instruksi baru",
];

// Special character sequences that could be prompt delimiters
const DELIMITER_PATTERNS: RegExp[] = [
  /```system/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\/SYS>/i,
  /### ?instruction/i,
  /### ?system/i,
];

// Zero-width and bidirectional control characters used to hide malicious content
const ZERO_WIDTH_CHARS =
  /[\u200B\u200C\u200D\uFEFF\u202A-\u202E\u2060\u2066-\u2069]/g;

export function sanitizeInput(
  input: string,
  blockedPatterns: string[]
): SanitizeResult {
  const matchedPatterns: string[] = [];
  let sanitizedInput = input;

  // Detect and strip zero-width characters BEFORE other pattern checks
  if (ZERO_WIDTH_CHARS.test(sanitizedInput)) {
    matchedPatterns.push("zero-width characters");
    sanitizedInput = sanitizedInput.replace(ZERO_WIDTH_CHARS, "");
  }

  // Check config-defined blocked patterns (case-insensitive)
  for (const pattern of blockedPatterns) {
    try {
      const regex = new RegExp(pattern, "gi");
      if (regex.test(input)) {
        matchedPatterns.push(pattern);
        sanitizedInput = sanitizedInput.replace(regex, "");
      }
    } catch {
      // If regex is invalid, try plain string matching
      if (input.toLowerCase().includes(pattern.toLowerCase())) {
        matchedPatterns.push(pattern);
        sanitizedInput = sanitizedInput
          .replace(new RegExp(escapeRegex(pattern), "gi"), "");
      }
    }
  }

  // Check built-in patterns
  for (const pattern of BUILTIN_PATTERNS) {
    const regex = new RegExp(escapeRegex(pattern), "gi");
    if (regex.test(input)) {
      matchedPatterns.push(pattern);
      sanitizedInput = sanitizedInput.replace(regex, "");
    }
  }

  // Check delimiter patterns
  for (const regex of DELIMITER_PATTERNS) {
    if (regex.test(input)) {
      matchedPatterns.push(regex.source);
      sanitizedInput = sanitizedInput.replace(regex, "");
    }
  }

  // Trim extra whitespace from sanitized input
  sanitizedInput = sanitizedInput.replace(/\s+/g, " ").trim();

  const safe = matchedPatterns.length === 0;

  return {
    safe,
    reason: safe
      ? undefined
      : `Terdeteksi pola berbahaya: ${matchedPatterns.join(", ")}`,
    sanitizedInput,
    matchedPatterns,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
