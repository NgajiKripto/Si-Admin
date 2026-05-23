"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: "CHAT_HISTORY", label: "Riwayat Chat" },
  { value: "FAQ", label: "FAQ" },
  { value: "PRODUCT_INFO", label: "Info Produk" },
  { value: "SOP", label: "SOP" },
  { value: "RESPONSE_TEMPLATE", label: "Template Respons" },
  { value: "TONE_GUIDELINE", label: "Panduan Nada" },
];

export default function BulkImport({
  open,
  onOpenChange,
  onSuccess,
}: BulkImportProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  function parseEntries(input: string): string[] {
    // Split by double newline or "---" separator
    const blocks = input
      .split(/\n{2,}|---/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
    return blocks;
  }

  function handleTextChange(value: string) {
    setText(value);
    const parsed = parseEntries(value);
    setPreview(parsed);
  }

  async function handleImport() {
    if (!text.trim() || !category) return;

    const blocks = parseEntries(text);
    if (blocks.length === 0) return;

    setLoading(true);
    let successCount = 0;

    try {
      for (const block of blocks) {
        // Use first line as title, rest as content
        const lines = block.split("\n");
        const title = lines[0].substring(0, 100);
        const content = block;

        const res = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, category }),
        });

        if (res.ok) successCount++;
      }

      alert(`Berhasil mengimpor ${successCount} dari ${blocks.length} entri`);
      setText("");
      setCategory("");
      setPreview([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing:", error);
      alert("Gagal mengimpor data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor Data Massal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>
              Data (pisahkan setiap entri dengan baris kosong atau &quot;---&quot;)
            </Label>
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={"Entri pertama\nIsi konten...\n\nEntri kedua\nIsi konten..."}
              rows={8}
            />
          </div>
          {preview.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">
                Pratinjau: {preview.length} entri akan dibuat
              </p>
              <ul className="mt-1 space-y-1 max-h-32 overflow-auto">
                {preview.slice(0, 10).map((block, idx) => (
                  <li key={idx} className="truncate">
                    {idx + 1}. {block.split("\n")[0]}
                  </li>
                ))}
                {preview.length > 10 && (
                  <li>...dan {preview.length - 10} lainnya</li>
                )}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!text.trim() || !category || loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Mengimpor..." : `Impor ${preview.length} Entri`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
