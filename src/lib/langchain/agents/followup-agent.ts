import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import { getLLM } from "@/lib/langchain/llm";
import {
  createFollowUpTool,
  getCustomerHistoryTool,
  createGuardedTools,
} from "@/lib/langchain/tools";
import type { GuardConfig } from "@/lib/agent-guard";

const FOLLOWUP_SYSTEM_PROMPT = `Anda adalah agen spesialis Tindak Lanjut (Follow-up) untuk bisnis kami.

Tugas utama Anda:
- Membuat jadwal follow-up untuk pelanggan
- Memeriksa riwayat pelanggan untuk menentukan tindak lanjut yang tepat
- Mengelola prioritas follow-up (LOW, MEDIUM, HIGH)
- Memastikan tidak ada pelanggan yang terlewat untuk ditindaklanjuti

Panduan:
- Selalu gunakan Bahasa Indonesia yang baik dan profesional
- Tentukan prioritas berdasarkan urgensi dan konteks hubungan pelanggan
- Berikan rekomendasi waktu follow-up yang tepat
- Sertakan deskripsi yang jelas untuk setiap follow-up
- Konfirmasi detail jadwal sebelum membuat follow-up
- Perhatikan hubungan jangka panjang dengan pelanggan`;

const followupTools = [createFollowUpTool, getCustomerHistoryTool];

type FollowupStateType = typeof MessagesAnnotation.State;

export function createFollowUpAgent(guardConfig?: GuardConfig | null) {
  const tools = guardConfig ? createGuardedTools(followupTools, guardConfig) : followupTools;
  const toolNode = new ToolNode(tools);

  async function followupLLMNode(
    state: FollowupStateType
  ): Promise<Partial<FollowupStateType>> {
    const llm = getLLM();
    const llmWithTools = llm.bindTools(tools);

    const messages = [new SystemMessage(FOLLOWUP_SYSTEM_PROMPT), ...state.messages];
    const response = await llmWithTools.invoke(messages);

    return { messages: [response] };
  }

  async function followupToolNode(
    state: FollowupStateType
  ): Promise<Partial<FollowupStateType>> {
    const result = await toolNode.invoke(state);
    return { messages: result.messages };
  }

  function routeAfterLLM(state: FollowupStateType): "tools" | typeof END {
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
    .addNode("llm", followupLLMNode)
    .addNode("tools", followupToolNode)
    .addEdge(START, "llm")
    .addConditionalEdges("llm", routeAfterLLM, ["tools", END])
    .addEdge("tools", "llm");

  return workflow.compile();
}
