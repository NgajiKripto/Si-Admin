export interface LimitResult {
  content: string;
  truncated: boolean;
  originalLength: number;
  tokenCount: number;
  format: string;
}

export function limitResponse(
  response: string,
  maxLength: number,
  maxTokens: number,
  format: string
): LimitResult {
  const originalLength = response.length;
  const tokens = response.split(/\s+/).filter((t) => t.length > 0);
  const tokenCount = tokens.length;

  let content = response;
  let truncated = false;

  // Truncate by token count first (preserves word boundaries)
  if (tokenCount > maxTokens) {
    const limitedTokens = tokens.slice(0, maxTokens);
    content = limitedTokens.join(" ");
    truncated = true;
  }

  // Then truncate by character limit
  if (content.length > maxLength) {
    content = content.substring(0, maxLength);
    truncated = true;
  }

  // Add truncation indicator
  if (truncated) {
    content = content.trimEnd() + "...";
  }

  // Handle structured format after truncation to avoid corrupting JSON
  if (format === "structured") {
    try {
      JSON.parse(content);
    } catch {
      content = JSON.stringify({ message: content });
    }
  }

  return {
    content,
    truncated,
    originalLength,
    tokenCount: Math.min(tokenCount, maxTokens),
    format,
  };
}
