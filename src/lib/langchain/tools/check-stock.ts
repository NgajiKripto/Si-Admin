import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const checkStockTool = new DynamicStructuredTool({
  name: "check_stock",
  description:
    "Memeriksa ketersediaan stok produk berdasarkan nama produk atau SKU.",
  schema: z.object({
    productName: z.string().describe("Nama produk yang dicari"),
    sku: z.string().optional().describe("SKU produk (opsional)"),
  }),
  func: async ({ productName, sku }) => {
    const conditions: object[] = [];

    if (sku) {
      conditions.push({ sku });
    }

    if (productName) {
      conditions.push({ name: { contains: productName } });
    }

    const items = await prisma.stockItem.findMany({
      where: {
        OR: conditions,
      },
      include: {
        category: true,
      },
      take: 10,
    });

    if (items.length === 0) {
      return `Produk "${productName}" tidak ditemukan dalam sistem stok.`;
    }

    return items
      .map(
        (item) =>
          `Produk: ${item.name}\nSKU: ${item.sku}\nKategori: ${item.category.name}\nStok: ${item.quantity} ${item.unit}\nHarga: Rp ${item.price.toLocaleString("id-ID")}\nMin. Threshold: ${item.minThreshold}`
      )
      .join("\n\n---\n\n");
  },
});
