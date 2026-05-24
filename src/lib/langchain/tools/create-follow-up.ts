import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const createFollowUpTool = new DynamicStructuredTool({
  name: "create_follow_up",
  description:
    "Membuat follow-up atau pengingat untuk pelanggan. Digunakan untuk menjadwalkan tindak lanjut.",
  schema: z.object({
    customerId: z.string().describe("ID pelanggan"),
    title: z.string().describe("Judul follow-up"),
    description: z.string().optional().describe("Deskripsi follow-up"),
    dueDate: z.string().describe("Tanggal jatuh tempo (format ISO)"),
    priority: z
      .string()
      .optional()
      .default("MEDIUM")
      .describe("Prioritas: LOW, MEDIUM, HIGH"),
  }),
  func: async ({ customerId, title, description, dueDate, priority }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return `Pelanggan dengan ID "${customerId}" tidak ditemukan.`;
      }

      const followUp = await prisma.followUp.create({
        data: {
          customerId,
          title,
          description: description || null,
          dueDate: new Date(dueDate),
          priority: priority || "MEDIUM",
          status: "PENDING",
        },
      });

      return `Follow-up berhasil dibuat:\nID: ${followUp.id}\nJudul: ${followUp.title}\nPelanggan: ${customer.name}\nJatuh Tempo: ${followUp.dueDate.toISOString().split("T")[0]}\nPrioritas: ${followUp.priority}\nStatus: ${followUp.status}`;
    } catch (error) {
      return `Gagal membuat follow-up: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
