"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "knowledge" | "memory";
  title: string;
  content_preview: string;
  score: number;
  category?: string;
  tier?: string;
}

export default function HybridSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), limit: 20 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari di pengetahuan dan memori..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Mencari..." : "Cari"}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Mencari...</div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada hasil ditemukan
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={`${result.type}-${result.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={result.type === "knowledge" ? "default" : "secondary"}
                      >
                        {result.type === "knowledge" ? "Pengetahuan" : "Memori"}
                      </Badge>
                      {result.category && (
                        <Badge variant="outline">{result.category}</Badge>
                      )}
                      {result.tier && (
                        <Badge variant="outline">{result.tier}</Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-medium">{result.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {result.content_preview}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium">
                      {(result.score * 100).toFixed(0)}%
                    </div>
                    <div className="w-16 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${result.score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
