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
export const ZERO_WIDTH_CHARS_PATTERN =
  /[\u200B\u200C\u200D\uFEFF\u202A-\u202E\u2060\u2066-\u2069]/;

// Cyrillic characters that look like Latin letters
const CYRILLIC_LOOKALIKES =
  /[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0458\u0455\u0431]/;

// Greek characters that look like Latin letters
const GREEK_LOOKALIKES = /[\u03B1\u03B5\u03BF\u03C1\u03BD\u03BA]/;

// Latin character range
const LATIN_CHARS = /[a-zA-Z]/;

// Unusual whitespace characters (not regular space or common whitespace)
const UNUSUAL_WHITESPACE =
  /[\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\u180E\u1680]/;

/**
 * Detect homoglyphs: Cyrillic or Greek characters mixed with Latin characters.
 * This detects visual spoofing where attackers use look-alike characters from
 * different scripts to bypass pattern matching.
 */
function detectHomoglyphs(input: string): boolean {
  const hasLatin = LATIN_CHARS.test(input);
  const hasCyrillic = CYRILLIC_LOOKALIKES.test(input);
  const hasGreek = GREEK_LOOKALIKES.test(input);

  // Flag if Latin is mixed with Cyrillic or Greek lookalikes
  return hasLatin && (hasCyrillic || hasGreek);
}

/**
 * Detect whitespace injection: unusual Unicode whitespace characters inserted
 * between normal characters (e.g., "i g n o r e" with special spaces).
 */
function detectWhitespaceInjection(input: string): boolean {
  // Check for unusual whitespace characters
  if (!UNUSUAL_WHITESPACE.test(input)) {
    return false;
  }

  // Check if unusual whitespace appears between word characters (injection pattern)
  const injectionPattern = /\w[\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\u180E\u1680]\w/;
  return injectionPattern.test(input);
}

/**
 * Detect suspicious multi-language/script mixing within words.
 * Flags words that contain characters from multiple scripts (Latin + Cyrillic, etc.).
 */
function detectMultiLanguageMixing(input: string): boolean {
  // Split on regular spaces and check each word
  const words = input.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    let hasLatin = false;
    let hasCyrillic = false;
    let hasGreek = false;

    for (const char of word) {
      if (/[a-zA-Z]/.test(char)) hasLatin = true;
      if (/[\u0400-\u04FF]/.test(char)) hasCyrillic = true;
      if (/[\u0370-\u03FF]/.test(char)) hasGreek = true;
    }

    // Suspicious if a single word mixes scripts
    if ((hasLatin && hasCyrillic) || (hasLatin && hasGreek)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate regex safety to prevent ReDoS attacks.
 * Returns true if the pattern is safe to use as a regex.
 */
export function validateRegexSafety(pattern: string): boolean {
  // Reject overly long patterns
  if (pattern.length > 200) {
    return false;
  }

  // Detect nested quantifiers like (a+)+, (a*)+, (a+)*, (a*)*, (a{1,})+
  if (/\([^)]*[+*}]\)[+*{]/.test(pattern)) {
    return false;
  }

  // Detect patterns like .+.+.+ or .*.*
  if (/(\.\*){2,}|(\.\+){2,}/.test(pattern)) {
    return false;
  }

  // Detect alternation with overlapping quantifiers like (a|a)+
  if (/\([^)]*\|[^)]*\)[+*]/.test(pattern)) {
    return false;
  }

  return true;
}

export function sanitizeInput(
  input: string,
  blockedPatterns: string[]
): SanitizeResult {
  const matchedPatterns: string[] = [];
  let sanitizedInput = input;

  // Detect and strip zero-width characters BEFORE other pattern checks
  if (ZERO_WIDTH_CHARS_PATTERN.test(sanitizedInput)) {
    matchedPatterns.push("zero-width characters");
    sanitizedInput = sanitizedInput.replace(
      new RegExp(ZERO_WIDTH_CHARS_PATTERN.source, "g"),
      ""
    );
  }

  // Detect homoglyphs (Cyrillic/Greek mixed with Latin)
  if (detectHomoglyphs(sanitizedInput)) {
    matchedPatterns.push("homoglyph characters detected");
  }

  // Detect whitespace injection
  if (detectWhitespaceInjection(sanitizedInput)) {
    matchedPatterns.push("whitespace injection detected");
    // Normalize unusual whitespace to regular spaces
    sanitizedInput = sanitizedInput.replace(
      /[\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\u180E\u1680]/g,
      " "
    );
  }

  // Detect multi-language script mixing within words
  if (detectMultiLanguageMixing(sanitizedInput)) {
    matchedPatterns.push("multi-language mixing detected");
  }

  // Check config-defined blocked patterns (case-insensitive)
  for (const pattern of blockedPatterns) {
    if (validateRegexSafety(pattern)) {
      try {
        const regex = new RegExp(pattern, "gi");
        if (regex.test(input)) {
          matchedPatterns.push(pattern);
          sanitizedInput = sanitizedInput.replace(regex, "");
        }
      } catch {
        // If regex is invalid, fall back to plain string matching
        if (input.toLowerCase().includes(pattern.toLowerCase())) {
          matchedPatterns.push(pattern);
          sanitizedInput = sanitizedInput.replace(
            new RegExp(escapeRegex(pattern), "gi"),
            ""
          );
        }
      }
    } else {
      // Unsafe regex, fall back to plain string matching
      if (input.toLowerCase().includes(pattern.toLowerCase())) {
        matchedPatterns.push(pattern);
        sanitizedInput = sanitizedInput.replace(
          new RegExp(escapeRegex(pattern), "gi"),
          ""
        );
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
