import { getLLM } from "@/lib/langchain/llm";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const CLASSIFICATION_PROMPT = `Anda adalah router yang mengklasifikasikan pesan pengguna ke kategori yang tepat.

Klasifikasikan pesan berikut ke SATU kategori:
- "cs": Pertanyaan umum, informasi produk, keluhan, salam/sapaan, feedback, template feedback
- "stock": Pertanyaan stok/inventaris, update stok, cek ketersediaan, harga produk terkait stok
- "followup": Penjadwalan, pengingat, tindak lanjut, manajemen follow-up

Jawab HANYA dengan satu kata: cs, stock, atau followup
Tidak ada penjelasan tambahan.`;

export type AgentRoute = "cs" | "stock" | "followup";

export async function routeQuery(message: string): Promise<AgentRoute> {
  try {
    const llm = getLLM();

    const response = await llm.invoke([
      new SystemMessage(CLASSIFICATION_PROMPT),
      new HumanMessage(message),
    ]);

    const content = String(response.content).trim().toLowerCase();

    if (content.includes("stock")) {
      return "stock";
    }
    if (content.includes("followup") || content.includes("follow")) {
      return "followup";
    }
    // Default to cs for any other response
    return "cs";
  } catch {
    // If classification fails, default to cs
    return "cs";
  }
}
