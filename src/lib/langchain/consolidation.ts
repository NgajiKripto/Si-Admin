import { getLLM } from "./llm";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * LLM-powered summarization of working memories into an episodic summary.
 * Falls back to simple string join if LLM is unavailable.
 */
export async function summarizeWorkingMemories(
  memories: Array<{ content: string; context?: string | null }>
): Promise<string> {
  try {
    const llm = getLLM();
    const memoriesText = memories
      .map((m, i) => `${i + 1}. ${m.content}${m.context ? ` (konteks: ${m.context})` : ""}`)
      .join("\n");

    const response = await llm.invoke([
      new SystemMessage(
        "Kamu adalah asisten AI yang bertugas meringkas memori kerja menjadi ringkasan episodik yang padat dan informatif dalam Bahasa Indonesia."
      ),
      new HumanMessage(
        `Ringkas memori kerja berikut menjadi satu ringkasan episodik yang padat dan informatif:\n\n${memoriesText}`
      ),
    ]);

    const content = typeof response.content === "string" ? response.content : String(response.content);
    return content.trim();
  } catch (error) {
    console.error("LLM summarization failed, using fallback:", error);
    // Fallback: simple string join (original logic)
    const summary = memories.map((m) => m.content).join(" | ");
    return `Ringkasan: ${summary.substring(0, 500)}`;
  }
}

/**
 * LLM-powered extraction of semantic facts from episodic memory content.
 * Falls back to simple prefix if LLM is unavailable.
 */
export async function extractSemanticFacts(
  episodicContent: string
): Promise<string[]> {
  try {
    const llm = getLLM();

    const response = await llm.invoke([
      new SystemMessage(
        "Kamu adalah asisten AI yang bertugas mengekstrak fakta-fakta kunci dari ringkasan episodik. Berikan output sebagai daftar fakta, satu fakta per baris, dimulai dengan tanda '-'."
      ),
      new HumanMessage(
        `Dari ringkasan episodik berikut, ekstrak fakta-fakta kunci (pelanggan, produk, preferensi, masalah):\n\n${episodicContent}`
      ),
    ]);

    const content = typeof response.content === "string" ? response.content : String(response.content);

    // Parse response into array of facts
    const facts = content
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter((line) => line.length > 0);

    return facts.length > 0 ? facts : [`Fakta: ${episodicContent.substring(0, 300)}`];
  } catch (error) {
    console.error("LLM fact extraction failed, using fallback:", error);
    // Fallback: return single fact with prefix (original logic)
    return [`Fakta: ${episodicContent.substring(0, 300)}`];
  }
}

/**
 * LLM-powered identification of procedural patterns from semantic facts.
 * Falls back to simple prefix if LLM is unavailable.
 */
export async function identifyProceduralPatterns(
  semanticContents: string[]
): Promise<string> {
  try {
    const llm = getLLM();
    const factsText = semanticContents
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n");

    const response = await llm.invoke([
      new SystemMessage(
        "Kamu adalah asisten AI yang bertugas mengidentifikasi pola prosedural dari fakta-fakta semantik. Berikan satu ringkasan pola yang bisa digunakan sebagai panduan respons."
      ),
      new HumanMessage(
        `Dari fakta-fakta semantik berikut, identifikasi pola prosedural yang bisa digunakan sebagai panduan respons:\n\n${factsText}`
      ),
    ]);

    const content = typeof response.content === "string" ? response.content : String(response.content);
    return content.trim();
  } catch (error) {
    console.error("LLM pattern identification failed, using fallback:", error);
    // Fallback: simple prefix (original logic)
    const combined = semanticContents.join(" | ");
    return `Pola: ${combined.substring(0, 300)}`;
  }
}
