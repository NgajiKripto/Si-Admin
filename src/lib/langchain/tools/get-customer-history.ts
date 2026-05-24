import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const getCustomerHistoryTool = new DynamicStructuredTool({
  name: "get_customer_history",
  description:
    "Mengambil riwayat percakapan pelanggan. Berguna untuk memahami konteks interaksi sebelumnya.",
  schema: z.object({
    customerId: z.string().describe("ID pelanggan"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Jumlah maksimal pesan per percakapan"),
  }),
  func: async ({ customerId, limit }) => {
    const conversations = await prisma.conversation.findMany({
      where: { customerId },
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: limit,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    if (conversations.length === 0) {
      return `Tidak ada riwayat percakapan untuk pelanggan "${customerId}".`;
    }

    return conversations
      .map((conv) => {
        const messages = conv.messages
          .reverse()
          .map((msg) => `  [${msg.sender}] ${msg.content}`)
          .join("\n");
        return `Percakapan ${conv.id} (${conv.status}):\n${messages}`;
      })
      .join("\n\n---\n\n");
  },
});
