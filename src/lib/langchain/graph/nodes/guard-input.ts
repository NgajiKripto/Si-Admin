import { prisma } from "@/lib/prisma";
import { processInput, type GuardConfig } from "@/lib/agent-guard";
import { HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "../state";

export async function guardInputNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // Load GuardConfig from database
  const dbConfig = await prisma.agentGuardConfig.findFirst();

  let guardConfig: GuardConfig;

  if (dbConfig) {
    guardConfig = {
      id: dbConfig.id,
      isEnabled: dbConfig.isEnabled,
      maxResponseLength: dbConfig.maxResponseLength,
      maxResponseTokens: dbConfig.maxResponseTokens,
      allowedTopics: JSON.parse(dbConfig.allowedTopics) as string[],
      blockedPatterns: JSON.parse(dbConfig.blockedPatterns) as string[],
      blockedOutputPatterns: JSON.parse(
        dbConfig.blockedOutputPatterns
      ) as string[],
      responseFormat: dbConfig.responseFormat,
      systemPromptHash: dbConfig.systemPromptHash,
      readOnlyMode: dbConfig.readOnlyMode,
      allowedActions: JSON.parse(dbConfig.allowedActions) as string[],
    };
  } else {
    // Default config if none found in DB
    guardConfig = {
      id: "",
      isEnabled: true,
      maxResponseLength: 500,
      maxResponseTokens: 200,
      allowedTopics: [
        "produk",
        "harga",
        "pengiriman",
        "pembayaran",
        "keluhan",
        "retur",
        "promo",
        "jam_operasional",
        "stok",
        "garansi",
      ],
      blockedPatterns: [
        "ignore previous",
        "abaikan instruksi",
        "you are now",
        "kamu sekarang adalah",
      ],
      blockedOutputPatterns: [
        "system prompt",
        "instruksi sistem",
        "you are an AI",
        "saya adalah AI",
      ],
      responseFormat: "text",
      systemPromptHash: null,
      readOnlyMode: false,
      allowedActions: [
        "SEND_MESSAGE",
        "CREATE_FOLLOWUP",
        "UPDATE_STOCK",
        "RECORD_FEEDBACK",
        "SEND_FEEDBACK_TEMPLATE",
      ],
    };
  }

  // If guard is disabled, allow everything through
  if (!guardConfig.isEnabled) {
    return {
      inputAllowed: true,
      guardConfig,
      currentStep: "guard_input",
    };
  }

  // Get last user message
  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage =
    lastMessage instanceof HumanMessage
      ? (lastMessage.content as string)
      : String(lastMessage.content);

  // Process input through guard
  const result = processInput(userMessage, guardConfig);

  if (!result.allowed) {
    return {
      inputAllowed: false,
      guardConfig,
      finalResponse:
        "Maaf, saya tidak dapat memproses permintaan tersebut. Silakan ajukan pertanyaan yang berkaitan dengan produk atau layanan kami.",
      currentStep: "guard_input",
    };
  }

  // When allowed, replace last message with sanitized version
  const sanitizedContent = result.sanitizeResult.sanitizedInput;
  const updatedMessages = [
    ...state.messages.slice(0, -1),
    new HumanMessage(sanitizedContent),
  ];

  return {
    messages: updatedMessages,
    inputAllowed: true,
    guardConfig,
    currentStep: "guard_input",
  };
}
