import { OpenAIEmbeddings } from "@langchain/openai";
import { getEmbeddingConfig } from "./config";

let embeddingsInstance: OpenAIEmbeddings | null = null;

/**
 * Mendapatkan singleton instance OpenAIEmbeddings.
 */
export function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddingsInstance) {
    const config = getEmbeddingConfig();

    if (!config.apiKey) {
      throw new Error(
        "OPENAI_API_KEY belum dikonfigurasi. Silakan set environment variable OPENAI_API_KEY."
      );
    }

    embeddingsInstance = new OpenAIEmbeddings({
      model: config.model,
      apiKey: config.apiKey,
    });
  }

  return embeddingsInstance;
}

/**
 * Generate embedding vector untuk satu teks.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings();
  return embeddings.embedQuery(text);
}

/**
 * Generate embedding vectors untuk banyak teks sekaligus.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings = getEmbeddings();
  return embeddings.embedDocuments(texts);
}

/**
 * Menghitung cosine similarity antara dua vector.
 * Mengembalikan nilai antara -1 dan 1.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Dimensi vector tidak cocok: ${a.length} vs ${b.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
