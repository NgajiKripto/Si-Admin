export interface OpenAIConfig {
  model: string;
  apiKey: string;
  temperature: number;
  maxIterations: number;
}

export interface EmbeddingConfig {
  model: string;
  apiKey: string;
}

export function getOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const temperature = parseFloat(process.env.AGENT_TEMPERATURE || "0.3");
  const maxIterations = parseInt(process.env.AGENT_MAX_ITERATIONS || "10", 10);

  return {
    model,
    apiKey,
    temperature,
    maxIterations,
  };
}

export function getEmbeddingConfig(): EmbeddingConfig {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  return {
    model,
    apiKey,
  };
}
