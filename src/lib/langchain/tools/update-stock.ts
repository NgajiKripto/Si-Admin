import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const updateStockTool = new DynamicStructuredTool({
  name: "update_stock",
  description:
    "Memperbarui stok produk dengan mencatat pergerakan stok masuk (IN) atau keluar (OUT).",
  schema: z.object({
    stockItemId: z.string().describe("ID item stok"),
    type: z.enum(["IN", "OUT"]).describe("Tipe pergerakan: IN atau OUT"),
    quantity: z.number().describe("Jumlah pergerakan stok"),
    notes: z.string().optional().describe("Catatan pergerakan stok"),
  }),
  func: async ({ stockItemId, type, quantity, notes }) => {
    try {
      if (quantity <= 0) {
        return "Quantity harus berupa bilangan bulat positif.";
      }

      const currentItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
      });

      if (!currentItem) {
        return `Item stok dengan ID "${stockItemId}" tidak ditemukan.`;
      }

      if (type === "OUT" && currentItem.quantity < quantity) {
        return `Stok tidak mencukupi. Stok saat ini: ${currentItem.quantity}, diminta: ${quantity}.`;
      }

      const quantityChange = type === "IN" ? quantity : -quantity;

      await prisma.$transaction(async (tx) => {
        await tx.stockMovement.create({
          data: {
            stockItemId,
            type,
            quantity,
            notes: notes || null,
          },
        });

        await tx.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: { increment: quantityChange },
            ...(type === "IN" ? { lastRestocked: new Date() } : {}),
          },
        });
      });

      const updatedItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
      });

      return `Pergerakan stok berhasil dicatat:\nProduk: ${updatedItem?.name}\nTipe: ${type}\nJumlah: ${quantity}\nStok Sekarang: ${updatedItem?.quantity} ${updatedItem?.unit}`;
    } catch (error) {
      return `Gagal memperbarui stok: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
