export interface ValidationResult {
  valid: boolean;
  issues: string[];
  sanitizedOutput: string;
}

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Indonesian phone number patterns (08xx, +62xx)
const PHONE_REGEX = /(?:\+62|62|0)8[1-9][0-9]{6,10}/g;

export function validateOutput(
  output: string,
  blockedOutputPatterns: string[],
  systemPromptHash?: string | null
): ValidationResult {
  const issues: string[] = [];
  let sanitizedOutput = output;

  // Check blocked output patterns (case-insensitive)
  for (const pattern of blockedOutputPatterns) {
    try {
      const regex = new RegExp(pattern, "gi");
      if (regex.test(sanitizedOutput)) {
        issues.push(`Pola terblokir terdeteksi: "${pattern}"`);
        sanitizedOutput = sanitizedOutput.replace(regex, "[DISUNTING]");
      }
    } catch {
      // If regex is invalid, try plain string matching
      if (sanitizedOutput.toLowerCase().includes(pattern.toLowerCase())) {
        issues.push(`Pola terblokir terdeteksi: "${pattern}"`);
        sanitizedOutput = sanitizedOutput.replace(
          new RegExp(escapeRegex(pattern), "gi"),
          "[DISUNTING]"
        );
      }
    }
  }

  // Check for email patterns being echoed (detect and replace on sanitizedOutput)
  const emails = sanitizedOutput.match(EMAIL_REGEX);
  if (emails && emails.length > 0) {
    issues.push(`Email terdeteksi dalam output: ${emails.length} alamat`);
    sanitizedOutput = sanitizedOutput.replace(EMAIL_REGEX, "[EMAIL DISUNTING]");
  }

  // Check for phone number patterns (Indonesian format) - detect and replace on sanitizedOutput
  const phones = sanitizedOutput.match(PHONE_REGEX);
  if (phones && phones.length > 0) {
    issues.push(
      `Nomor telepon terdeteksi dalam output: ${phones.length} nomor`
    );
    sanitizedOutput = sanitizedOutput.replace(PHONE_REGEX, "[TELP DISUNTING]");
  }

  // Check for potential system prompt fragments
  if (systemPromptHash) {
    const suspiciousPatterns = [
      /you are an? /i,
      /your role is/i,
      /your instructions/i,
      /system message/i,
      /peran kamu adalah/i,
      /instruksi kamu/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitizedOutput)) {
        issues.push("Potensi kebocoran system prompt terdeteksi");
        sanitizedOutput = sanitizedOutput.replace(pattern, "[DISUNTING]");
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    sanitizedOutput,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
