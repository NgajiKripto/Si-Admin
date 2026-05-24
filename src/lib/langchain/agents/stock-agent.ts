import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import { getLLM } from "@/lib/langchain/llm";
import { checkStockTool, updateStockTool, createGuardedTools } from "@/lib/langchain/tools";
import type { GuardConfig } from "@/lib/agent-guard";

const STOCK_SYSTEM_PROMPT = `Anda adalah agen spesialis Manajemen Stok untuk bisnis kami.

Tugas utama Anda:
- Memeriksa ketersediaan stok produk
- Memperbarui data stok (masuk dan keluar)
- Melaporkan stok yang rendah atau perlu restock
- Memberikan informasi akurat tentang inventaris

Panduan:
- Selalu gunakan Bahasa Indonesia yang baik dan profesional
- Berikan informasi kuantitas yang akurat dan jelas
- Sebutkan satuan (unit) saat melaporkan stok
- Peringatkan jika stok mendekati batas minimum
- Konfirmasi detail sebelum melakukan update stok
- Laporkan hasil perubahan stok dengan ringkas dan jelas`;

const stockTools = [checkStockTool, updateStockTool];

type StockStateType = typeof MessagesAnnotation.State;

export function createStockAgent(guardConfig?: GuardConfig | null) {
  const tools = guardConfig ? createGuardedTools(stockTools, guardConfig) : stockTools;
  const toolNode = new ToolNode(tools);

  async function stockLLMNode(state: StockStateType): Promise<Partial<StockStateType>> {
    const llm = getLLM();
    const llmWithTools = llm.bindTools(tools);

    const messages = [new SystemMessage(STOCK_SYSTEM_PROMPT), ...state.messages];
    const response = await llmWithTools.invoke(messages);

    return { messages: [response] };
  }

  async function stockToolNode(state: StockStateType): Promise<Partial<StockStateType>> {
    const result = await toolNode.invoke(state);
    return { messages: result.messages };
  }

  function routeAfterLLM(state: StockStateType): "tools" | typeof END {
    const lastMessage = state.messages[state.messages.length - 1];
    if (
      lastMessage instanceof AIMessage &&
      lastMessage.tool_calls &&
      lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }
    return END;
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("llm", stockLLMNode)
    .addNode("tools", stockToolNode)
    .addEdge(START, "llm")
    .addConditionalEdges("llm", routeAfterLLM, ["tools", END])
    .addEdge("tools", "llm");

  return workflow.compile();
}
