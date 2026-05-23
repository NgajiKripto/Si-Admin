"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  source: string | null;
  isActive: boolean;
}

interface KnowledgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editEntry?: KnowledgeEntry | null;
}

const CATEGORIES = [
  { value: "CHAT_HISTORY", label: "Riwayat Chat" },
  { value: "FAQ", label: "FAQ" },
  { value: "PRODUCT_INFO", label: "Info Produk" },
  { value: "SOP", label: "SOP" },
  { value: "RESPONSE_TEMPLATE", label: "Template Respons" },
  { value: "TONE_GUIDELINE", label: "Panduan Nada" },
];

export default function KnowledgeForm({
  open,
  onOpenChange,
  onSuccess,
  editEntry,
}: KnowledgeFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editEntry;

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setContent(editEntry.content);
      setCategory(editEntry.category);
      setTags(editEntry.tags || "");
      setSource(editEntry.source || "");
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      setSource("");
    }
  }, [editEntry, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content || !category) return;

    setLoading(true);
    try {
      const payload = {
        title,
        content,
        category,
        tags: tags || null,
        source: source || null,
      };

      const url = isEdit ? `/api/knowledge/${editEntry.id}` : "/api/knowledge";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onOpenChange(false);
        setTitle("");
        setContent("");
        setCategory("");
        setTags("");
        setSource("");
      } else {
        const data = await res.json();
        alert(data.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Gagal menyimpan entri");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Entri Pengetahuan" : "Tambah Entri Pengetahuan"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul entri..."
            />
          </div>
          <div className="space-y-2">
            <Label>Konten</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Isi konten pengetahuan..."
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags (pisahkan dengan koma)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div className="space-y-2">
            <Label>Sumber (opsional)</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Sumber informasi..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!title || !content || !category || loading}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
