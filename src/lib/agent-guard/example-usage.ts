/**
 * Contoh Penggunaan Agent Guard
 *
 * File ini menunjukkan cara mengintegrasikan Agent Guard ke dalam
 * route API chat. Berikut adalah alur lengkapnya:
 *
 * 1. Muat konfigurasi dari database (Prisma)
 * 2. Proses input pengguna melalui guard
 * 3. Jika input diblokir, kembalikan pesan penolakan
 * 4. Jika input aman, kirim ke LLM
 * 5. Proses output LLM melalui guard
 * 6. Kembalikan output yang sudah divalidasi
 */

import { processInput, processOutput } from "@/lib/agent-guard";
import type { GuardConfig } from "@/lib/agent-guard";
import { prisma } from "@/lib/prisma";

/**
 * Contoh handler untuk route API chat yang menggunakan Agent Guard.
 *
 * Fungsi ini BUKAN route handler yang sebenarnya, melainkan contoh
 * referensi untuk pengembang yang ingin mengintegrasikan guard.
 */
export async function exampleChatHandler(userMessage: string) {
  // Langkah 1: Muat konfigurasi guard dari database
  const dbConfig = await prisma.agentGuardConfig.findFirst();

  if (!dbConfig) {
    // Jika belum ada konfigurasi, gunakan default
    // Dalam production, buat default di database saat setup
    return { response: "Konfigurasi guard belum diatur." };
  }

  // Parse JSON fields menjadi array
  const config: GuardConfig = {
    id: dbConfig.id,
    isEnabled: dbConfig.isEnabled,
    maxResponseLength: dbConfig.maxResponseLength,
    maxResponseTokens: dbConfig.maxResponseTokens,
    allowedTopics: JSON.parse(dbConfig.allowedTopics),
    blockedPatterns: JSON.parse(dbConfig.blockedPatterns),
    blockedOutputPatterns: JSON.parse(dbConfig.blockedOutputPatterns),
    responseFormat: dbConfig.responseFormat,
    systemPromptHash: dbConfig.systemPromptHash,
  };

  // Langkah 2: Jika guard tidak aktif, lewati pengecekan
  if (!config.isEnabled) {
    // Langsung proses pesan tanpa guard
    const llmResponse = await callLLM(userMessage);
    return { response: llmResponse };
  }

  // Langkah 3: Proses input melalui guard
  const inputResult = processInput(userMessage, config);

  // Langkah 4: Jika input diblokir, kembalikan pesan penolakan
  if (!inputResult.allowed) {
    return {
      response:
        "Maaf, saya hanya dapat membantu pertanyaan seputar produk dan layanan kami.",
      blocked: true,
      reason: inputResult.blockedReason,
    };
  }

  // Langkah 5: Kirim input yang sudah disanitasi ke LLM
  const llmResponse = await callLLM(inputResult.sanitizeResult.sanitizedInput);

  // Langkah 6: Proses output melalui guard (limiting + validasi)
  const outputResult = processOutput(llmResponse, config);

  // Langkah 7: Kembalikan output yang sudah aman
  return {
    response: outputResult.content,
    truncated: outputResult.limitResult.truncated,
    validationIssues: outputResult.validationResult.issues,
  };
}

/**
 * Placeholder untuk panggilan LLM.
 * Ganti dengan implementasi sebenarnya (OpenAI, Anthropic, dll).
 */
async function callLLM(input: string): Promise<string> {
  // Implementasi panggilan ke LLM API
  // Contoh: const response = await openai.chat.completions.create(...)
  void input;
  return "Respons dari LLM";
}
