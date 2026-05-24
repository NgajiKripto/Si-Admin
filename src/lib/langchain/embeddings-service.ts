import { prisma } from "@/lib/prisma";
import { generateEmbedding, cosineSimilarity } from "./embeddings";

/**
 * Store embedding for a single source (knowledge entry or memory).
 * Upserts - updates if sourceId+sourceType already exists.
 */
export async function storeEmbedding(
  sourceType: "KNOWLEDGE" | "MEMORY",
  sourceId: string,
  content: string
): Promise<void> {
  const embedding = await generateEmbedding(content);
  const embeddingJson = JSON.stringify(embedding);

  // Check if embedding already exists for this source
  const existing = await prisma.vectorEmbedding.findFirst({
    where: { sourceType, sourceId },
  });

  if (existing) {
    await prisma.vectorEmbedding.update({
      where: { id: existing.id },
      data: {
        embedding: embeddingJson,
        content,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.vectorEmbedding.create({
      data: {
        sourceType,
        sourceId,
        embedding: embeddingJson,
        content,
      },
    });
  }
}

/**
 * Batch store embeddings for multiple items.
 * Processes sequentially with small delays to avoid rate limits.
 */
export async function batchStoreEmbeddings(
  items: Array<{ sourceType: "KNOWLEDGE" | "MEMORY"; sourceId: string; content: string }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await storeEmbedding(item.sourceType, item.sourceId, item.content);
      success++;
      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to store embedding for ${item.sourceType}:${item.sourceId}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

interface VectorSearchResult {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  similarity: number;
}

/**
 * Search by vector similarity.
 * Generates embedding for query, loads VectorEmbedding records,
 * computes cosine similarity, returns top-N results.
 *
 * Note: This loads up to 1000 records into memory for similarity computation.
 * This is suitable for moderate scale (< 100k embeddings). For production-scale
 * deployments, use a dedicated vector database (e.g., Pinecone, Weaviate, pgvector).
 */
export async function searchByVector(
  queryText: string,
  limit: number = 20,
  sourceType?: string
): Promise<VectorSearchResult[]> {
  const queryEmbedding = await generateEmbedding(queryText);

  // Load embeddings with a cap to prevent unbounded memory usage
  const where = sourceType ? { sourceType } : {};
  const embeddings = await prisma.vectorEmbedding.findMany({ where, take: 1000 });

  if (embeddings.length === 0) {
    return [];
  }

  // Compute similarity for each
  const results: VectorSearchResult[] = [];
  for (const record of embeddings) {
    try {
      const storedEmbedding: number[] = JSON.parse(record.embedding);
      const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
      results.push({
        id: record.id,
        sourceType: record.sourceType,
        sourceId: record.sourceId,
        content: record.content,
        similarity,
      });
    } catch {
      // Skip records with invalid embedding data
      continue;
    }
  }

  // Sort by similarity descending and return top-N
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

/**
 * Get embedding coverage stats.
 */
export async function getEmbeddingCoverage(): Promise<{
  totalKnowledge: number;
  totalMemories: number;
  knowledgeWithEmbeddings: number;
  memoriesWithEmbeddings: number;
  knowledgeWithoutEmbeddings: number;
  memoriesWithoutEmbeddings: number;
}> {
  const [totalKnowledge, totalMemories, knowledgeEmbeddings, memoryEmbeddings] =
    await Promise.all([
      prisma.knowledgeEntry.count({ where: { isActive: true } }),
      prisma.agentMemory.count(),
      prisma.vectorEmbedding.count({ where: { sourceType: "KNOWLEDGE" } }),
      prisma.vectorEmbedding.count({ where: { sourceType: "MEMORY" } }),
    ]);

  return {
    totalKnowledge,
    totalMemories,
    knowledgeWithEmbeddings: knowledgeEmbeddings,
    memoriesWithEmbeddings: memoryEmbeddings,
    knowledgeWithoutEmbeddings: totalKnowledge - knowledgeEmbeddings,
    memoriesWithoutEmbeddings: totalMemories - memoryEmbeddings,
  };
}
