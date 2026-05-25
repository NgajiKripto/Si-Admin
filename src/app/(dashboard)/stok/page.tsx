"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, PackageCheck, Package, AlertTriangle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockTable from "./components/StockTable";
import StockForm from "./components/StockForm";
import StockReceive from "./components/StockReceive";
import StockMovementHistory from "./components/StockMovementHistory";
import LowStockAlerts from "./components/LowStockAlerts";

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

interface Category {
  id: string;
  name: string;
}

export default function StokPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter && categoryFilter !== "all")
        params.set("categoryId", categoryFilter);

      const res = await fetch(`/api/stok?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? data);
      }
    } catch (error) {
      console.error("Error fetching stock items:", error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch("/api/stok/movement");
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (error) {
      console.error("Error fetching movements:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/pengaturan/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchMovements();
    fetchCategories();
  }, [fetchItems, fetchMovements, fetchCategories]);

  const totalItems = items.length;
  const lowStockItems = items.filter((i) => i.quantity <= i.minThreshold);
  const needRestock = items.filter(
    (i) => i.quantity <= i.minThreshold * 1.5 && i.quantity > i.minThreshold
  );
  const todayMovements = movements.filter((m) => {
    const today = new Date();
    const moveDate = new Date(m.createdAt);
    return moveDate.toDateString() === today.toDateString();
  });

  async function handleCreateItem(data: {
    name: string;
    sku: string;
    categoryId: string;
    quantity: number;
    unit: string;
    price: number;
    minThreshold: number;
  }) {
    try {
      await fetch("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      fetchItems();
    } catch (error) {
      console.error("Error creating stock item:", error);
    }
  }

  async function handleReceiveStock(data: {
    stockItemId: string;
    quantity: number;
    notes: string;
  }) {
    try {
      await fetch("/api/stok/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "IN" }),
      });
      fetchItems();
      fetchMovements();
    } catch (error) {
      console.error("Error receiving stock:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Barang</h1>
          <p className="text-sm text-muted-foreground">
            Kelola inventaris dan stok barang
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setReceiveOpen(true)}>
            <PackageCheck className="h-4 w-4 mr-2" />
            Terima Barang
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Stok
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perlu Restok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {needRestock.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pergerakan Hari Ini
            </CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMovements.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Daftar Stok</TabsTrigger>
          <TabsTrigger value="movements">Pergerakan</TabsTrigger>
          <TabsTrigger value="alerts">Peringatan</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Cari item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat...
                </div>
              ) : (
                <StockTable items={items} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pergerakan Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <StockMovementHistory movements={movements} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Peringatan Stok Rendah</CardTitle>
            </CardHeader>
            <CardContent>
              <LowStockAlerts items={items} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StockForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateItem}
      />
      <StockReceive
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        onSubmit={handleReceiveStock}
        items={items}
      />
    </div>
  );
}
