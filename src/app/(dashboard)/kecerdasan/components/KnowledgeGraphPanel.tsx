"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface Entity {
  id: string;
  name: string;
  type: string;
  properties: string | null;
  createdAt: string;
}

interface Relation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  weight: number;
  fromEntity: { id: string; name: string; type: string };
  toEntity: { id: string; name: string; type: string };
}

const TYPE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-800",
  PRODUCT: "bg-green-100 text-green-800",
  ISSUE: "bg-red-100 text-red-800",
  SOLUTION: "bg-purple-100 text-purple-800",
  TOPIC: "bg-yellow-100 text-yellow-800",
};

const TYPE_LABELS: Record<string, string> = {
  CUSTOMER: "Pelanggan",
  PRODUCT: "Produk",
  ISSUE: "Masalah",
  SOLUTION: "Solusi",
  TOPIC: "Topik",
};

export default function KnowledgeGraphPanel() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [entityForm, setEntityForm] = useState({ name: "", type: "TOPIC", properties: "" });
  const [relationForm, setRelationForm] = useState({
    fromEntityId: "",
    toEntityId: "",
    relationType: "",
    weight: "1.0",
  });

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/graph");
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
        setRelations(data.relations || []);
      }
    } catch (error) {
      console.error("Error fetching graph:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  async function handleCreateEntity() {
    try {
      const res = await fetch("/api/agent/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: entityForm.name,
          type: entityForm.type,
          properties: entityForm.properties || null,
        }),
      });
      if (res.ok) {
        setEntityDialogOpen(false);
        setEntityForm({ name: "", type: "TOPIC", properties: "" });
        fetchGraph();
      }
    } catch (error) {
      console.error("Error creating entity:", error);
    }
  }

  async function handleCreateRelation() {
    try {
      const res = await fetch("/api/agent/graph/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEntityId: relationForm.fromEntityId,
          toEntityId: relationForm.toEntityId,
          relationType: relationForm.relationType,
          weight: parseFloat(relationForm.weight),
        }),
      });
      if (res.ok) {
        setRelationDialogOpen(false);
        setRelationForm({ fromEntityId: "", toEntityId: "", relationType: "", weight: "1.0" });
        fetchGraph();
      }
    } catch (error) {
      console.error("Error creating relation:", error);
    }
  }

  const filteredEntities = typeFilter && typeFilter !== "all"
    ? entities.filter((e) => e.type === typeFilter)
    : entities;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="CUSTOMER">Pelanggan</SelectItem>
            <SelectItem value="PRODUCT">Produk</SelectItem>
            <SelectItem value="ISSUE">Masalah</SelectItem>
            <SelectItem value="SOLUTION">Solusi</SelectItem>
            <SelectItem value="TOPIC">Topik</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={entityDialogOpen} onOpenChange={setEntityDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Entitas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Entitas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  value={entityForm.name}
                  onChange={(e) => setEntityForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama entitas"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={entityForm.type}
                  onValueChange={(v) => setEntityForm((prev) => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Pelanggan</SelectItem>
                    <SelectItem value="PRODUCT">Produk</SelectItem>
                    <SelectItem value="ISSUE">Masalah</SelectItem>
                    <SelectItem value="SOLUTION">Solusi</SelectItem>
                    <SelectItem value="TOPIC">Topik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Properti (JSON, opsional)</Label>
                <Input
                  value={entityForm.properties}
                  onChange={(e) => setEntityForm((prev) => ({ ...prev, properties: e.target.value }))}
                  placeholder='{"key": "value"}'
                />
              </div>
              <Button onClick={handleCreateEntity} disabled={!entityForm.name} className="w-full">
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={relationDialogOpen} onOpenChange={setRelationDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Relasi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Relasi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Dari Entitas</Label>
                <Select
                  value={relationForm.fromEntityId}
                  onValueChange={(v) => setRelationForm((prev) => ({ ...prev, fromEntityId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({TYPE_LABELS[e.type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ke Entitas</Label>
                <Select
                  value={relationForm.toEntityId}
                  onValueChange={(v) => setRelationForm((prev) => ({ ...prev, toEntityId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({TYPE_LABELS[e.type]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe Relasi</Label>
                <Input
                  value={relationForm.relationType}
                  onChange={(e) => setRelationForm((prev) => ({ ...prev, relationType: e.target.value }))}
                  placeholder="RELATES_TO, SOLVES, dll."
                />
              </div>
              <div className="space-y-2">
                <Label>Bobot (0-1)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={relationForm.weight}
                  onChange={(e) => setRelationForm((prev) => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleCreateRelation}
                disabled={!relationForm.fromEntityId || !relationForm.toEntityId || !relationForm.relationType}
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
      ) : (
        <>
          <div>
            <h3 className="font-medium mb-3">Entitas ({filteredEntities.length})</h3>
            {filteredEntities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada entitas</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {filteredEntities.map((entity) => (
                  <Card key={entity.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{entity.name}</CardTitle>
                        <Badge className={TYPE_COLORS[entity.type] || ""} variant="secondary">
                          {TYPE_LABELS[entity.type] || entity.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entity.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-3">Relasi ({relations.length})</h3>
            {relations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada relasi</p>
            ) : (
              <div className="space-y-2">
                {relations.map((rel) => (
                  <div key={rel.id} className="flex items-center gap-2 text-sm border rounded-md p-2">
                    <Badge variant="outline">{rel.fromEntity.name}</Badge>
                    <span className="text-muted-foreground">--[{rel.relationType}]--&gt;</span>
                    <Badge variant="outline">{rel.toEntity.name}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Bobot: {rel.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
