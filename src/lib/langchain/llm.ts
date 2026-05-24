import { ChatOpenAI } from "@langchain/openai";
import { getOpenAIConfig } from "./config";

let llmInstance: ChatOpenAI | null = null;

/**
 * Mendapatkan singleton instance ChatOpenAI.
 * Throws error jika OPENAI_API_KEY tidak dikonfigurasi.
 */
export function getLLM(): ChatOpenAI {
  if (!llmInstance) {
    const config = getOpenAIConfig();

    if (!config.apiKey) {
      throw new Error(
        "OPENAI_API_KEY belum dikonfigurasi. Silakan set environment variable OPENAI_API_KEY."
      );
    }

    llmInstance = new ChatOpenAI({
      model: config.model,
      apiKey: config.apiKey,
      temperature: config.temperature,
    });
  }

  return llmInstance;
}

/**
 * Factory function untuk membuat instance ChatOpenAI dengan konfigurasi kustom.
 */
export function createLLM(
  overrides?: Partial<{ model: string; apiKey: string; temperature: number }>
): ChatOpenAI {
  const config = getOpenAIConfig();

  const apiKey = overrides?.apiKey || config.apiKey;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY belum dikonfigurasi. Silakan set environment variable OPENAI_API_KEY."
    );
  }

  return new ChatOpenAI({
    model: overrides?.model || config.model,
    apiKey,
    temperature: overrides?.temperature ?? config.temperature,
  });
}
