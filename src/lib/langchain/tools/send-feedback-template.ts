import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const sendFeedbackTemplateTool = new DynamicStructuredTool({
  name: "send_feedback_template",
  description:
    "Mengirimkan template feedback kepada pelanggan. Digunakan untuk mengumpulkan umpan balik pelanggan.",
  schema: z.object({
    customerId: z.string().describe("ID pelanggan"),
    templateId: z.string().describe("ID template feedback"),
  }),
  func: async ({ customerId, templateId }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return `Pelanggan dengan ID "${customerId}" tidak ditemukan.`;
      }

      const template = await prisma.feedbackTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return `Template feedback dengan ID "${templateId}" tidak ditemukan.`;
      }

      const feedback = await prisma.feedback.create({
        data: {
          customerId,
          content: template.content,
          rating: 0,
          templateUsed: template.id,
        },
      });

      return `Template feedback berhasil dikirim:\nID Feedback: ${feedback.id}\nPelanggan: ${customer.name}\nTemplate: ${template.name}\nKategori: ${template.category}`;
    } catch (error) {
      return `Gagal mengirim template feedback: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
