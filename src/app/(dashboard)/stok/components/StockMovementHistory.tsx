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

interface Movement {
  id: string;
  stockItemId: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  stockItem: {
    name: string;
    sku: string;
  };
}

interface StockMovementHistoryProps {
  movements: Movement[];
}

export default function StockMovementHistory({
  movements,
}: StockMovementHistoryProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada pergerakan stok
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipe</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Catatan</TableHead>
          <TableHead>Tanggal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell>
              <Badge
                variant={movement.type === "IN" ? "default" : "destructive"}
              >
                {movement.type === "IN" ? "Masuk" : "Keluar"}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">
              {movement.stockItem.name}
            </TableCell>
            <TableCell>
              {movement.type === "IN" ? "+" : "-"}
              {movement.quantity}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {movement.notes || "-"}
            </TableCell>
            <TableCell>
              {new Date(movement.createdAt).toLocaleDateString("id-ID")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
