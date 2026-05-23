"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, FolderOpen } from "lucide-react";

interface Stats {
  total: number;
  active: number;
  categories: Record<string, number>;
}

export default function KnowledgeStats() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    categories: {},
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/knowledge?limit=1000");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const categories: Record<string, number> = {};
        let active = 0;

        for (const item of items) {
          categories[item.category] = (categories[item.category] || 0) + 1;
          if (item.isActive) active++;
        }

        setStats({
          total: data.total || items.length,
          active,
          categories,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entri</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entri Aktif</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kategori Terisi</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.keys(stats.categories).length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
