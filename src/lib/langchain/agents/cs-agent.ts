import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import { getLLM } from "@/lib/langchain/llm";
import {
  searchKnowledgeTool,
  getCustomerHistoryTool,
  sendFeedbackTemplateTool,
} from "@/lib/langchain/tools";

const CS_SYSTEM_PROMPT = `Anda adalah agen Customer Service profesional untuk bisnis kami.

Tugas utama Anda:
- Menjawab pertanyaan pelanggan tentang produk, layanan, dan kebijakan
- Menangani keluhan dengan empati dan memberikan solusi
- Membantu pelanggan mendapatkan informasi yang mereka butuhkan
- Mengirimkan template feedback jika diminta

Panduan komunikasi:
- Selalu gunakan Bahasa Indonesia yang baik, sopan, dan penuh empati
- Tunjukkan kepedulian terhadap masalah pelanggan
- Berikan jawaban yang jelas dan informatif berdasarkan knowledge base
- Jika tidak yakin, sampaikan dengan jujur dan tawarkan bantuan lebih lanjut
- Gunakan nada hangat, ramah, dan profesional`;

const csTools = [searchKnowledgeTool, getCustomerHistoryTool, sendFeedbackTemplateTool];
const toolNode = new ToolNode(csTools);

type CSStateType = typeof MessagesAnnotation.State;

async function csLLMNode(state: CSStateType): Promise<Partial<CSStateType>> {
  const llm = getLLM();
  const llmWithTools = llm.bindTools(csTools);

  const messages = [new SystemMessage(CS_SYSTEM_PROMPT), ...state.messages];
  const response = await llmWithTools.invoke(messages);

  return { messages: [response] };
}

async function csToolNode(state: CSStateType): Promise<Partial<CSStateType>> {
  const result = await toolNode.invoke(state);
  return { messages: result.messages };
}

function routeAfterLLM(state: CSStateType): "tools" | typeof END {
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

export function createCSAgent() {
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("llm", csLLMNode)
    .addNode("tools", csToolNode)
    .addEdge(START, "llm")
    .addConditionalEdges("llm", routeAfterLLM, ["tools", END])
    .addEdge("tools", "llm");

  return workflow.compile();
}
