"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthData {
  memoryByTier: {
    working: number;
    episodic: number;
    semantic: number;
    procedural: number;
  };
  knowledgeCoverage: {
    CHAT_HISTORY: number;
    FAQ: number;
    PRODUCT_INFO: number;
    SOP: number;
    RESPONSE_TEMPLATE: number;
    TONE_GUIDELINE: number;
  };
  learningStats: {
    total: number;
    applied: number;
    pending: number;
    avgConfidence: number;
  };
  graphStats: {
    entities: number;
    relations: number;
  };
  recentActivity: {
    lastMemoryCreated: string | null;
    lastInsightCreated: string | null;
    lastConsolidation: string | null;
  };
  responseQuality: {
    averageRating: number;
    totalFeedbacks: number;
  };
}

const COVERAGE_LABELS: Record<string, string> = {
  CHAT_HISTORY: "Riwayat Chat",
  FAQ: "FAQ",
  PRODUCT_INFO: "Info Produk",
  SOP: "SOP",
  RESPONSE_TEMPLATE: "Template Respons",
  TONE_GUIDELINE: "Panduan Nada",
};

export default function HealthDashboard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/agent/health");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching health:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Memuat...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">Gagal memuat data</div>;
  }

  const totalMemory =
    data.memoryByTier.working +
    data.memoryByTier.episodic +
    data.memoryByTier.semantic +
    data.memoryByTier.procedural;

  function renderStars(rating: number) {
    const stars = [];
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rounded ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      );
    }
    return stars;
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Belum ada";
    return new Date(dateStr).toLocaleString("id-ID");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Memory Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kesehatan Memori</CardTitle>
          <CardDescription>Total: {totalMemory} entri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Kerja", value: data.memoryByTier.working, color: "bg-blue-500" },
            { label: "Episodik", value: data.memoryByTier.episodic, color: "bg-green-500" },
            { label: "Semantik", value: data.memoryByTier.semantic, color: "bg-purple-500" },
            { label: "Prosedural", value: data.memoryByTier.procedural, color: "bg-orange-500" },
          ].map((tier) => (
            <div key={tier.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{tier.label}</span>
                <span className="font-medium">{tier.value}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${tier.color} rounded-full`}
                  style={{
                    width: totalMemory > 0 ? `${(tier.value / totalMemory) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Knowledge Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cakupan Pengetahuan</CardTitle>
          <CardDescription>Entri per kategori</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(data.knowledgeCoverage).map(([key, count]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span>{COVERAGE_LABELS[key] || key}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Learning Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progres Pembelajaran</CardTitle>
          <CardDescription>
            Kepercayaan rata-rata: {(data.learningStats.avgConfidence * 100).toFixed(0)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Total Insight</span>
            <span className="font-medium">{data.learningStats.total}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Diterapkan</span>
            <Badge className="bg-green-100 text-green-800" variant="secondary">
              {data.learningStats.applied}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Menunggu</span>
            <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
              {data.learningStats.pending}
            </Badge>
          </div>
          {data.learningStats.total > 0 && (
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${(data.learningStats.applied / data.learningStats.total) * 100}%`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Graph */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Graf Pengetahuan</CardTitle>
          <CardDescription>Entitas dan relasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Entitas</span>
            <span className="font-medium">{data.graphStats.entities}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Relasi</span>
            <span className="font-medium">{data.graphStats.relations}</span>
          </div>
        </CardContent>
      </Card>

      {/* Response Quality */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kualitas Respons</CardTitle>
          <CardDescription>Berdasarkan feedback pelanggan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{renderStars(data.responseQuality.averageRating)}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{data.responseQuality.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground"> / 5</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total feedback: {data.responseQuality.totalFeedbacks}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aktivitas Terakhir</CardTitle>
          <CardDescription>Timestamp aktivitas sistem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="text-muted-foreground">Memori terakhir dibuat:</p>
            <p className="font-medium">{formatDate(data.recentActivity.lastMemoryCreated)}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Insight terakhir dibuat:</p>
            <p className="font-medium">{formatDate(data.recentActivity.lastInsightCreated)}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Konsolidasi terakhir:</p>
            <p className="font-medium">{formatDate(data.recentActivity.lastConsolidation)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
