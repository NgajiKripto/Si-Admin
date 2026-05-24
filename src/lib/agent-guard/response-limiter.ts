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

  // Truncate by character limit
  if (content.length > maxLength) {
    content = content.substring(0, maxLength);
    truncated = true;
  }

  // Truncate by token count
  if (tokenCount > maxTokens) {
    const limitedTokens = tokens.slice(0, maxTokens);
    const tokenLimited = limitedTokens.join(" ");
    if (tokenLimited.length < content.length) {
      content = tokenLimited;
      truncated = true;
    }
  }

  // Add truncation indicator
  if (truncated) {
    content = content.trimEnd() + "...";
  }

  // Handle structured format
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
