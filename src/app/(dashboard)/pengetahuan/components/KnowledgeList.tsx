"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import KnowledgeForm from "./KnowledgeForm";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  source: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeListProps {
  category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CHAT_HISTORY: "Riwayat Chat",
  FAQ: "FAQ",
  PRODUCT_INFO: "Info Produk",
  SOP: "SOP",
  RESPONSE_TEMPLATE: "Template Respons",
  TONE_GUIDELINE: "Panduan Nada",
};

export default function KnowledgeList({ category }: KnowledgeListProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("limit", "100");

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchEntries();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  }

  function handleEdit(entry: KnowledgeEntry) {
    setEditEntry(entry);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditEntry(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari entri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditEntry(null); setFormOpen(true); }}>
          Tambah
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada entri ditemukan
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{entry.title}</h3>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.tags &&
                        entry.tags.split(",").map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={entry.isActive}
                      onCheckedChange={() =>
                        handleToggleActive(entry.id, entry.isActive)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {deleteConfirm === entry.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Ya
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <KnowledgeForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={fetchEntries}
        editEntry={editEntry}
      />
    </div>
  );
}
