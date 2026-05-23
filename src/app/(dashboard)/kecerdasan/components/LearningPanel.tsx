"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LearningInsight {
  id: string;
  type: string;
  content: string;
  source: string | null;
  confidence: number;
  applied: boolean;
  appliedAt: string | null;
  impact: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  PATTERN: "Pola",
  IMPROVEMENT: "Peningkatan",
  SUGGESTION: "Saran",
  CORRECTION: "Koreksi",
};

const TYPE_COLORS: Record<string, string> = {
  PATTERN: "bg-blue-100 text-blue-800",
  IMPROVEMENT: "bg-green-100 text-green-800",
  SUGGESTION: "bg-yellow-100 text-yellow-800",
  CORRECTION: "bg-red-100 text-red-800",
};

export default function LearningPanel() {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "SUGGESTION",
    content: "",
    source: "",
    confidence: "0.5",
  });

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("type", filter);
      const res = await fetch(`/api/agent/learning?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  async function handleApply(id: string) {
    try {
      const res = await fetch(`/api/agent/learning/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applied: true }),
      });
      if (res.ok) {
        fetchInsights();
      }
    } catch (error) {
      console.error("Error applying insight:", error);
    }
  }

  async function handleSubmit() {
    try {
      const res = await fetch("/api/agent/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          content: formData.content,
          source: formData.source || null,
          confidence: parseFloat(formData.confidence),
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setFormData({ type: "SUGGESTION", content: "", source: "", confidence: "0.5" });
        fetchInsights();
      }
    } catch (error) {
      console.error("Error creating insight:", error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="PATTERN">Pola</SelectItem>
            <SelectItem value="IMPROVEMENT">Peningkatan</SelectItem>
            <SelectItem value="SUGGESTION">Saran</SelectItem>
            <SelectItem value="CORRECTION">Koreksi</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Insight
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Insight Pembelajaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATTERN">Pola</SelectItem>
                    <SelectItem value="IMPROVEMENT">Peningkatan</SelectItem>
                    <SelectItem value="SUGGESTION">Saran</SelectItem>
                    <SelectItem value="CORRECTION">Koreksi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Deskripsi insight..."
                />
              </div>
              <div className="space-y-2">
                <Label>Sumber (opsional)</Label>
                <Input
                  value={formData.source}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, source: e.target.value }))
                  }
                  placeholder="Sumber insight"
                />
              </div>
              <div className="space-y-2">
                <Label>Kepercayaan (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.confidence}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confidence: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!formData.content}
                className="w-full"
              >
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada insight ditemukan
        </div>
      ) : (
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={TYPE_COLORS[insight.type] || ""}
                      variant="secondary"
                    >
                      {TYPE_LABELS[insight.type] || insight.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Kepercayaan: {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {insight.applied ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Diterapkan
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApply(insight.id)}
                    >
                      Terapkan
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{insight.content}</p>
                {insight.source && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sumber: {insight.source}
                  </p>
                )}
                {insight.impact && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dampak: {insight.impact}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(insight.createdAt).toLocaleDateString("id-ID")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
