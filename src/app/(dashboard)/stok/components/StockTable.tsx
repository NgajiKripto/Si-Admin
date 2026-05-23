"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  price: number;
  lastRestocked: string | null;
  category: {
    id: string;
    name: string;
  };
}

interface StockTableProps {
  items: StockItem[];
}

export default function StockTable({ items }: StockTableProps) {
  function getQuantityColor(quantity: number, threshold: number) {
    if (quantity <= threshold) return "text-red-600 font-semibold";
    if (quantity <= threshold * 1.5) return "text-yellow-600 font-semibold";
    return "text-green-600";
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada item stok
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Satuan</TableHead>
          <TableHead>Harga</TableHead>
          <TableHead>Terakhir Restok</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {item.sku}
              </code>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{item.category.name}</Badge>
            </TableCell>
            <TableCell
              className={getQuantityColor(item.quantity, item.minThreshold)}
            >
              {item.quantity}
              {item.quantity <= item.minThreshold && (
                <span className="ml-1 text-xs">(rendah)</span>
              )}
            </TableCell>
            <TableCell>{item.unit}</TableCell>
            <TableCell>{formatPrice(item.price)}</TableCell>
            <TableCell>
              {item.lastRestocked
                ? new Date(item.lastRestocked).toLocaleDateString("id-ID")
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
