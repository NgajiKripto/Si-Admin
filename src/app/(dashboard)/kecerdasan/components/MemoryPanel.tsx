"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Memory {
  id: string;
  tier: string;
  content: string;
  context: string | null;
  strength: number;
  accessCount: number;
  lastAccessedAt: string;
  decayFactor: number;
  metadata: string | null;
  createdAt: string;
}

interface ConsolidationResult {
  consolidated: {
    working_to_episodic: number;
    episodic_to_semantic: number;
    semantic_to_procedural: number;
  };
}

const TIERS = [
  {
    key: "WORKING",
    label: "Memori Kerja",
    description: "Informasi real-time dari percakapan aktif",
    color: "bg-blue-100 text-blue-800",
  },
  {
    key: "EPISODIC",
    label: "Memori Episodik",
    description: "Ringkasan percakapan dan interaksi sebelumnya",
    color: "bg-green-100 text-green-800",
  },
  {
    key: "SEMANTIC",
    label: "Memori Semantik",
    description: "Fakta dan pengetahuan yang diekstrak",
    color: "bg-purple-100 text-purple-800",
  },
  {
    key: "PROCEDURAL",
    label: "Memori Prosedural",
    description: "Pola dan prosedur yang dipelajari dari pengalaman",
    color: "bg-orange-100 text-orange-800",
  },
];

export default function MemoryPanel() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  const [consolidationResult, setConsolidationResult] =
    useState<ConsolidationResult | null>(null);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/memory?limit=100");
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  async function handleConsolidate() {
    setConsolidating(true);
    setConsolidationResult(null);
    try {
      const res = await fetch("/api/agent/memory/consolidate", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setConsolidationResult(data);
        fetchMemories();
      }
    } catch (error) {
      console.error("Error consolidating:", error);
    } finally {
      setConsolidating(false);
    }
  }

  function getMemoriesByTier(tier: string) {
    return memories.filter((m) => m.tier === tier);
  }

  function getStrengthColor(strength: number) {
    if (strength >= 0.8) return "text-green-600";
    if (strength >= 0.5) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={handleConsolidate} disabled={consolidating}>
          <Layers className="h-4 w-4 mr-2" />
          {consolidating ? "Mengkonsolidasi..." : "Konsolidasi Memori"}
        </Button>
        <Button variant="outline" onClick={fetchMemories} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {consolidationResult && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Hasil Konsolidasi:</p>
            <div className="flex gap-4 text-sm">
              <span>
                Kerja → Episodik:{" "}
                <strong>
                  {consolidationResult.consolidated.working_to_episodic}
                </strong>
              </span>
              <span>
                Episodik → Semantik:{" "}
                <strong>
                  {consolidationResult.consolidated.episodic_to_semantic}
                </strong>
              </span>
              <span>
                Semantik → Prosedural:{" "}
                <strong>
                  {consolidationResult.consolidated.semantic_to_procedural}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {TIERS.map((tier) => {
            const tierMemories = getMemoriesByTier(tier.key);
            return (
              <Card key={tier.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tier.label}</CardTitle>
                    <Badge variant="secondary">{tierMemories.length}</Badge>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tierMemories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada memori
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {tierMemories.slice(0, 5).map((mem) => (
                        <div
                          key={mem.id}
                          className="border rounded-md p-2 text-sm"
                        >
                          <p className="line-clamp-2">{mem.content}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span
                              className={getStrengthColor(mem.strength)}
                            >
                              Kekuatan: {(mem.strength * 100).toFixed(0)}%
                            </span>
                            <span>Akses: {mem.accessCount}x</span>
                          </div>
                        </div>
                      ))}
                      {tierMemories.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{tierMemories.length - 5} lainnya
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
