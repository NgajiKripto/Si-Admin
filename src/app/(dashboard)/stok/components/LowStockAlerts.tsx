"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  category: {
    name: string;
  };
}

interface LowStockAlertsProps {
  items: StockItem[];
}

export default function LowStockAlerts({ items }: LowStockAlertsProps) {
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.minThreshold * 1.5
  );

  if (lowStockItems.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Semua stok dalam kondisi aman
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lowStockItems.map((item) => {
        const isCritical = item.quantity <= item.minThreshold;
        const suggestedRestock = item.minThreshold * 3 - item.quantity;

        return (
          <Card
            key={item.id}
            className={
              isCritical ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${
                    isCritical ? "text-red-500" : "text-yellow-500"
                  }`}
                />
                <CardTitle className="text-sm">{item.name}</CardTitle>
                <Badge variant={isCritical ? "destructive" : "secondary"}>
                  {isCritical ? "Kritis" : "Rendah"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p>
                  Stok saat ini:{" "}
                  <span className="font-semibold">
                    {item.quantity} {item.unit}
                  </span>
                </p>
                <p>
                  Batas minimum:{" "}
                  <span className="font-semibold">
                    {item.minThreshold} {item.unit}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Saran restok: {suggestedRestock > 0 ? suggestedRestock : 0} {item.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
